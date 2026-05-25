# Run #034 — fix-world-scoped-player-data

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle
- **Spec source** :
  - [`docs/gameplay/19-world-lifecycle.md`](../../docs/gameplay/19-world-lifecycle.md) — lifecycle multi-mondes.
  - [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) — inbox rapports.
  - [`docs/gameplay/09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md) — puissance.
- **Type** : `fix`
- **Modules backend** : `power`, `combat/reports`
- **Modules frontend** : `pixi/api`, `pixi/features/combat`, `pixi/features/layout`

## Dépendances

- Run [`032`](./archive/032-world-lifecycle-foundation-and-identity.md) livré : lifecycle + identité monde.
- Run [`033`](./archive/033-feature-worlds-selection-screen.md) livré : écran royaumes et join multi-mondes.
- Préserver les contrats des runs [`012`](./archive/012-feature-inbox-combat-reports.md), [`016`](./archive/016-feature-scouting-backend-shared.md), [`017`](./archive/017-feature-scouting-frontend-inbox.md) et [`025`](./archive/025-fix-origin-anchored-army-power.md).

## Critère de fin (acceptance)

- [ ] Audit global des endpoints/hooks visibles joueur : toute donnée dépendante d'un monde est classée `world-scoped`, `à corriger`, ou `global intentionnel`.
- [ ] Pour un même user membre de deux mondes, `GET /power/kingdom` en contexte monde A retourne uniquement les villages/power de A.
- [ ] `GET /power/leaderboard` et `GET /power/kingdom/:userId/public` ont un comportement explicitement tranché : world-scoped ou global intentionnel documenté.
- [ ] Dans un monde fraîchement rejoint sans reports, `GET /combat/reports` et `GET /combat/scout-reports` retournent `[]` même si le user a des reports ailleurs.
- [ ] `GET/PATCH/DELETE /combat/report/:id` refuse ou masque un rapport d'un autre monde, même si le user en est participant.
- [ ] `GET/PATCH/DELETE /combat/scout-report/:id` refuse ou masque un rapport scout d'un autre monde, même si `scoutUserId` correspond.
- [ ] Les query keys Pixi `kingdomPower`, `combatReports`, `scoutReports` et détails reports incluent `worldId` ou un équivalent empêchant le cache cross-world.
- [ ] Les invalidations WS reports/power ciblent les nouvelles keys world-scoped sans casser combat, scout, conquête, training ou buildings.
- [ ] En rejoignant un monde frais, HUD/profil n'affichent plus la puissance ni le nombre de villages de l'ancien monde.
- [ ] Sur `/game/messages` dans un monde frais, les anciens rapports combat/scout ne sont plus visibles.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- React/Zustand/TanStack : skill `bftc-react-hud`
- Prisma : skill `bftc-prisma` si le schema est touché.

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

### Draft de départ

- T0 — Audit systématique user-scoped vs world-scoped :
  - backend controllers/services qui filtrent `userId` sans `worldId`;
  - hooks/query keys TanStack keyés user seulement;
  - données visibles joueur à classer `à corriger`, `déjà OK`, `global intentionnel`.
- T1 — Choisir la source de `worldId` pour endpoints privés : query explicite ou header `x-world-id`; valider l'appartenance au monde côté backend.
- T2 — Scoper `PowerService.getKingdomPower` au monde courant, préserver le calcul origin-anchored, et trancher `leaderboard` + `public kingdom power`.
- T3 — Scoper listes, détail, read et delete des `CombatReport` et `ScoutReport` au monde courant.
- T4 — Mettre à jour query keys/hooks Pixi power/reports/report details pour inclure `worldId` et désactiver les queries sans monde courant.
- T5 — Aligner les invalidations WS power/reports sur les nouvelles keys world-scoped.
- T6 — Ajouter un smoke backend multi-world : même user, deux mondes, power/reports séparés.
- T7 — Ajouter tests Pixi ciblés, puis décider si l'invariant multi-world doit être backprop dans docs/SPEC.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] Audit global endpoints/hooks — `grep/rg + lecture ciblée` → à compléter.
  - [ ] Power kingdom world-scoped — `smoke REST/SQL` → à compléter.
  - [ ] Reports combat/scout world-scoped — `smoke REST/SQL` → à compléter.
  - [ ] Report detail/read/delete cross-world refusés — `smoke REST` → à compléter.
  - [ ] Query keys Pixi world-scoped — `Vitest/grep` → à compléter.
  - [ ] QA IG monde frais — `visuel/gameplay` → à compléter.
- **Review indépendante** : `Déclenchée (raison: backend + frontend, diff estimé > 100 lignes, invariant durable multi-world isolation)`.
- **Tests automatisés** : à compléter.
- **Smokes ajoutés/modifiés** : à compléter.
- **QA fonctionnelle agent** : à compléter.
- **Tests IG à faire par le user** : à compléter.

## Liens détectés

- **À faire avant** : aucun.
- **À faire après** : potentiel follow-up si T0 révèle d'autres surfaces non world-scoped hors power/reports.
- **Doublon potentiel** : aucun.
- **Connexe** :
  - [`012 — Inbox combat reports`](./archive/012-feature-inbox-combat-reports.md) — accès participant/read/delete à préserver.
  - [`016 — Feature scouting backend shared`](./archive/016-feature-scouting-backend-shared.md) — `ScoutReport.worldId` et endpoints scout.
  - [`017 — Feature scouting frontend inbox`](./archive/017-feature-scouting-frontend-inbox.md) — inbox mixte combat/scout côté Pixi.
  - [`025 — Puissance armée rattachée au village d'origine`](./archive/025-fix-origin-anchored-army-power.md) — calcul power origin-anchored à préserver.
  - [`032 — Lifecycle backend foundation + identité monde`](./archive/032-world-lifecycle-foundation-and-identity.md) — socle multi-mondes.
  - [`033 — Écran sélection royaumes Pixi`](./archive/033-feature-worlds-selection-screen.md) — flow qui expose le bug.
  - [`70 — Ouvrir la fiche joueur depuis l'avatar IG`](../archive/70-integrate-player-profile-sheet.md) — profil affiche puissance/villages/monde.
- **Déjà résolu** : aucun ne corrige l'isolation multi-world de power/reports.
- **Keywords scannés** : `world`, `reports`, `inbox`, `power`, `village`, `membership`, `scout`, `combat`.

## Points d'attention

- Le client envoie déjà `x-world-id`, mais aucun usage backend fiable n'a été confirmé.
- `CombatReport`, `ScoutReport` et `Village` ont déjà `worldId` : éviter une migration inutile.
- Ne pas corriger seulement les listes : détails/read/delete reports doivent aussi refuser le cross-world.
- Ne pas casser les contrats de lecture/suppression par participant et le retour d'armée découplé du report.
- `resources`, `population`, `buildings`, `army` sont majoritairement village-scoped : les garder hors changement sauf preuve T0 contraire.
- Worktree dirty connu avant run : changements 071 + navigation monde. Ne pas les revert.
