# Run #012 — feature-inbox-combat-reports

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] Un combat résolu crée une entrée persistante visible dans l'inbox — preuve : test auto / smoke / API.
  - [ ] L'ouverture du rapport marque l'entrée comme lue et met à jour le badge — preuve : test frontend ou smoke fonctionnel.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : seulement ce qui demande une appréciation gameplay/visuelle, un vrai navigateur humain, ou un scénario trop coûteux à automatiser ; checklist observable. Sinon `Aucun test IG nécessaire`, raison.

## Points d'attention

- La spec 17 est encore en chantier : le run doit commencer par figer un MVP minimal, sinon le scope dérive vers scout/conquête/push.
- Le code a déjà `CombatReport`, `/combat/reports`, `/combat/report/:id`, `isRead`, delete, écran `MessagesScreen` et badge unread : éviter de reconstruire une inbox complète si une extraction progressive suffit.
- `EventOutbox` est un mécanisme de diffusion WS, pas une archive métier évidente ; recycler cette table comme inbox doit être justifié avant implémentation.
- Le frontend parle encore "Rapports de combat", pas inbox transverse ; acceptable pour ce premier run si le contrat MVP limite explicitement la catégorie à combat.
- Si le refinement révèle une migration `Report` transverse, segmenter en deux runs au lieu d'embarquer scout/conquête/push.

## Notes

Premier run Phase 2 recommandé : finaliser le MVP inbox dans la spec puis livrer l'inbox combat seulement. Ne pas embarquer scout, conquête, push deep-link, archivage/pin, filtres avancés ou rétention automatique sauf décision minimale nécessaire au contrat.
