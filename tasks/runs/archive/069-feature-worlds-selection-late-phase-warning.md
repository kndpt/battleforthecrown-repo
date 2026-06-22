# Run #069 — feature-worlds-selection-late-phase-warning

> **Statut** : DONE
> **Démarré** : 2026-06-21
> **Terminé** : 2026-06-21

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle (complément Phase 11 / lifecycle dérivé, après run 032 + run 033 + run 042)
- **Spec source** : [`docs/gameplay/19-world-lifecycle.md` § Bascule cohorte principale → retardataires](../../docs/gameplay/19-world-lifecycle.md)
- **Type** : feature
- **Modules** : shared `world/lifecycle.ts` (helpers purs `formatWorldLaunchAgeFr` + `pickFreshAlternativeWorld` — aucun changement backend requis, `pickFreshAlternativeWorld` calcule la cible côté client à partir du `PublicWorld[]` existant) | frontend `features/worlds/worldsViewModel.ts` + `features/design-system/worlds/WorldsSelectionDesign.tsx` (bandeau + CTA "Rejoindre plutôt un monde plus frais")

## Dépendances

- Run 033 ✅ DONE (écran sélection mondes Pixi + variante design-system) — surface UI sur laquelle se greffer.
- Run 032 ✅ DONE (lifecycle foundation, `inscriptionPhase` dérivé + `GET /worlds/public` exposé).
- Aucune migration DB requise (helpers purs côté shared + UI).
- Recommandé d'avoir au moins 1 monde en phase `main` en parallèle pour QA IG (cf. run 064 planifié sur `world-recurring-planned-spawner`).

## Critère de fin (acceptance)

- [ ] Sur la card d'un monde en phase `late` dans `WorldsSelectionDesign`, un bandeau explicite « Lancé il y a {N} j » est rendu (texte humain FR, calé sur `now - startedAt` exprimé en jours, arrondi `floor`).
- [ ] Le bandeau est absent en phase `main` et en phase `closed` (la carte locked a déjà sa propre tonalité + libellé « Verrouillé »).
- [ ] Si un monde `main` est disponible dans la liste publique (`PublicWorld[]` retournée par `GET /worlds/public`), un CTA secondaire « Rejoindre plutôt un monde plus frais » est affiché sous le CTA principal sur la card `late` et sélectionne le monde frais le plus jeune via `pickFreshAlternativeWorld`.
- [ ] Si aucun monde `main` n'est disponible (= tous les `OPEN` sont en `late` ou `closed`), le CTA secondaire est masqué — pas de placeholder vide ni de bouton inerte.
- [ ] Le clic sur le CTA secondaire scrolle/ancrage vers la card du monde frais cible (réutilise le contrat existant des cards `WorldsSelectionDesign`) ; pas de mutation Join automatique (l'utilisateur valide via le CTA principal de la card frais).
- [ ] Helper pur shared `formatWorldLaunchAgeFr(startedAt, now)` exposé dans `packages/shared/src/world/lifecycle.ts` et couvert par vitest (cas : `< 1j` → « Lancé aujourd'hui », `1j-2j` → « Lancé hier » ou « Lancé il y a {N} j », `> 1j` → « Lancé il y a {N} j », `null/future` → null).
- [ ] Helper pur shared `pickFreshAlternativeWorld(currentWorld, candidates, now)` retourne le monde `main` au `startedAt` le plus récent (tri descendant), ou `null` si la liste est vide / tous candidates sont en `late|closed`. Exclusion explicite du `currentWorld` (ne se propose pas lui-même).
- [ ] Tests vitest `worldsViewModel.test.ts` étendus : un viewmodel sur monde `late` expose `launchAgeLabel: string` non null + `freshAlternativeWorldId: string | null`.
- [ ] Tests vitest `WorldsSelectionDesign.test.tsx` (ou nouveau) : rendu bandeau + CTA dans 3 scénarios (late + main disponible / late + uniquement late / main pur sans bandeau).
- [ ] Helpers shared exportés via `packages/shared/src/world/index.ts`.
- [ ] `static-check` vert.

## Références à respecter

- Rules : [`.agents/rules/communication.md`](../../.agents/rules/communication.md), [`.agents/rules/conventions.md`](../../.agents/rules/conventions.md), [`.agents/rules/docs.md`](../../.agents/rules/docs.md), [`.agents/rules/git.md`](../../.agents/rules/git.md), [`.agents/rules/harness.md`](../../.agents/rules/harness.md), [`.agents/rules/qa.md`](../../.agents/rules/qa.md)
- Skills : `bftc-react-hud` (CVA + Tailwind 3.4 + palette kingdom), `bftc-tests-policy` (helpers purs shared = vitest dédié, viewmodel = vitest, pas de mock-théâtre), `bftc-qa` (checklist Kelvin si QA IG nécessaire — éviter QA navigateur agent)
- Convention design-system : `WorldsSelectionDesign` reste UI idiote, viewmodel `worldsViewModel.ts` porte la logique (cohérent avec run 033)

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — Helpers purs shared** : ajouter `formatWorldLaunchAgeFr` + `pickFreshAlternativeWorld` dans `packages/shared/src/world/lifecycle.ts` + export via `index.ts` + tests vitest. Sources de vérité MVP FR.
- **T2 — Confirmation pas-de-change-backend** : `GET /worlds/public` retourne déjà la liste complète des mondes ; le consommateur calcule lui-même `freshAlternativeWorldId` côté front via le helper shared. Aucun ajout DTO requis. Garder le scope T2 pour : confirmation explicite à l'exécution + check rapide que `worlds-public.smoke.spec.ts` reste vert après les ajouts shared.
- **T3 — Viewmodel front** : étendre `WorldCardViewModel` (`worldsViewModel.ts`) avec `launchAgeLabel: string | null` + `freshAlternativeWorldId: string | null`. Calcul via helpers shared. Tests `worldsViewModel.test.ts`.
- **T4 — UI bandeau + CTA secondaire** : `WorldsSelectionDesign.tsx` rend bandeau « Lancé il y a {N} j » sur card `late` + CTA secondaire « Rejoindre plutôt un monde plus frais » câblé sur `onSelectFreshAlternative(worldId)`. Style aligné palette gold/late existante.
- **T5 — Tests UI + static-check** : test rendu composant (3 scénarios), `yarn static-check`, vérification regression existante `WorldsSelectionDesign.test.tsx`.

## Progress

_(git history)_

## Décisions prises

_(git history)_

## Rapport final

Helpers purs shared `formatWorldLaunchAgeFr` + `pickFreshAlternativeWorld` (lifecycle.ts) consommés par `worldsViewModel` (`launchAgeLabel`/`freshAlternativeWorldId`, phase `late` only) ; bandeau « Lancé il y a {N} j » + CTA secondaire « Rejoindre plutôt un monde plus frais » (ancrage scroll, pas de join auto) dans `WorldsSelectionDesign`. Aucun backend, aucune migration.

### Acceptance & QA

- [x] Bandeau « Lancé il y a {N} j » sur card `late` — `yarn workspace battleforthecrown-pixi test --run WorldsSelectionDesign` → test "shows the launch-age banner..." vert
- [x] Bandeau absent en `main`/`closed` — `worldsViewModel.test.ts` "hides the launch-age banner... outside the late phase" + UI "renders no launch-age banner on a main-phase world" → verts
- [x] CTA secondaire si `main` dispo, sélectionne le plus jeune — `pickFreshAlternativeWorld` tri desc + `worldsViewModel.test.ts` "exposes a launch-age banner and a fresh alternative" → `freshAlternativeWorldId === 'fresh-main'`
- [x] CTA masqué si aucun `main` — UI "shows the banner but no CTA" + viewmodel "every other world is also late" → null
- [x] Clic CTA ancre vers la card cible, pas de join auto — `WorldSelector.onSelectFreshAlternative` (setActiveTab('open') + scrollIntoView, zéro mutation) ; UI test asserte `onSelectFreshAlternative('fresh-main')`
- [x] `formatWorldLaunchAgeFr` couvert vitest (aujourd'hui/hier/{N}j/null/futur/ISO) — `lifecycle.spec.ts` 7 cas verts
- [x] Helpers exportés via `world/index.ts` — `export * from './lifecycle'` → `yarn static-check` vert (imports résolus)
- **Review indépendante** : Déclenchée (raison : (c) diff > 100 lignes). Verdict `GO` — 0 bloquant / 0 majeur, 4 nits mineurs non bloquants (tie-break tri, non-null assertion gardée, scroll DOM non testé, map par card O(N²) sur N petit).
- **Tests automatisés** : `yarn workspace battleforthecrown-pixi test --run` → 106 fichiers / 695 tests verts. `yarn static-check` → vert.
- **Smokes lancés** : Non lancés localement, raison : aucun fichier `battleforthecrown-backend/src/` touché (shared pur + UI front) ; aucune CI smoke pertinente.
- **Smokes ajoutés/modifiés** : Aucun (pas de backend).
- **QA fonctionnelle agent** : Non nécessaire — comportement purement front (dérivation viewmodel + rendu), couvert par vitest jsdom.
- **Tests IG à faire par le user** : checklist Kelvin — (a) monde `main` pur : aucun bandeau ; (b) monde `late` + un `main` dispo : bandeau « Lancé il y a {N} j » + CTA « monde plus frais » qui scrolle vers la card fraîche ; (c) monde `late` sans `main` : bandeau seul, pas de CTA.

## Hors scope (à dériver plus tard si besoin)

- **Notification serveur world-wide broadcast** (« La cohorte principale est complète… ») : la spec mentionne ce signal mais il dépend d'un système de broadcast in-world inexistant au MVP. À traiter dans un run dédié si jugé prioritaire après ce run.
- **Annonce du wipe / countdown LOCKED → ENDED** : spec marquée _Question ouverte_ (cf. 19 § Questions ouvertes), pas tranchée MVP. Run dédié à dériver si playtest le valide.
- **Visibilité indéfinie du leaderboard final depuis fiche profil global** : autre question ouverte 19, séparée.
