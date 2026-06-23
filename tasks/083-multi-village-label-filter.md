# 083 — Filtre par étiquette dans le sélecteur multi-village

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/gameplay/22-village-roles-and-navigation.md`](../docs/gameplay/22-village-roles-and-navigation.md) § UX attendue

## Symptôme

La spec 22 § UX attendue tranche MVP léger :

> Le rôle doit servir à aller plus vite :
>
> - **filtre par étiquette dans la liste des villages** ;
> - icône ou badge discret dans le sélecteur de village ;
> - badge discret pour la capitale dérivée ;
> - affichage compact sur mobile.

Trois des quatre items sont livrés (badge label sur la carte, badge Capitale, layout mobile). Le **filtre par étiquette** ne l'est pas : le `MultiVillageBottomSheet` n'expose qu'un segment `'all' | 'active' | 'alerts'` (`MultiVillageFilter` à `MultiVillageBottomSheet.tsx:10`). Un joueur qui multi-village pour lire vite son royaume « OFFENSIF / DÉFENSIF / ÉCONOMIQUE » doit scroller la liste entière à la main.

## Cause racine probable

Le run [`021-feature-village-labels-navigation`](./runs/archive/021-feature-village-labels-navigation.md) (DONE 2026-05-13) a livré la persistance backend (`village.label`, REST `PATCH /villages/:id/label`), le helper `VILLAGE_LABEL_DISPLAY` (FR), le badge sur les cartes village (`multiVillageSheet.ts:62-64`) et le filtre **carte** (worldsViewModel/WorldMapScreen). Le filtre **liste** était dans la spec mais n'a pas été câblé sur le `MultiVillageBottomSheet`, qui ne consommait pas encore le champ `label` au moment de ce run (le sélecteur a ensuite reçu le badge via `multiVillageSheet.ts` sans étendre le filtre).

Le badge actuel est un `string | null` (libellé FR déjà résolu) — il n'expose pas la valeur enum (`OFFENSIVE | DEFENSIVE | ECONOMIC`) qu'un filtre devrait comparer. Ajouter le filtre demande donc aussi de **propager la valeur enum** jusqu'au composant.

## Comportement attendu

1. Le `MultiVillageBottomSheet` expose **trois chips additionnels** dans le segment de filtre : `Offensif`, `Défensif`, `Économique` (libellés `VILLAGE_LABEL_DISPLAY` shared, ordre stable aligné sur `VILLAGE_LABELS`).
2. Sélectionner un chip d'étiquette filtre la liste aux seuls villages dont `village.label === <chip>`. Les villages sans étiquette (`label === null`) sont masqués.
3. Les filtres existants `all | active | alerts` restent inchangés (default = `all`).
4. La règle d'affichage des chips suit l'opt-in actuel `availableFilters` : si l'appelant n'override pas, les 6 chips sont disponibles (3 existants + 3 étiquettes). Un appelant peut restreindre via `availableFilters`.
5. Aucun changement runtime / DB / WS. Aucun re-fetch. Le `label` est déjà dans `JoinedVillage` (consommé par `multiVillageSheet.ts`).
6. Vide ne crashe pas : si un filtre étiquette ne matche aucun village, le copy `labels.empty` (« Aucun village à afficher ») reste affiché.

## Pistes

Une seule piste évidente, deux micro-décisions :

- **Type union** `MultiVillageFilter`. Étendre à `'all' | 'active' | 'alerts' | VillageLabel`. Le composant et `FilterSeg` sont déjà cas-driven, l'extension est propre.
- **Propagation de la valeur enum** : ajouter `label?: VillageLabel | null` sur `MultiVillageItem` (à côté de `badge: string | null`). `multiVillageSheet.ts:60-79` (`buildMultiVillageSheetItems`) mappe `village.label` brut. Pas de couplage au libellé d'affichage.

Pas de B/C — la spec MVP léger n'autorise ni multi-sélection, ni filtre négatif (« masquer ECONOMIC »), ni filtre combiné `active+OFFENSIVE`. Tout exclusif single-select via `SegmentedControl` existant.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/features/design-system/components/MultiVillageBottomSheet.tsx`
  - étendre `MultiVillageFilter` à inclure `VillageLabel`
  - ajouter `label?: VillageLabel | null` à `MultiVillageItem`
  - étendre `FilterSeg` (3 chips supplémentaires libellés `VILLAGE_LABEL_DISPLAY`)
  - étendre la closure `villages.filter` (case label → `village.label === filter`)
- `battleforthecrown-pixi/src/features/layout/multiVillageSheet.ts`
  - propager `village.label` dans `buildMultiVillageSheetItems` (champ `label`)
  - exposer les libellés FR via `multiVillageBottomSheetLabels` (3 nouveaux : `offensiveFilter | defensiveFilter | economicFilter` — ou réutiliser `VILLAGE_LABEL_DISPLAY` directement dans `FilterSeg` pour éviter la duplication)
- `battleforthecrown-pixi/src/features/design-system/DesignSystemPreview.tsx`
  - élargir le mock du sélecteur multi-village pour montrer les 6 chips
  - vérifier qu'au moins un village mock de chaque étiquette est présent (déjà le cas via `OFFENSIVE`/`DEFENSIVE` dans les fixtures, vérifier `ECONOMIC`)

### Tests

- `MultiVillageBottomSheet.test.tsx` (existe ? sinon créer)
  - chip `Offensif` ne montre que `village.label === 'OFFENSIVE'`
  - chip `Économique` ne montre que `village.label === 'ECONOMIC'`
  - chip ne matchant aucun village → render copy `empty`
  - `availableFilters` restrictif → chips étiquettes absents
- `multiVillageSheet.test.ts` (ajouter si absent ou éviter — pur mapping trivial)

### Docs

- Pas de doc impact dans `docs/architecture/` ni `docs/gameplay/22-*` — la spec attendait cette feature, le code rattrape la spec.

## Hors scope

- Filtre **carte** par étiquette (déjà livré par run 021).
- Multi-sélection ou filtre combiné (`active + OFFENSIVE`) — spec MVP léger refuse l'expansion.
- Filtre négatif / favoris / tags libres — explicitement post-MVP (cf. § Évolutions post-MVP).
- Persistance du filtre choisi (refresh resette) — pas demandé par la spec, à rouvrir si playtest demande.
- Filtre dans le mini-popover header (`GameHeader.tsx` flèches directes) — pas listé par la spec.
- Backend / DB / WS / migration Prisma — rien à toucher, `village.label` est déjà persistant et exposé via `GET /worlds/:worldId/me/joined` (run 021).

## Points d'attention

1. **Source du libellé chip** : utiliser `VILLAGE_LABEL_DISPLAY` shared dans le composant lui-même (pas dans `MultiVillageBottomSheetLabels`) pour éviter la duplication et garantir cohérence avec le badge déjà affiché sur la carte. Justifié : ces 3 libellés sont la **valeur sémantique** de l'enum, pas du copy localisable séparément.
2. **Stabilité ordre des chips** : aligner l'ordre sur `VILLAGE_LABELS = ['OFFENSIVE', 'DEFENSIVE', 'ECONOMIC']` (déjà ordonné spec) pour que `Offensif | Défensif | Économique` reste constant.
3. **Largeur mobile** : 6 chips dans un `SegmentedControl` peuvent déborder. Le composant actuel utilise déjà `[&>button]:flex-1 [&>button]:px-1.5 [&>button]:text-[10.5px]` — vérifier que le rendu reste lisible à 320px. Si overflow, raccourcir libellés (`Off. | Déf. | Éco.`) ou passer en grid 2×3 sur mobile.
4. **`availableFilters` opt-in restrictif** : un appelant qui passait `availableFilters={['all', 'active']}` doit continuer à voir seulement ces 2 chips. L'extension doit ajouter les 3 chips étiquettes au **default**, pas forcer leur affichage.
5. **DesignSystemPreview** : vérifier que la story consomme bien les nouveaux chips sans casser le snapshot visuel (composant catalogue).
6. **Ticket 021 lessons** : ce ticket était couvert dans le ticket d'origine `tasks/runs/archive/021-feature-village-labels-navigation.md`. Considérer une note courte dans `lessons.md` si la routine d'audit suggère que c'est une régression de scope.

## Critères de succès

- [ ] `MultiVillageFilter` accepte `VillageLabel` (typecheck strict OK).
- [ ] 6 chips visibles par défaut dans le bottom sheet : Tous, Actifs, Alertes, Offensif, Défensif, Économique.
- [ ] Sélectionner « Offensif » → seuls les villages `label === 'OFFENSIVE'` rendus ; villages sans label masqués.
- [ ] `availableFilters={['all', 'active']}` continue de n'afficher que 2 chips (pas de régression existing).
- [ ] Tests pixi Vitest étendent la couverture filtre (≥ 3 cas : label match, label no-match, availableFilters restrictif).
- [ ] `yarn static-check` + `yarn test:pixi` verts.
- [ ] Checklist QA IG (Kelvin, ≤ 5 items) : ouvrir le sélecteur multi-village, chips visibles, sélectionner chaque étiquette, liste filtrée correctement, repasser sur « Tous » restaure la liste complète.

## Référence

- Run [`021-feature-village-labels-navigation`](./runs/archive/021-feature-village-labels-navigation.md) — DONE, backend + badge carte + filtre carte. Le filtre liste manquait.
- Spec source : [`docs/gameplay/22-village-roles-and-navigation.md` § UX attendue](../docs/gameplay/22-village-roles-and-navigation.md#ux-attendue).
- Shared : `packages/shared/src/village/dtos.ts` (`VILLAGE_LABELS`, `VillageLabel`, `VILLAGE_LABEL_DISPLAY`).
