# 01 — Raids barbares sans risque réel

**Sévérité** : 🔴 Critique
**Workspace(s)** : `battleforthecrown-backend`, `packages/shared`, `docs/gameplay`
**Tags** : combat, barbarians, risk-reward, economy

## Symptôme

Les attaques contre les villages barbares sont actuellement résolues comme du pillage sans pertes pour l'attaquant. La boucle militaire documentée repose pourtant sur des raids barbares comme première activité active, puis comme levier économique important. Si cette boucle n'a aucun risque, elle devient une optimisation de capacité de transport plutôt qu'une décision stratégique.

## Localisation

- `battleforthecrown-backend/src/modules/combat/strategies/barbarian-village.strategy.ts:17` — commentaire explicite `MVP: No losses for attacker`.
- `battleforthecrown-backend/src/modules/combat/strategies/barbarian-village.strategy.ts:18-20` — pertes attaquant vides, défenseur sans troupes, survivants identiques aux unités envoyées.
- `docs/gameplay/01-overview.md:44-51` — la boucle militaire décrit les barbares comme activité de pillage et d'apprentissage.
- `docs/gameplay/02-economy-and-progression.md:134-147` — le design vise un équilibre 50/50 production passive vs pillage actif.

## Détail

Le code backend traite le village barbare comme une source de ressources défendue par aucune armée. Le résultat est que la difficulté d'un raid barbare dépend surtout du trajet, du stock de la cible et de la capacité de transport, pas d'une évaluation combat.

> **Update 2026-05-06** (cf. [audit archi 07](../../architecture/audit/07-shared-dead-barbarian-templates.md)) — les templates barbares ne déclarent **plus** d'unités du tout (`UnitTemplate` / `getUnitTemplate` supprimés ; `tx.unitInventory.createMany` retiré de la factory). L'absence de défenseurs est désormais explicite : si l'on veut redonner des troupes aux barbares pour ce ticket gameplay, il faudra les ajouter aux templates avec les types maîtres (`UNIT_TYPES`) et adapter `BarbarianVillageStrategy` pour qu'elle lise `village.unitInventory` (au lieu d'injecter `units: {}`).

## Impact gameplay

- Le joueur apprend que l'attaque est gratuite tant qu'il cible des barbares.
- Les unités rapides et porteuses deviennent naturellement dominantes.
- La tension de combat est reportée brutalement au PvP, au lieu d'être apprise progressivement.
- Le pillage actif peut accélérer la progression sans contrepartie proportionnelle.
- Les rapports de combat barbares risquent de manquer d'émotion : pas de pertes, pas de suspense, pas de décision mémorable.

## Questions ouvertes

- Les villages barbares sont-ils censés avoir des troupes dès le MVP ou seulement plus tard ?
- Le tier barbare affiché sur la carte correspond-il aujourd'hui à une difficulté réelle ?
- Le joueur peut-il spammer les villages barbares proches sans coût durable autre que le temps de trajet ?

## Tickets liés

- [02 — Combat PvP trop binaire](./02-pvp-combat-too-binary.md)
- [09 — Cibles de carte peu informatives avant attaque](./09-map-targets-low-information.md)
- [11 — Objectif 50/50 production-pillage non garanti par les systèmes actuels](./11-production-raiding-balance-unproven.md)
