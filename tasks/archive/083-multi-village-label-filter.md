# 083 — Filtre par étiquette dans le sélecteur multi-village

**Sévérité** : 🟠 Moyen
**Statut** : ✅ Résolu le 2026-06-24
**Spec amont** : [`docs/gameplay/22-village-roles-and-navigation.md`](../../docs/gameplay/22-village-roles-and-navigation.md) § UX attendue

## Résolution

Front-only, mode rapide. Dernier des 4 items « UX attendue » de la spec 22 (les 3 autres — badge carte, badge Capitale, layout mobile — livrés par run 021).

- `MultiVillageFilter` étendu à `'all' | 'active' | 'alerts' | VillageLabel` ; `MultiVillageItem.label?: VillageLabel | null` ajouté.
- `FilterSeg` génère 3 chips étiquettes via `VILLAGE_LABELS` + `VILLAGE_LABEL_DISPLAY` shared (source unique = même libellé que le badge carte, pas de copy dupliqué). Default `DEFAULT_MULTI_VILLAGE_FILTERS = ['all','active','alerts',...VILLAGE_LABELS]` (ordre stable `Offensif | Défensif | Économique`).
- Closure `visible` : tout filtre non-`all`/`active`/`alerts` ⇒ `village.label === filter` (villages sans étiquette masqués). `availableFilters` restrictif préservé (un appelant `['all','active']` ne voit toujours que 2 chips).
- `multiVillageSheet.ts` (`buildMultiVillageSheetItems`) propage `label`. Fixture `DesignSystemPreview` enrichie (1 village / étiquette).
- Aucun backend / DB / WS / migration.

Fichiers : `MultiVillageBottomSheet.tsx`, `multiVillageSheet.ts`, `DesignSystemPreview.tsx` (fixture), `MultiVillageBottomSheet.test.tsx` (nouveau, 6 cas).

## Acceptance & QA

**Critères d'acceptance vérifiés**
- [x] `MultiVillageFilter` accepte `VillageLabel` (typecheck strict) — `yarn static-check` → vert.
- [x] 6 chips défaut + filtrage label + masquage unlabelled + `availableFilters` restrictif — `yarn workspace battleforthecrown-pixi test run MultiVillageBottomSheet.test.tsx` → 6/6 verts.
- [x] Pas de régression — `yarn test:pixi` → 116 fichiers / 785 tests verts.

**Review indépendante** : Non déclenchée (aucun critère vrai : front-only, diff 4 fichiers < 100 lignes, pas de SPEC ni invariant durable).

**Tests automatisés** : `yarn static-check` vert ; `yarn test:pixi` → 785/785.

**Smokes lancés** : Aucun — diff strictement frontend (zéro `battleforthecrown-backend/src/`).

**Smokes ajoutés/modifiés** : Aucun (front-only).

**QA fonctionnelle agent** : Non nécessaire — comportement purement UI, couvert par Vitest jsdom.

**Tests IG à faire par le user** : voir checklist (composant Pixi/React rendu + interaction de filtrage).

## Checklist QA IG (Kelvin, ≤ 5 items)

1. Ouvrir le sélecteur multi-village → 6 chips visibles (Tous, Actifs, Alertes, Offensif, Défensif, Économique).
2. Sélectionner chaque chip étiquette → liste réduite aux seuls villages de cette étiquette ; villages sans étiquette masqués.
3. Chip étiquette sans village correspondant → copy « Aucun village à afficher ».
4. Revenir sur « Tous » → liste complète restaurée.
5. Lisibilité des 6 chips à 320px (pas d'overflow cassant).

_(Symptôme, cause racine, pistes et scope d'origine : git history.)_
