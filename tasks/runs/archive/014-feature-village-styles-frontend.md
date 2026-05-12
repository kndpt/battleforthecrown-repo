# Run #014 — feature-village-styles-frontend

> **Statut** : DONE
> **Démarré** : 2026-05-12
> **Terminé** : 2026-05-12

## Cible

- **Phase roadmap** : Phase 3 — Styles de village
- **Spec source** : [`docs/gameplay/12-village-styles.md`](../../docs/gameplay/12-village-styles.md)
- **Type** : `feature`
- **Modules backend** : `strategy` API/WS si ajustement de contrat nécessaire
- **Modules frontend** : `battleforthecrown-pixi/src/api` | `battleforthecrown-pixi/src/features/village`

## Dépendances

- Run [`013 — feature-village-styles-backend`](./013-feature-village-styles-backend.md) terminé ou contrat API backend explicitement stable.
- Phase 2 — Inbox & rapports terminée via run [`012`](./archive/012-feature-inbox-combat-reports.md).
- Respecter le contrat de confidentialité : style non visible publiquement hors scout.

## Critère de fin (acceptance)

- [ ] Le frontend récupère et affiche le style courant du village sélectionné depuis l'API backend.
- [ ] Le frontend affiche les coûts par style cible et l'état de cooldown retournés par l'API.
- [ ] L'action de changement de style est visible uniquement quand la Salle du Conseil débloque la mécanique.
- [ ] L'action est bloquée côté UI pendant cooldown ou ressources insuffisantes, sans se substituer à la validation serveur.
- [ ] Un changement de style réussi met à jour l'état local après réponse serveur et reste correct après reload.
- [ ] Les erreurs serveur attendues sont rendues proprement : Salle du Conseil absente, cooldown actif, ressources insuffisantes.
- [ ] Aucune donnée de style ennemi n'est introduite dans les vues carte/village public hors futur scout.
- [ ] Le smoke ou test IG agent couvre consulter un style, tenter un changement bloqué, réussir un changement, reload.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] T1 — API frontend : ajouter query/mutation TanStack pour `GET /village/strategy` et `POST /village/:id/strategy`, avec invalidations ressources/couronnes/population/stratégie.
- [x] T2 — Composant générique : adapter `VillageStyleModal` pour ids backend, coûts externes, cooldown, pending, erreurs, overlay fixe/preview, et données extraites hors TSX.
- [x] T3 — Intégration village : afficher l'action seulement si la Salle du Conseil est construite, brancher coûts/stock/cooldown backend, et fermer/refetch après succès.
- [x] T4 — Régression : couvrir UI bloquée par ressources insuffisantes, mutation réussie + refetch, remount/reload depuis l'état API, et invalidation stratégie après construction.
- [x] T5 — Review, QA design-system, static-check, docs impact, archive.

## Progress (rempli pendant le run)

- [x] Préflight : Git clean, fiche `PLANNED`, règles/SPEC/docs source lues.
- [x] Contrat backend run 013 confirmé depuis l'archive : endpoint stratégie, coûts, cooldown, confidentialité carte.
- [x] Cartographie frontend : aucun consommateur stratégie existant, `VillageStyleModal` prototype en ids locaux.
- [x] Implémentation API + modal générique + `VillageStyleControl` + intégration `VillageView`.
- [x] Tests ciblés ajoutés et suites Pixi/static-check vertes.

## Décisions prises

- Le trigger style vit dans le HUD village et reste invisible tant que `COUNCIL_HALL` n'est pas construit côté données bâtiments locales.
- `VillageStyleModal` reste un composant UI piloté par props ; la logique d'autorité/coûts vient de l'API via `VillageStyleControl`.
- Les coûts par défaut et le scaling preview ont été déplacés dans `villageStyleData.ts` pour respecter `react-refresh/only-export-components`.
- Aucun contrat backend/shared et aucune vue publique carte/village ennemi n'ont été modifiés.

## Rapport final

Implémentation frontend styles de village finalisée.

- Hooks API stratégie ajoutés côté Pixi : lecture état/coûts/cooldown et mutation changement de style.
- Modal rendue exploitable avec données backend : ids `VillageStrategyType`, coûts externes, cooldown, erreurs serveur, pending, stock loading, overlay fixe pour l'app et absolu pour la preview.
- `VillageStyleControl` branché dans `VillageView` : visible uniquement après Salle du Conseil, affiche le style courant, bloque cooldown/stock insuffisant, puis refetch après mutation.
- Régression ajoutée sur le flux frontend : coût affiché, blocage ressources, mutation réussie, reload depuis API, invalidation query stratégie après `building.completed`.
- Docs : mises à jour de suivi run uniquement (`tasks/runs/archive/014...`, `tasks/README.md`) ; aucune doc gameplay/API nécessaire, raison : `docs/gameplay/12-village-styles.md` et le contrat backend run 013 étaient déjà la source de vérité.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Style courant récupéré/affiché depuis API — preuve : `VillageStyleControl.test.tsx` mocke `GET /village/strategy`, trigger affiche `Équilibré` puis `Économique`.
  - [x] Coûts par style cible et cooldown retournés par API consommés — preuve : options construites depuis `changeCosts` + `cooldownEndsAt` dans `VillageStyleControl`.
  - [x] Action visible uniquement après Salle du Conseil — preuve : `VillageStyleControl` retourne `null` sans bâtiment `COUNCIL_HALL` level ≥ 1.
  - [x] Action bloquée UI pendant cooldown/stock insuffisant sans remplacer le serveur — preuve : modal désactive via `canChange`/stock et mutation POST reste seule source d'autorité.
  - [x] Changement réussi met à jour l'état local et reste correct après reload — preuve : test mutation `ECONOMIC`, refetch query, unmount/remount avec nouvel état API.
  - [x] Erreurs serveur attendues rendues proprement — preuve : mapping `Council Hall`, `cooldown`, `Insufficient crowns/resources`, `already uses`.
  - [x] Aucune donnée de style ennemi introduite — preuve : diff strictement API privée `/village/strategy` + HUD village joueur ; aucun fichier world/map/public touché.
  - [x] Smoke/test IG agent couvre consulter, bloqué, réussir, reload — preuve : `VillageStyleControl.test.tsx` couvre ces états ; QA navigateur `/design-system` couvre rendu modal et navigation.
- **Tests automatisés** :
  - `yarn workspace battleforthecrown-pixi test src/features/village/VillageStyleControl.test.tsx src/api/ws-bindings.test.ts` — vert, 2 fichiers / 15 tests.
  - `yarn workspace battleforthecrown-pixi test` — vert, 16 fichiers / 96 tests. Note jsdom attendue : `HTMLCanvasElement.getContext()` non implémenté, suite verte.
  - `yarn static-check` — vert.
- **Smokes lancés** : Non applicable, raison : aucun diff `battleforthecrown-backend/src/`.
- **Smokes ajoutés/modifiés** :
  - `battleforthecrown-pixi/src/features/village/VillageStyleControl.test.tsx` — consultation, coût, blocage ressources, succès mutation, reload API.
  - `battleforthecrown-pixi/src/api/ws-bindings.test.ts` — invalidation `villageStrategy` après `building.completed`.
- **QA fonctionnelle agent** : navigateur local `http://localhost:5174/design-system` — modale visible, style Raiders visible, navigation vers Économique OK, pas d'overlay Vite visible.
- **Tests IG à faire par le user** : valider l'appréciation visuelle en vraie partie mobile/desktop après seed d'un village avec Salle du Conseil ; le comportement fonctionnel est couvert par test automatisé.
