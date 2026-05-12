# Run #015 — close-phase-2-inbox-reports

> **Statut** : DONE
> **Démarré** : 2026-05-12 21:02 CEST
> **Terminé** : 2026-05-12 21:02 CEST

## Cible

- **Phase roadmap** : Phase 2 — Inbox & rapports (cf. `tasks/00-mvp-roadmap.md`)
- **Spec source** : [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) ; [`tasks/runs/archive/012-feature-inbox-combat-reports.md`](./archive/012-feature-inbox-combat-reports.md) ; [`docs/architecture/realtime.md`](../../docs/architecture/realtime.md)
- **Type** : `audit`
- **Modules backend** : `battleforthecrown-backend/src/modules/combat` ; `battleforthecrown-backend/src/modules/event` ; `battleforthecrown-backend/prisma/schema.prisma`
- **Modules frontend** : `battleforthecrown-pixi/src/features/combat` ; `battleforthecrown-pixi/src/api/queries.ts` ; `battleforthecrown-pixi/src/api/ws-bindings.ts`

## Dépendances

- Phase 1 close.
- Run [`012-feature-inbox-combat-reports`](./archive/012-feature-inbox-combat-reports.md) terminé et archivé.
- Contrat MVP Phase 2 déjà resserré sur les rapports de combat dans [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md).

## Critère de fin (acceptance)

- [ ] Le run `012` est relu comme source d'état réel Phase 2 et ses décisions sont comparées au code courant.
- [ ] Le code confirme REST reports, détail, read/delete par participant, unread badge et invalidation WS attaquant/défenseur.
- [ ] [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md) ne décrit plus un chantier ouvert incompatible avec l'état livré.
- [ ] [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md) indique clairement si la Phase 2 est close ou s'il reste un delta explicite.
- [ ] Si un écart fonctionnel réel est trouvé, il est corrigé ou ticketé précisément avec preuve.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- T1 — Relire le run `012`, la spec `17`, la roadmap et les docs architecture comme sources d'état Phase 2.
- T2 — Cartographier le code actuel : `CombatReport`, endpoints REST, read/delete participant-scoped, invalidation WS, badge unread et tests existants.
- T3 — Corriger uniquement les incohérences documentaires si le code confirme le contrat MVP.
- T4 — Vérifier par tests statiques/ciblés que le repo reste sain, puis archiver le run.

## Progress (rempli pendant le run)

- [x] Préflight : worktree clean, fiche `PLANNED`, spec Phase 2, rules, `SPEC.md`, briefings backend/frontend et skills spécialisés lus.
- [x] Cartographie : le contrat MVP Phase 2 est déjà présent côté code et tests ; aucun delta backend/frontend requis.
- [x] Refinement : scope ramené à un alignement documentaire + clôture de run, car la roadmap/spec contenaient encore des formulations pré-run `012`.
- [x] Écriture : `docs/gameplay/17-inbox-and-reports.md` et `tasks/00-mvp-roadmap.md` alignés avec l'état livré.
- [x] Review 5 axes : pas de finding bloquant ; diff documentaire cohérent avec le code observé.
- [x] Vérification : `yarn static-check` vert ; smokes backend non applicables car aucun fichier backend `src/` modifié.
- [x] Archivage : fiche déplacée vers `tasks/runs/archive/` et index `tasks/README.md` mis à jour.

## Décisions prises

- Pas de table `Report` transverse : le run `012` et la spec `17` confirment `CombatReport` comme source persistante Phase 2 MVP.
- Pas de changement code : la cartographie confirme REST reports, détail, read/delete par participant, unread badge, invalidation WS attaquant/défenseur, smoke backend et test WS existants.
- Pas de nouveau ticket : les éléments hors scope (scout, conquête détaillée, push deep-link, filtres, pin, archive, rétention automatique) sont déjà explicitement reportés hors Phase 2 MVP.

## Rapport final

Run livré.

- Phase 2 clôturée côté roadmap comme MVP combat livré.
- Spec inbox corrigée : elle ne dit plus que l'inbox n'existe pas encore ; elle décrit maintenant l'état MVP livré pour les rapports de combat.
- Aucun changement backend/frontend requis : la cartographie confirme que le code courant couvre le contrat Phase 2 via `CombatReport`, REST, WS, badge non-lu et tests existants.
- Aucun ticket ouvert : les sujets scout, conquête détaillée, push deep-link, filtres, pin, archive et rétention automatique restent hors Phase 2 MVP.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Le run `012` est relu comme source d'état réel Phase 2 — preuve : décisions `CombatReport`, read/delete par participant, invalidation WS et QA reprises dans la cartographie.
  - [x] Le code confirme REST reports, détail, read/delete par participant, unread badge et invalidation WS — preuve : `schema.prisma`, `combat.controller.ts`, `combat.service.ts`, `queries.ts`, `ws-bindings.ts`, `MessagesScreen.tsx`.
  - [x] `docs/gameplay/17-inbox-and-reports.md` ne décrit plus un chantier ouvert incompatible avec l'état livré — preuve : formulation mise à jour dans § Pourquoi c'est obligatoire au MVP.
  - [x] `tasks/00-mvp-roadmap.md` indique clairement la clôture Phase 2 MVP combat — preuve : statut `clos MVP combat` ajouté dans la Phase 2.
  - [x] Aucun écart fonctionnel réel trouvé — preuve : smoke existant `combat reports: list, read, and delete are scoped to the current participant` et test WS `applyBattleResolved` / `applyVillageAttacked` déjà présents.
- **Tests automatisés** :
  - `yarn static-check` — OK.
- **Smokes lancés** : Non applicable, raison : diff strictement documentaire + fiche run, aucun fichier `battleforthecrown-backend/src/` modifié.
- **Smokes ajoutés/modifiés** : Aucun, raison : aucun changement fonctionnel ; les smokes Phase 2 existent déjà dans `battleforthecrown-backend/test/smoke.spec.ts`.
- **QA fonctionnelle agent** : Non nécessaire, raison : clôture documentaire basée sur cartographie de code/tests existants, sans mutation runtime.
- **Tests IG à faire par le user** : Aucun test IG nécessaire, raison : aucun changement UI/runtime.

## Points d'attention

- Ne pas refaire le run `012` : ce run est une clôture/validation delta de Phase 2.
- Ne pas introduire de table `Report` transverse sans écart réel : le contrat MVP actuel garde `CombatReport` comme source persistante.
- Scout, conquête détaillée, push deep-link, filtres, pin, archive et rétention automatique restent hors scope Phase 2 MVP sauf contradiction explicite trouvée pendant la cartographie.
- Si le run révèle un vrai manque produit non trivial, ouvrir un ticket ou proposer un second run ciblé plutôt que gonfler ce run de clôture.

## Notes

Ce run sert à aligner la roadmap et les docs avec l'état réel après le run `012`, puis à fermer proprement la Phase 2 si aucun delta fonctionnel bloquant n'est trouvé.
