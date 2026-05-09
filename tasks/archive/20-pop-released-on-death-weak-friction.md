# 20 — Pop libérée à la mort = friction offensive faible

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Constat** : divergence doc ↔ code. La doc disait *« pop libérée à la mort »* mais le code combat **ne touchait pas** à `Population.used`. Donc en pratique, perdre une armée = drain pop **permanent** (le contraire du symptôme du ticket).

**Décision** : aligner le **code → doc**. Pop libérée immédiatement à la résolution du combat (modèle Tribal Wars / Kingsage). Friction = uniquement ressources + temps de re-train. Choix design assumé : la pop est un **stock instantané**, pas un coût permanent par bataille.

**Code modifié** :
- `battleforthecrown-backend/src/modules/combat/combat.worker.ts` :
  - Helper `sumPopulationCost(losses: UnitMap): number` (pure, importe `UNIT_COSTS` depuis `@battleforthecrown/shared/army`).
  - Décrément `population.used` du défenseur (PvP uniquement — barbares n'ont pas de `Population` row).
  - Décrément `population.used` de l'attaquant (PvP + barbares).
  - Le tout dans la même transaction Prisma que la mutation combat (atomicité Outbox respectée).
- `battleforthecrown-pixi/src/api/ws-bindings.ts` :
  - `applyBattleResolved` : invalide `['population', villageId]` (attaquant).
  - `applyVillageAttacked` : invalide `['population', defenderVillageId]` + `['army', defenderVillageId]`.

**Doc mise à jour** :
- `docs/gameplay/02-economy-and-progression.md` § Population : précision *« libérée immédiatement à la résolution du combat (pas au retour) »* + lecture design assumée *« friction = stock instantané, pas coût permanent »*.

**Choix design refusés** :
- Pop NON libérée à la mort (friction maximale) — trop punitif pour le early/mid game, casse les boucles de raid répété.
- Libérée avec délai de récupération — complexité d'un nouveau worker pour un signal joueur faible.

## QA

**Résultat attendu** : après une attaque où des unités meurent, la pop dispo du village attaquant remonte dès que l'expédition se résout (avant même le retour des survivants).

- [ ] Recruter ~10 MILITIA dans un village
- [ ] Noter la pop dispo (ex : 45/100)
- [ ] Lancer une attaque suicide (envoyer toutes les MILITIA contre un barbare T5 ou un joueur plus fort)
- [ ] Attendre l'event de résolution (notification "Défaite")
- [ ] Vérifier que la pop dispo a augmenté (ex : 55/100 si 10 MILITIA × 1 pop = 10 libérés)

## Symptôme

`docs/gameplay/02-economy-and-progression.md:56` — pop libérée à la mort de l'unité.

Conséquence : un joueur peut envoyer une armée, la perdre, recommencer sans drain pop persistant. La pop limite **uniquement les troupes vivantes au repos**, pas l'activité offensive.

Tension avec `02-economy.md:62` — narratif annoncé : « Choix exclusif : Bâtiments ? Armée ? Mélange ? ».

## Question à trancher

- Volontaire : la pop reste un **stock** dynamique, et le coût de l'erreur c'est uniquement les ressources de re-recrutement.
- Ou : ajouter une friction (pop libérée partiellement, recovery delay, coût en couronnes pour rappeler des « citoyens » ?).

Si statu quo : l'inscrire explicitement dans la doc pour empêcher la fausse promesse « armée vs infrastructure ».
