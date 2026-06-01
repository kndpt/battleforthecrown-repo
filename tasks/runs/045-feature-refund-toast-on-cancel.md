# Run #045 — feature-refund-toast-on-cancel

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

- **Valeurs à 0 masquées** : on n'affiche que les lignes > 0. Si tout est à 0, pas de toast.
- **Pop + couronnes inclus** : dans le même toast, mais section/couleur distincte des ressources (ton à valider en QA visuel).
- **Toast unique** : toutes les lignes de remboursement dans une seule bulle (pas de toasts séparés).
- **Câblage au niveau mutation** (`onSuccess` dans `queries.ts`) : couvre les 4 callsites sans les modifier.
- **Réutiliser `ResourceIcon` + `resourceConfig`** existants, pas de hardcode `<img>`.

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Toast construction cancel — `visuel` → à vérifier par le user en jeu
  - [ ] Toast training cancel — `visuel` → à vérifier par le user en jeu
  - [ ] Payload cancel-recruitment expose refund — `smoke curl / tsc`
  - [ ] Payload cancel-construction expose refund — `smoke curl / tsc`
  - [ ] Types mutations typés — `yarn static-check`
  - [ ] ToastStack rendu variant refund — `rtk yarn workspace battleforthecrown-pixi test`
- **Review indépendante** : Non déclenchée (aucun critère a/b/c/d vrai — feature cadrée, diff estimé < 100 lignes, pas d'invariant durable SPEC).
- **Tests automatisés** : à compléter à l'étape 10.
- **Smokes ajoutés/modifiés** : à compléter à l'étape 10.
- **QA fonctionnelle agent** : à compléter à l'étape 10.
- **Tests IG à faire par le user** : checklist à compléter à l'étape 10.
