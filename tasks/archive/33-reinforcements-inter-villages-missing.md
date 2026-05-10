# 33 — Renforts inter-villages : 100 % non implémenté côté backend

**Sévérité** : 🟠 Majeur (feature spec MVP manquante)
**Statut** : 🏃 RUNNING 2026-05-10 (Démarré)
**Spec amont** : [ticket 13](./archive/13-reinforcements-between-own-villages.md) (✅ Résolu spec 2026-05-09) — règles tranchées, ce ticket couvre l'implémentation.

## Symptôme

La spec [`docs/gameplay/04-combat.md` § Renforts entre ses propres villages](../docs/gameplay/04-combat.md#renforts-entre-ses-propres-villages) décrit une mécanique complète (action « Renforcer », trajet combat-like, garrison stationnée, retrait B→A, exclusion fenêtre conquête). La spec marque elle-même : **« 🔓 Statut implémentation : spec MVP — pas encore implémenté côté backend »**.

`grep -r 'reinforce\|RECALL\|reinforcement\|garrison'` côté backend → **0 hit** sur le combat module. Aucune piste partielle. À coder de zéro.

## État actuel

Audit run 004 :
- `combat.service.ts` ne connaît que les expéditions hostiles (`InitiateAttackDto.targetKind ∈ {BARBARIAN_VILLAGE, PLAYER_VILLAGE}`) — pas de cible « village allié ».
- Modèle Prisma `Expedition` n'a pas de discriminant « renfort vs raid ». Aucun champ `garrisonOriginVillageId` sur `UnitInventory`.
- `combat.worker.ts` résout systématiquement par strategy → résolution combat. Pas de short-circuit « stationner les troupes sans combat ».
- `Population.used` est décrémentée de l'attaquant à `battle.resolved` (cf. spec : la pop reste consommée par A même quand les troupes sont en garnison à B → le décrément ne doit avoir lieu **qu'à la mort**, pas au stationnement). Le pattern actuel ne distingue pas.

## Scope d'implémentation (estimation > 50 lignes net)

### Modèle DB

- Ajouter `OutboundExpeditionKind ∈ {RAID, REINFORCEMENT}` (ou réutiliser `targetKind` étendu : `OWN_VILLAGE`).
- Nouveau champ ou table : `Garrison` ou `UnitInventoryReinforcement` :
  - `villageId` (host = village B)
  - `originVillageId` (= village A, pour pop tracking + retrait + libération à la mort)
  - `unitType`, `quantity`
  - clé unique composée
- Migration Prisma + `prisma generate`.

### Endpoint

- `POST /combat/reinforce` (body : `villageId` source, `targetVillageId`, `units`).
- Validation Zod : `OwnershipService.assertVillageOwnedBy` sur source ET cible.
- Anti-pattern : éviter une 2ᵉ route — réutiliser `/combat/attack` avec un flag est plus court mais perd la sémantique (le frontend doit clairement distinguer).

### Worker arrival

- Étendre `combat.worker.ts` ou créer `reinforce.worker.ts` (job `combat:reinforce-arrival`).
- À l'arrivée : créer `Garrison` rows, **pas** de combat, **pas** de loot, **pas** de pertes.
- Émettre `garrison.added` (nouveau type d'event Outbox).

### Retrait B → A

- Re-déclencher un POST `/combat/reinforce` depuis B vers A avec `units` issus de la garrison de B (non du `UnitInventory` de B).
- Le worker arrival ré-injecte dans `UnitInventory` de A (et libère la `Garrison` row).

### Combat subi par B

- `buildPlayerDefender` doit agréger `UnitInventory` (troupes propres) + `Garrison` (renforts) pour le calcul de `defender.units`.
- En cas de pertes : répartir les pertes proportionnellement entre troupes propres et chaque origine de renfort, puis libérer `Population.used` du village d'origine correspondant à chaque renfort mort.

### Fenêtre conquête

- Cf. [`14-pvp-conquest.md` § Garnison d'occupation](../docs/gameplay/14-pvp-conquest.md). Pendant la fenêtre PvP, refuser tout `/combat/reinforce` vers la garnison d'occupation.

### Rappel pendant l'aller

- Couplé au ticket [34](./34-army-recall-missing.md) — même flow qu'un raid.

### Bonus de style

- La spec dit explicitement : « le bonus de style suit la troupe ». Donc la `Garrison` row doit garder l'origine pour appliquer `getStrategyBonusValue(strategyOriginA, 'defenseBonus')` au moment du combat subi par B, **pas** la stratégie de B.

## Tests

- Unit pure-logic uniquement sur les helpers extraits (répartition pertes proportionnelle, agrégation defender.units).
- Reste = smoke (vraie DB, flow REST + worker + event).

## Tradeoff scope

Feature autonome ≈ 2-3 jours dev. Hors scope MVP « marche tout court » → **à prioriser quand la conquête PvP devient le focus** (post-Phase 4 conquête de base, avant Phase 6 intermondes). La spec [`02-economy-and-progression.md` § Population](../docs/gameplay/02-economy-and-progression.md#population) et [`12-village-styles.md`](../docs/gameplay/12-village-styles.md) seront des sources d'invariants critiques.

## Question à trancher au démarrage

1. Schema : table `Garrison` dédiée vs colonne `originVillageId` sur `UnitInventory` (ce dernier complique les rollbacks de pertes). Recommandation : table dédiée.
2. Endpoint : `/combat/reinforce` séparé vs flag sur `/combat/attack`. Recommandation : route séparée.
3. Type d'expedition `OWN_VILLAGE` (3ᵉ valeur de `TargetKind`) vs nouveau enum `ExpeditionKind`. Recommandation : étendre `TargetKind`.
