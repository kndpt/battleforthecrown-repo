# Run #034 — fix-world-scoped-player-data

> **Statut** : DONE
> **Démarré** : 2026-05-25
> **Terminé** : 2026-05-25

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

### Refinement lead

- Audit T0 — surfaces visibles joueur classées :
  - `power` : **à corriger** — `GET /power/kingdom`, `/power/leaderboard`, `/power/kingdom/:userId/public` agrégeaient par `userId` ou tous villages sans `worldId`; corrigé en world-scoped.
  - `combat/reports` : **à corriger** — listes, détail, read et delete combat/scout reports vérifiaient le participant mais pas `worldId`; corrigé en world-scoped.
  - `pixi/api` query keys : **à corriger** — `kingdomPower`, `combatReports`, `scoutReports`, détails reports et invalidations WS étaient keyés user/report seulement; corrigé avec `worldId`.
  - `village` / `world entities` : **déjà world-scoped** — endpoints listent via `worldId` explicite (`/village?worldId=...`, `/world/:worldId/entities`) ou contexte monde.
  - `resources`, `population`, `buildings`, `army`, `training`, `strategy`, `garrison` : **déjà isolés** — accès via `villageId` avec `assertVillageOwnedBy`; les ids de village sont déjà porteurs du monde.
  - `crowns`, `retention`, `openConquests`, `openExpeditions`, `worldConfig`, `worldDetails` : **déjà world-scoped** — query/path keyés `worldId` et/ou `assertWorldMember`.
  - `world/me/memberships`, `worlds/public`, auth/session : **global intentionnel** — surfaces cross-world nécessaires au sélecteur de royaumes et à l'identité compte.
- T1 — Backend power world-scoped (`power.controller.ts`, `power.service.ts`) :
  - `GET /power/kingdom` lit `x-world-id`, exige l'appartenance, agrège seulement les villages du monde courant.
  - `GET /power/leaderboard` et `GET /power/kingdom/:userId/public` deviennent explicitement world-scoped via query `worldId` obligatoire.
  - Critère : même user sur deux mondes retourne des puissances séparées.
- T2 — Backend reports world-scoped (`combat.controller.ts`, `combat.service.ts`) :
  - listes, détail, read et delete combat/scout reports exigent `x-world-id`, vérifient l'appartenance et filtrent par `worldId`.
  - Critère : un report d'un autre monde est absent des listes et refusé en détail/read/delete.
- T3 — Pixi query keys/invalidation (`queries.ts`, `ws-bindings.ts`, `ws-bindings.test.ts`) :
  - keys `kingdomPower`, `combatReports`, `scoutReports`, détails combat/scout incluent `worldId`.
  - invalidations WS power/reports ciblent le monde courant.
  - Critère : test prouvant que l'ancien monde n'est pas invalidé quand le monde courant diffère.
- T4 — Smoke multi-world (`battleforthecrown-backend/test/world-scoped-player-data.smoke.spec.ts`) :
  - un user rejoint deux mondes ; power et reports/scout reports restent isolés ; détails/read/delete cross-world refusés.
- T5 — Review, docs/SPEC impact, archive et commit.

## Progress (rempli pendant le run)

- [x] Préflight : git clean, fiche run, rules, SPEC, briefings backend/Pixi et docs source lus.
- [x] Cartographie ciblée backend/Pixi : fuites confirmées sur power, reports et query keys Pixi ; autres surfaces majeures déjà scoppées par `worldId` ou `villageId`.
- [x] Implémentation backend/frontend déléguée sur write sets séparés.
- [x] Smoke ciblé `combat-reports-inbox.smoke.spec.ts` : 2 tests OK, dont isolation multi-world power/reports.

## Décisions prises

- Les données joueur dépendantes d'un monde sont strictement world-scoped côté backend via `x-world-id` pour les endpoints privés et `worldId` query pour les endpoints publics power.
- Les endpoints publics `GET /power/leaderboard` et `GET /power/kingdom/:userId/public` sont publics mais explicitement par monde ; l'appartenance n'est pas requise.
- Les query keys Pixi de power/reports/détails reports incluent `worldId` pour empêcher le cache cross-world.
- Backprop SPEC : ajout de `SPEC.md` V3 pour prévenir le retour du pattern `userId` seul sur les données visibles joueur world-scoped.
- Review indépendante initiale : `BLOCK` sur audit trop implicite et matrice de tests incomplète ; findings corrigés puis re-review `GO`.

## Rapport final

- Backend : `power` et `combat/reports` filtrent désormais par monde courant pour les données joueur visibles.
- Frontend Pixi : query keys/invalidation WS `kingdomPower`, reports et détails reports portent le `worldId`.
- Smoke multi-world ajouté : même user dans deux mondes, power/reports/scout reports isolés, cross-world detail/read/delete refusés.
- Docs architecture + SPEC alignés avec le contrat public power par monde.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Audit global endpoints/hooks — `Audit T0 dans cette fiche + rg ciblés` → surfaces classées `à corriger`, `déjà world-scoped`, `global intentionnel`.
  - [x] Power kingdom world-scoped — `yarn workspace battleforthecrown-backend test:smoke --runTestsByPath test/combat-reports-inbox.smoke.spec.ts` → même user sur deux mondes, villages/power séparés.
  - [x] Public power world-scoped — `yarn workspace battleforthecrown-backend test:smoke --runTestsByPath test/combat-reports-inbox.smoke.spec.ts` → `leaderboard` et `kingdom/:userId/public` exigent `worldId`.
  - [x] Reports combat/scout world-scoped — `yarn workspace battleforthecrown-backend test:smoke --runTestsByPath test/combat-reports-inbox.smoke.spec.ts` → listes monde A excluent monde B.
  - [x] Report detail/read/delete cross-world refusés — `yarn workspace battleforthecrown-backend test:smoke --runTestsByPath test/combat-reports-inbox.smoke.spec.ts` → combat et scout `GET/PATCH/DELETE` cross-world en 404.
  - [x] Query keys Pixi world-scoped — `yarn workspace battleforthecrown-pixi test src/api/ws-bindings.test.ts` → keys/invalidation incluent `worldId`, ancien monde non invalidé.
  - [x] HUD/profil monde frais — `grep + query key review` → `useKingdomPowerQuery` dépend de `worldId`; cache ancien monde non réutilisé.
  - [x] `/game/messages` monde frais — `grep + query key review` → reports/scout reports/détails keyés par `worldId`.
- **Review indépendante** : Déclenchée (raison: backend + frontend, diff > 100 lignes, invariant durable multi-world isolation) — verdict final `GO` après corrections.
- **Tests automatisés** :
  - `yarn workspace battleforthecrown-pixi test src/api/ws-bindings.test.ts` → 1 fichier / 25 tests OK.
  - `yarn workspace battleforthecrown-backend build` → OK.
  - `yarn static-check` → OK.
- **Smokes lancés** : `yarn workspace battleforthecrown-backend test:smoke` → 24 suites / 49 tests OK. Logs intermittents pg-boss/Prisma observés pendant les smokes parallèles, sans échec de suite.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/combat-reports-inbox.smoke.spec.ts` couvre isolation multi-world power/reports/scout reports ; `combat-attack` et `combat-conquest-hook` ajoutent le header `x-world-id`.
- **QA fonctionnelle agent** : Non nécessaire au-delà des smokes REST/DB réels ; le changement est contractuel backend/cache, sans nouveau rendu interactif.
- **Tests IG à faire par le user** : Aucun test IG nécessaire, raison : comportement vérifié par REST smoke multi-world et tests de cache/invalidation Pixi.

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
