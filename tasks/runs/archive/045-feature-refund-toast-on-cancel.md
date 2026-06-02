# Run #045 — feature-refund-toast-on-cancel

> **Statut** : DONE
> **Démarré** : 2026-06-02
> **Terminé** : 2026-06-02

## Cible

- **Phase roadmap** : Hors roadmap — polish UX post-run 076 (cancel training) + run 023 (toasts design-system)
- **Spec source** : [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md) (coûts construction), [`docs/gameplay/08-units.md`](../../docs/gameplay/08-units.md) (coûts training)
- **Type** : feature
- **Modules backend** : `gameplay` (cancel-construction, cancel-recruitment use-cases)
- **Modules frontend** : `pixi/layout`, `pixi/design-system`, `pixi/stores`, `pixi/api`

## Dépendances

- Run 023 (toasts design-system) — DONE : architecture `ToastPreview` + `useUiStore.pushToast` disponible
- Ticket 076 (cancel training) — DONE : mutations cancel construction + training existantes côté frontend et backend

## Critère de fin (acceptance)

- [ ] Annuler une construction affiche un toast listant uniquement les ressources remboursées > 0 avec préfixe `+` (bois, pierre, fer) + population et couronnes si > 0
- [ ] Annuler un entraînement de troupe affiche le même toast avec les montants corrects
- [ ] Les ressources/valeurs à 0 ne sont pas affichées
- [ ] Si le remboursement total est 0 sur toutes les lignes, aucun toast n'est affiché
- [ ] Pop et couronnes sont visuellement distincts des ressources (couleur/section différente — à valider en QA visuel)
- [ ] `cancel-recruitment` expose `{wood, stone, iron, population, crowns}` dans son payload de retour
- [ ] `cancel-construction` expose `{wood, stone, iron, population}` dans son payload de retour (crowns non applicable)
- [ ] Types des mutations frontend plus `<void>` : le payload refund est typé
- [ ] `ToastStack` rend la rangée resources + pop/crowns via `ResourceIcon` (unit test Vitest)
- [ ] `yarn static-check` vert

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Préflight : branche `run/045-feature-refund-toast-on-cancel` basée sur `origin/main`, modification `.claude/agent-memory/run-planner/MEMORY.md` gardée hors scope, `PR_REQUIRED: oui`.
- [x] Cartographie : `cancel-construction` renvoie déjà `refunded: cost`, `cancel-recruitment` doit exposer le détail du coût restant, frontend `queries.ts` est le point unique annoncé, `ToastStack` consomme `useUiStore.toasts`.
- [x] Backend : normaliser les réponses cancel en `{ success, refunded: { wood, stone, iron, population, crowns? } }`.
- [x] Frontend API/store : typer les payloads cancel, générer un toast de remboursement si au moins une valeur `> 0`.
- [x] Toast UI : rendre les items de remboursement avec `ResourceIcon`, section ressources séparée de population/couronnes.
- [x] Tests/QA : smokes ciblés construction + army training, Vitest `ToastStack`, `yarn static-check`, review 5 axes + review indépendante obligatoire.

## Progress (rempli pendant le run)

- 2026-06-02 — Préflight terminé. Workspace sale accepté sur demande user, modification `.claude/agent-memory/run-planner/MEMORY.md` hors scope. Branche dédiée créée depuis `origin/main` pour ne pas embarquer le commit local `main` en avance.
- 2026-06-02 — Specs sources lues : `docs/gameplay/03-buildings.md` confirme remboursement construction complet ressources+population ; `docs/gameplay/08-units.md` confirme remboursement entraînement complet ressources+population. `SPEC.md` ne contient pas d'invariant spécifique à ce run.
- 2026-06-02 — Cartographie terminée : le backend training renvoie aujourd'hui `{ refunded: remainingQty, refundedCrowns }`, insuffisant pour le toast ; construction renvoie le coût complet mais le frontend le type en `void`.
- 2026-06-02 — Implémentation terminée : payloads backend normalisés, mutations frontend typées, helper `refundToast` testé, `ToastStack` rend les lignes refund via `ResourceIcon`.
- 2026-06-02 — Vérifications terminées : smokes ciblés construction/training/Noble, suite Pixi complète, `static-check`, review lead et review indépendante GO. QA worktree démarrée sur DB temporaire `battleforthecrown_045`, backend `15002`, frontend `5174`.

## Décisions prises

- **Valeurs à 0 masquées** : on n'affiche que les lignes > 0. Si tout est à 0, pas de toast.
- **Pop + couronnes inclus** : dans le même toast, mais section/couleur distincte des ressources (ton à valider en QA visuel).
- **Toast unique** : toutes les lignes de remboursement dans une seule bulle (pas de toasts séparés).
- **Câblage au niveau mutation** (`onSuccess` dans `queries.ts`) : couvre les 4 callsites sans les modifier.
- **Réutiliser `ResourceIcon` + `resourceConfig`** existants, pas de hardcode `<img>`.
- **Review indépendante** : le rôle `reviewer` Codex a échoué car son modèle configuré n'est pas disponible avec ce compte ; fallback par agent par défaut, puis re-review du delta helper/test, verdicts `GO`.

## Rapport final

Feature livrée :

- Backend : `cancel-construction` renvoie maintenant `refunded: { wood, stone, iron, population }` sans champ extra ; `cancel-recruitment` renvoie `refunded: { wood, stone, iron, population, crowns }`.
- Frontend : les mutations cancel ne sont plus typées `void`, poussent un toast de remboursement unique en `onSuccess`, filtrent les montants `<= 0`, et invalident aussi population/couronnes quand nécessaire.
- UI : `ToastStack` rend les remboursements avec `ResourceIcon`, en séparant les ressources de la section population/couronnes. `resourceConfig` connaît désormais `crowns`.
- Tests : smokes payloads construction/training/Noble, test pur `refundToast`, test rendu `ToastStack`.
- Docs : aucun changement nécessaire, raison : les docs gameplay indiquaient déjà le remboursement complet construction/training ; le changement est une exposition de payload + feedback UI, couvert par la fiche archivée et les tests.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Toast construction cancel visible, valeurs `> 0` avec préfixe `+` — `visuel` → à vérifier par Kelvin en jeu ; rendu technique couvert par `ToastStack` + helper refund.
  - [x] Toast training cancel visible, montants corrects avec couronnes si `> 0` — `visuel` → à vérifier par Kelvin en jeu ; payloads training/Noble couverts par smokes.
  - [x] Valeurs `0` masquées — `rtk yarn workspace battleforthecrown-pixi test refundToast.test.ts ToastStack.test.tsx` → 2 suites / 7 tests passés.
  - [x] Remboursement total `0` ne pousse aucun toast — `rtk yarn workspace battleforthecrown-pixi test refundToast.test.ts ToastStack.test.tsx` → `pushRefundToast` testé sans ajout au store.
  - [x] Pop/couronnes section visuellement distincte des ressources — `rtk yarn workspace battleforthecrown-pixi test ToastStack.test.tsx` → rendu `Population et couronnes remboursées` séparé de `Ressources remboursées`.
  - [x] `cancel-recruitment` expose `{wood, stone, iron, population, crowns}` — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- construction.smoke.spec.ts army-training.smoke.spec.ts recruit-noble.smoke.spec.ts` → smoke training standard + Noble vérifient le payload.
  - [x] `cancel-construction` expose `{wood, stone, iron, population}` — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- construction.smoke.spec.ts army-training.smoke.spec.ts recruit-noble.smoke.spec.ts` → smoke construction vérifie le payload.
  - [x] Mutations frontend typées avec payload refund — `rtk yarn static-check` → type-check backend + pixi et lint quiet passés.
  - [x] `ToastStack` rend resources + pop/crowns via `ResourceIcon` — `rtk yarn workspace battleforthecrown-pixi test refundToast.test.ts ToastStack.test.tsx` → alt `Bois`, `Population`, `Couronnes` vérifiés.
  - [x] `yarn static-check` vert — `rtk yarn static-check` → passé.
- **Review indépendante** : Déclenchée (raison: touche backend ET frontend + diff > 100 lignes) avec verdict `GO`; re-review du delta `refundToast` également `GO`.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-pixi test refundToast.test.ts ToastStack.test.tsx` → 2 suites / 7 tests passés.
  - `rtk yarn workspace battleforthecrown-pixi test` → 54 fichiers / 273 tests passés. Warning jsdom connu : `HTMLCanvasElement.getContext()` non implémenté.
  - `rtk yarn workspace battleforthecrown-backend type-check` → passé.
  - `rtk yarn workspace battleforthecrown-pixi type-check` → passé.
  - `rtk yarn static-check` → passé.
- **Smokes lancés** : Ciblés.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` → OK, template `battleforthecrown_smoke` migré.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:run -- construction.smoke.spec.ts army-training.smoke.spec.ts recruit-noble.smoke.spec.ts` → 3 suites / 10 tests passés.
- **Smokes ajoutés/modifiés** :
  - `battleforthecrown-backend/test/construction.smoke.spec.ts` → cancel construction renvoie le payload refund ressources+population.
  - `battleforthecrown-backend/test/army-training.smoke.spec.ts` → cancel training standard renvoie le payload refund détaillé avec `crowns: 0`.
  - `battleforthecrown-backend/test/recruit-noble.smoke.spec.ts` → cancel Noble renvoie le payload refund avec couronnes.
- **QA fonctionnelle agent** :
  - `rtk proxy curl -fsS http://localhost:15002/health` → `{"status":"ok","database":"up"}` sur DB temporaire `battleforthecrown_045`.
  - `rtk proxy curl -I http://localhost:5174/` → HTTP 200.
  - `rtk proxy curl -I http://localhost:5174/design-system` → HTTP 200.
- **Tests IG à faire par le user** :
  - [ ] App URL : `http://localhost:5174/` — annuler une construction en cours et vérifier un toast `Construction annulée` avec uniquement les montants `+` non nuls.
  - [ ] App URL : `http://localhost:5174/` — annuler un entraînement de troupe et vérifier le même format de toast.
  - [ ] App URL : `http://localhost:5174/` — sur une annulation avec population ou couronnes, vérifier que la section du bas est visuellement distincte des ressources.
  - Cleanup DB temporaire après QA : `rtk docker exec battleforthecrown-postgres dropdb -U postgres --if-exists battleforthecrown_045 --force`.
