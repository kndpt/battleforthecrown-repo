# Run #051 — feature-rankings-glory

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — Post-MVP, classements publics. Premier vertical retenu sans `$bftc-slice` : scoring + API + affichage minimal + docs, rewards cosmétiques avancés exclus.
- **Spec source** : [`docs/gameplay/24-rankings.md`](../../docs/gameplay/24-rankings.md)
- **Type** : `feature`
- **Modules backend** : `power`, `combat`, nouveau module/service `rankings` probable, `prisma/schema.prisma`
- **Modules frontend** : `api/queries.ts`, `api/ws-bindings.ts`, fiche/profil joueur si pertinent, nouvel écran ou panneau classements
- **Modules transverses** : `packages/shared/src/rankings/*` probable, `packages/shared/src/power/weights.ts` à préserver, docs gameplay/architecture/tasks

## Décisions de cadrage

1. **Pas de `$bftc-slice` pour ce premier run.** Le scope est large, mais un vertical cohérent et testable existe : modèle de scoring, API, affichage minimal, tests et docs. Découper maintenant ajouterait surtout de la coordination.
2. **Piste recommandée : ledger durable append-only** au moment de la résolution combat, avec agrégats leaderboard par cycle. Le calcul à la volée depuis `CombatReport` est à éviter car le multiplicateur adversaire et l'anti-farm doivent être snapshotés.
3. **Rewards avancés hors scope.** Le run ne doit pas attribuer couronnes, ressources, réduction de temps, bonus de production, bonus d'attaque ou bonus de conquête. Les titres/bannières/badges permanents pourront être branchés plus tard.
4. **Ne pas modifier les poids de puissance.** `NOBLE=100` reste le poids de puissance ; `NOBLE=400` est uniquement une valeur de bataille pour les classements.
5. **Le leaderboard actuel de puissance doit être aligné avec “Puissance du Royaume”.** Si `/power/leaderboard` classe encore des villages, le run doit corriger ou compléter le contrat public pour classer des royaumes/joueurs.

## Dépendances

- Aucune dépendance bloquante active.
- Runs prérequis déjà archivés :
  - [`025 — Puissance armée rattachée au village d'origine`](./archive/025-fix-origin-anchored-army-power.md)
  - [`034 — Isolation multi-monde des données joueur`](./archive/034-fix-world-scoped-player-data.md)
  - [`012 — Inbox combat reports`](./archive/012-feature-inbox-combat-reports.md)
  - [`047 — Rapports de capture`](./archive/047-feature-capture-reports.md)
- Ancien ticket design à ignorer comme direction produit : [`12 — Récompenses classements & cycles reset non chiffrés`](../archive/12-rankings-rewards-undefined.md), remplacé par la spec `24`.

## Critère de fin (acceptance)

- [ ] Les valeurs de bataille correspondent à la spec, avec `NOBLE=400` sans modifier le poids de puissance `NOBLE=100`. _(auto : test shared)_
- [ ] Le multiplicateur adversaire utilise les puissances royaume snapshot au lancement et est clampé entre `0.35` et `1.25`. _(auto : test shared/backend)_
- [ ] Un combat PvP crédite la Gloire d'Assaut de l'attaquant depuis `lossesDefender`, même si l'attaque échoue. _(auto : test/smoke)_
- [ ] Un combat PvP crédite la Gloire du Rempart du défenseur depuis `lossesAttacker`, même si la défense perd. _(auto : test/smoke)_
- [ ] Aucun point n'est accordé pour combat barbare, scout sans combat, ou combat entre villages du même joueur. _(auto : test/smoke)_
- [ ] Le rendement décroissant par paire de joueurs sur 24 h applique les seuils `2 000` / `5 000` points bruts documentés. _(auto : test/SQL)_
- [ ] Les endpoints retournent des leaderboards world-scoped pour puissance live, assaut hebdomadaire, rempart hebdomadaire, assaut monde entier et rempart monde entier. _(auto : curl/test)_
- [ ] Aucun endpoint ou mutation de classement n'attribue couronnes, ressources, réduction de temps, bonus de production, bonus d'attaque ou bonus de conquête. _(auto : smoke/grep)_
- [ ] Le frontend affiche les trois signaux avec les noms UI exacts : `Puissance du Royaume`, `Gloire d'Assaut`, `Gloire du Rempart`. _(visuel/gameplay IG)_
- [ ] La roadmap/docs ne renvoient plus les classements vers l'ancienne section post-MVP de `docs/gameplay/09-power-and-rankings.md`. _(auto : grep)_

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma` si schema/migration touchés
- Workers/Outbox : skill `bftc-workers-outbox`
- React/HUD : skill `bftc-react-hud`

## Liens détectés

- **À faire avant** : Aucun.
- **À faire après** : [`docs/gameplay/21-alliances-and-tribes.md`](../../docs/gameplay/21-alliances-and-tribes.md) — future catégorie collective alliances/tribus possible, hors scope actuel.
- **Doublon potentiel** : Aucun actif.
- **Connexe** :
  - [`025 — Puissance armée rattachée au village d'origine`](./archive/025-fix-origin-anchored-army-power.md) — source de vérité puissance armée d'origine.
  - [`034 — Isolation multi-monde des données joueur`](./archive/034-fix-world-scoped-player-data.md) — endpoints power/leaderboard world-scoped.
  - [`012 — Inbox combat reports`](./archive/012-feature-inbox-combat-reports.md) — `CombatReport` persistant.
  - [`047 — Rapports de capture`](./archive/047-feature-capture-reports.md) — rôles participant/observateur.
  - [`21 — Garde-fou puissance ÷ 3 fuite la puissance défensive`](../archive/21-power-guardrail-leaks-defender-power.md) — anti-snowball et snapshot de puissance.
  - [`70 — Ouvrir la fiche joueur depuis l'avatar IG`](../archive/70-integrate-player-profile-sheet.md) — fiche profil avec rang/stats à vérifier avant intégration.
- **Déjà résolu (archive)** : [`12 — Récompenses classements & cycles reset non chiffrés`](../archive/12-rankings-rewards-undefined.md) — ancienne direction supersédée par `docs/gameplay/24-rankings.md`.
- **Keywords scannés** : `rankings`, `classements`, `classement`, `gloire`, `assaut`, `rempart`, `puissance`, `leaderboard`, `lossesAttacker`, `lossesDefender`, `CombatReport`.

## Décomposition initiale (rempli par le lead à l'étape 3)

> Draft de cartographie (`run_planner`). À raffiner à l'étape 3 du `$bftc-run`.

- **T1 — Shared rankings** : ajouter les primitives pures de ranking : valeurs de bataille unités, exception `NOBLE=400`, clamp multiplicateur, facteur paire 24 h. Tests purs obligatoires.
- **T2 — Modèle durable backend** : créer la migration Prisma pour scores/ledger/cycles/snapshots nécessaires. Préférer un ledger append-only auditable et ne pas modifier les rapports existants pour porter toute la logique.
- **T3 — Scoring combat PvP** : brancher le scoring à la résolution combat PvP : snapshot puissance au lancement, attribution Assaut depuis `lossesDefender`, Rempart depuis `lossesAttacker`, exclusions barbares/scout/same-owner.
- **T4 — API classements world-scoped** : exposer Puissance du Royaume, Gloire d'Assaut et Gloire du Rempart, vues hebdomadaire et monde entier, `limit` validé et contrat public documenté.
- **T5 — Realtime/invalidation minimale** : invalider les queries de classement après score modifié via event ou binding existant, sans créer de rewards économiques.
- **T6 — Frontend classement** : ajouter queries typées, clés world-aware, écran/panneau classements avec les trois signaux et libellés exacts de la spec.
- **T7 — Profil joueur** : renseigner les stats/rangs publics pertinents si le contrat est clair ; sinon garder l'entrée classement séparée et documenter le report.
- **T8 — Tests, smokes, docs** : couvrir shared unit, smoke PvP scoring, curl leaderboard, docs architecture, drift roadmap `tasks/00-mvp-roadmap.md`.

## Points d'attention

- Le leaderboard actuel `/power/leaderboard` peut classer des villages au lieu des royaumes/joueurs ; aligner avec `Puissance du Royaume`.
- `CombatReport` contient les pertes utiles, mais pas le multiplicateur adversaire snapshot au lancement ; ne pas calculer ce multiplicateur à l'arrivée depuis une puissance live.
- Les défenseurs multi-propriétaires existent partiellement via garnisons ; préparer la distribution future sans implémenter les alliances.
- `tasks/00-mvp-roadmap.md` mentionne encore les classements via `09-power-and-rankings.md` en post-MVP ; corriger ce drift dans le run.
- Ne pas réintroduire les rewards économiques de l'ancien ticket `12`.
- Le workspace peut être dirty avec la spec `24` non commitée si ce run est lancé juste après sa création ; ne pas la revert.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** : _(rempli à l'étape 10)_
- **Review indépendante** : `Déclenchée` requise (raison : (a) back+front, (c) diff estimé > 100 lignes, (d) invariant durable de scoring/classement).
- **Tests automatisés** : _(rempli à l'étape 10)_
- **Smokes ajoutés/modifiés** : _(rempli à l'étape 10)_
- **QA fonctionnelle agent** : _(rempli à l'étape 10)_
- **Tests IG à faire par le user** : _(rempli à l'étape 10)_
