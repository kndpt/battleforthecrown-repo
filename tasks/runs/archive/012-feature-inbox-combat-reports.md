# Run #012 — feature-inbox-combat-reports

> **Statut** : DONE
> **Démarré** : 2026-05-11 21:45 CEST
> **Terminé** : 2026-05-11 22:30 CEST

## Cible

- **Phase roadmap** : Phase 2 — Inbox & rapports (cf. `tasks/00-mvp-roadmap.md`)
- **Spec source** : [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) § Cible MVP — esquisse ; [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) ; [`docs/gameplay/06-barbarians.md`](../../docs/gameplay/06-barbarians.md) § Rapport de combat ; [`docs/architecture/realtime.md`](../../docs/architecture/realtime.md)
- **Type** : `feature`
- **Modules backend** : `battleforthecrown-backend/prisma/schema.prisma` ; `battleforthecrown-backend/src/modules/combat` ; `battleforthecrown-backend/src/modules/event` ; module inbox/reports à créer ou extraire si retenu
- **Modules frontend** : `battleforthecrown-pixi/src/features/combat/MessagesScreen.tsx` ; `ReportsList.tsx` ; `ReportDetailModal.tsx` ; `battleforthecrown-pixi/src/api/queries.ts` ; `battleforthecrown-pixi/src/api/ws-bindings.ts` ; bottom nav badge

## Dépendances

- Phase 1 considérée close.
- Combat existant fonctionnel avec création de `CombatReport` à la résolution.
- Migrations Prisma applicables sur DB locale/test avant vérification si le modèle persistant change.

## Critère de fin (acceptance)

- [ ] [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) contient un contrat MVP minimal tranché pour Phase 2 : catégories incluses, source de vérité, lu/non-lu, suppression/rétention MVP, payload REST/WS minimal.
- [ ] Un combat résolu crée une entrée persistante visible dans une inbox joueur via REST après reconnexion.
- [ ] L'inbox affiche uniquement les rapports accessibles au joueur connecté, triés du plus récent au plus ancien.
- [ ] L'ouverture d'un rapport marque l'entrée comme lue et le statut reste persistant après refetch/reload.
- [ ] Le compteur non-lu côté HUD/messages se met à jour après lecture et après arrivée d'un nouveau rapport de combat.
- [ ] Un événement WS lié à la résolution de combat invalide ou met à jour l'inbox sans attendre un refresh manuel.
- [ ] Le détail du rapport respecte l'asymétrie déjà existante pour les rapports barbares côté attaquant.
- [ ] La suppression d'un rapport, si conservée au MVP, ne casse pas le retour d'armée ni la restitution loot/survivants.
- [ ] Les tests/smokes couvrent au minimum : création rapport combat → liste inbox → lecture → unread count.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- T1 — Finaliser le contrat MVP de `docs/gameplay/17-inbox-and-reports.md` sans couvrir scout/conquête/push complets.
- T2 — Trancher l'architecture persistante minimale : garder `CombatReport` comme source Phase 2 initiale ou introduire `Report` dédié avec migration Prisma.
- T3 — Exposer une API inbox minimale côté backend, en réutilisant/adaptant les endpoints combat existants plutôt que multiplier les routes si inutile.
- T4 — Brancher l'événement WS/invalidation inbox sur la résolution de combat et aligner les schémas partagés si un nouvel event est nécessaire.
- T5 — Renommer/adapter l'écran Messages en inbox MVP de rapports combat, avec liste, détail, état vide, lu/non-lu et badge.
- T6 — Ajouter/ajuster tests backend pour accès joueur, marquage lu, suppression éventuelle et non-régression retour d'armée.
- T7 — Ajouter/ajuster tests frontend ciblés pour hooks/query invalidation, unread count et ouverture du détail.
- T8 — Smoke fonctionnel : lancer un combat scripté, vérifier DB/API/inbox/badge/lecture.

## Progress (rempli pendant le run)

- [x] Préflight : worktree clean ; fiche run, rules, SPEC, docs source, lessons et skills spécialisés lus.
- [x] Cartographie code : `CombatReport`, endpoints REST, `isRead`, suppression, `battle.resolved`, invalidation frontend et badge unread existent déjà.
- [x] Refinement : scope MVP retenu = inbox combat uniquement, `CombatReport` reste source de vérité Phase 2 ; bug à corriger = lu/non-lu doit être par participant attaquant/défenseur, pas global.
- [x] Implémentation : contrat MVP figé dans la doc gameplay, migration additive `CombatReport`, projection REST par participant, invalidation WS attaquant/défenseur, types shared alignés.
- [x] Tests : presenter unit, Vitest WS bindings, smoke REST reports, smokes backend complets.
- [x] Review : 5 axes effectués ; timeout smoke `noble.killed` élargi à 30s car le test passait isolé mais timeoutait en suite complète sous backlog worker.

## Décisions prises

- Dérogation préflight : le worktree contient des changements design-system préexistants hors scope (`DesignSystemPreview.tsx`, `components/index.ts`, `components/Tooltip.tsx`). User a demandé de continuer ; ces fichiers restent intouchés par le run inbox.
- Architecture MVP : pas de table `Report` transverse dans ce run. `CombatReport` porte l'inbox combat Phase 2 ; scout/conquête/push/archive/pin restent hors scope.
- Modèle lecture : le booléen global `isRead` est insuffisant pour un rapport PvP partagé. Le run ajoute un état lu/non-lu par participant sans migration destructive.

## Rapport final

Run livré.

- Contrat MVP inbox combat finalisé dans `docs/gameplay/17-inbox-and-reports.md`.
- `CombatReport` conservé comme source de vérité Phase 2 ; pas de table `Report` transverse.
- Migration additive : état lu/non-lu et suppression par participant (`readByAttacker/readByDefender`, `hiddenByAttacker/hiddenByDefender`), backfill depuis `is_read`.
- REST : liste/détail/read/delete filtrent maintenant les rapports masqués pour le joueur courant et projettent `isRead` selon son rôle.
- WS frontend : `battle.resolved` invalide l'inbox attaquant ; `village.attacked` invalide l'inbox défenseur.
- Docs architecture alignées (`data-model.md`, `realtime.md`).

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Contrat MVP minimal Phase 2 figé — preuve : `docs/gameplay/17-inbox-and-reports.md`.
  - [x] Un combat résolu crée une entrée persistante visible dans l'inbox REST après reconnexion — preuve : `yarn test:smoke`, smoke combat existant + nouveau smoke `/combat/reports`.
  - [x] L'inbox affiche uniquement les rapports accessibles au joueur connecté, triés récent → ancien — preuve : nouveau smoke `combat reports: list, read, and delete are scoped to the current participant`.
  - [x] Ouvrir/marquer lu persiste par participant — preuve : smoke `PATCH /combat/report/:id/read` attaquant puis détail défenseur encore non lu.
  - [x] Le compteur non-lu se met à jour après lecture/nouveau rapport — preuve : `ws-bindings.test.ts` invalide `queryKeys.combatReports(userId)` sur `battle.resolved` et `village.attacked`; mutation read invalide déjà la query.
  - [x] Event WS de résolution invalide l'inbox — preuve : `applyBattleResolved` + `applyVillageAttacked` testés.
  - [x] Asymétrie barbare conservée — preuve : `combat-report.presenter.spec.ts`.
  - [x] Suppression sans casse retour armée/loot — preuve : smoke existant `combat: report deleted in-flight -> troops still return`.
  - [x] Création rapport → liste inbox → lecture → unread count — preuve : smoke REST + Vitest WS bindings.
- **Tests automatisés** :
  - `yarn workspace battleforthecrown-backend prisma generate` — OK.
  - `yarn workspace @battleforthecrown/shared build` — OK.
  - `yarn workspace battleforthecrown-backend test -- combat-report.presenter.spec.ts` — OK, 4 tests.
  - `yarn workspace battleforthecrown-pixi test -- ws-bindings.test.ts` — OK, 13 tests.
  - `yarn test:smoke:preflight` — OK après migration smoke.
  - `yarn test:smoke` — OK, 7 suites / 27 tests.
  - `yarn static-check` — OK.
- **Smokes lancés** : `yarn test:smoke` — OK, backend touché.
- **Smokes ajoutés/modifiés** :
  - `battleforthecrown-backend/test/smoke.spec.ts` — ajout scénario REST list/read/delete par participant.
  - `battleforthecrown-backend/test/combat-conquest-hook.smoke.spec.ts` — timeout `noble.killed`/`battle.resolved` porté à 30s pour stabilité suite complète.
- **QA fonctionnelle agent** : migration appliquée sur DB locale et DB smoke via `prisma migrate deploy`; smokes REST/DB/worker/Outbox verts.
- **Tests IG à faire par le user** : ouvrir `/game/messages`, vérifier visuellement liste/détail/suppression/badge sur un vrai combat. Aucun autre test IG nécessaire.

## Points d'attention

- La spec 17 est encore en chantier : le run doit commencer par figer un MVP minimal, sinon le scope dérive vers scout/conquête/push.
- Le code a déjà `CombatReport`, `/combat/reports`, `/combat/report/:id`, `isRead`, delete, écran `MessagesScreen` et badge unread : éviter de reconstruire une inbox complète si une extraction progressive suffit.
- `EventOutbox` est un mécanisme de diffusion WS, pas une archive métier évidente ; recycler cette table comme inbox doit être justifié avant implémentation.
- Le frontend parle encore "Rapports de combat", pas inbox transverse ; acceptable pour ce premier run si le contrat MVP limite explicitement la catégorie à combat.
- Si le refinement révèle une migration `Report` transverse, segmenter en deux runs au lieu d'embarquer scout/conquête/push.

## Notes

Premier run Phase 2 recommandé : finaliser le MVP inbox dans la spec puis livrer l'inbox combat seulement. Ne pas embarquer scout, conquête, push deep-link, archivage/pin, filtres avancés ou rétention automatique sauf décision minimale nécessaire au contrat.
