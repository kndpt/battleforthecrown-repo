# Run #069 — feature-worlds-selection-late-phase-warning

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle (complément Phase 11 / lifecycle dérivé, après run 032 + run 033 + run 042)
- **Spec source** : [`docs/gameplay/19-world-lifecycle.md` § Bascule cohorte principale → retardataires](../../docs/gameplay/19-world-lifecycle.md)
- **Type** : feature
- **Modules** : backend `world.controller.ts` (DTO `freshAlternativeWorldId`) | shared `world/lifecycle.ts` (helpers purs `formatWorldLaunchAgeFr` + `pickFreshAlternativeWorld`) | frontend `features/worlds/worldsViewModel.ts` + `features/design-system/worlds/WorldsSelectionDesign.tsx` (bandeau + CTA "Rejoindre plutôt un monde plus frais")

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
- **T2 — Backend DTO enrichi** : `GET /worlds/public` retourne déjà la liste complète des mondes ; un consommateur calcule lui-même `freshAlternativeWorldId` côté front via le helper shared. Donc **pas de change backend obligatoire** — à confirmer en exécution. Garder le scope T2 pour : décision finale + smoke `worlds-public.smoke.spec.ts` non régressé.
- **T3 — Viewmodel front** : étendre `WorldCardViewModel` (`worldsViewModel.ts`) avec `launchAgeLabel: string | null` + `freshAlternativeWorldId: string | null`. Calcul via helpers shared. Tests `worldsViewModel.test.ts`.
- **T4 — UI bandeau + CTA secondaire** : `WorldsSelectionDesign.tsx` rend bandeau « Lancé il y a {N} j » sur card `late` + CTA secondaire « Rejoindre plutôt un monde plus frais » câblé sur `onSelectFreshAlternative(worldId)`. Style aligné palette gold/late existante.
- **T5 — Tests UI + static-check** : test rendu composant (3 scénarios), `yarn static-check`, vérification regression existante `WorldsSelectionDesign.test.tsx`.

## Progress

_(Vide au démarrage. Le run le remplira à l'exécution.)_

## Décisions prises

_(Vide au démarrage.)_

## Rapport final

_(Vide au démarrage.)_

### Acceptance & QA

- [ ] _(rempli à l'exécution)_
- **Review indépendante** : oui si diff > 100 lignes ou si T2 change le DTO public (back + front + spec) — à trancher en étape 5 du run. Sinon GO direct.
- **Tests automatisés** : vitest helpers shared (`lifecycle.spec.ts`), vitest viewmodel (`worldsViewModel.test.ts`), vitest UI (`WorldsSelectionDesign.test.tsx`), `static-check`.
- **Tests IG user** : checklist Kelvin (Cursor cloud) — vérifier (a) en monde `main` pur : aucun bandeau ; (b) en monde `late` avec un `main` dispo : bandeau visible + CTA secondaire fonctionnel ; (c) en monde `late` sans `main` : bandeau seul.

## Hors scope (à dériver plus tard si besoin)

- **Notification serveur world-wide broadcast** (« La cohorte principale est complète… ») : la spec mentionne ce signal mais il dépend d'un système de broadcast in-world inexistant au MVP. À traiter dans un run dédié si jugé prioritaire après ce run.
- **Annonce du wipe / countdown LOCKED → ENDED** : spec marquée _Question ouverte_ (cf. 19 § Questions ouvertes), pas tranchée MVP. Run dédié à dériver si playtest le valide.
- **Visibilité indéfinie du leaderboard final depuis fiche profil global** : autre question ouverte 19, séparée.
