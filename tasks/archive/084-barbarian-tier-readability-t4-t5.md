# 084 — Lisibilité des villages barbares T4/T5 sur la carte

**Sévérité** : 🟡 Majeur
**Statut** : ✅ Résolu 2026-06-28 — Piste A (mapping discret 5 paliers). Branche `task/084-barbarian-tier-readability-t4-t5`.

## Acceptance & QA

- [x] `spriteSizeFor` strictement croissant T1<T2<T3<T4<T5 — `yarn workspace battleforthecrown-pixi test src/pixi/scenes/worldMapEntityStyle.test.ts` → 16 tests verts (dont monotonie 5 paliers).
- [x] `styleFor(T4)`/`styleFor(T5)` : `color`/`ringColor`/`radius` distincts de T1 — même suite, test dédié vert.
- [x] Aucun ternaire `tier === "T3"` résiduel — `grep -n 'tier === "T3"' worldMapEntityStyle.ts` → none. Logique tier via helper `barbarianTierIndex` + arrays 5 paliers.
- [x] Pixi vert isolé — `yarn workspace battleforthecrown-pixi type-check` + `lint:check --quiet` → OK.
- [ ] `yarn static-check` global : **bloqué par baseline backend préexistante** (erreurs `ARCHIVED`/`archivedAt` dans `world-access.service.ts`/`world-lifecycle.worker.ts`/`world-archive.smoke.spec.ts` — Prisma client non régénéré post-run 065, présentes aussi sur `main`, hors scope ce ticket pixi-only).
- **Review indépendante** : Non déclenchée (aucun critère : pixi-only, pas SPEC.md, diff 74 lignes < 100, pas d'invariant durable).
- **Tests IG à faire par le user** : QA visuelle carte tactique (sur monde où l'anneau spawn intersecte T4/T5, `rMax=60`) — vérifier qu'un T5 est le plus large + le plus rouge-or sombre (`barbarianT5=0x7a2414`, ring or `0xffd166`) du cluster, distinguable d'un T1 sans clic.

Synthèse : palette `COLOR` étendue (T4/T5 + rings), `spriteSizeFor`/`styleFor` re-câblés sur `barbarianTierIndex` (T1..T5→0..4), radius=`10+idx`, T1/T2/T3 inchangés. Docs : note de consommation runtime ajoutée dans `archive/27`.
**Spec amont** : [`docs/gameplay/06-barbarians.md` § Lisibilité joueur](../docs/gameplay/06-barbarians.md#lisibilité-joueur) (Brief sprites — 5 variantes d'un même asset de base + palette gris-marron → rouge-or sombre)

## Symptôme

Les villages barbares **T4** et **T5** apparaissent sur la carte tactique avec la **même taille** et la **même couleur de fallback** qu'un T1, alors que la spec § Lisibilité joueur acte 5 variantes visuelles progressives (T1 nu → T5 remparts + accents dorés). Conséquence : un joueur ne peut pas distinguer au premier coup d'œil un T1 inoffensif d'un T5 mortel quand le sprite ne se charge pas immédiatement, et même lorsqu'il se charge, l'échelle ne reflète pas la progression de menace.

Les assets PNG existent (`world.barbarian.t4`, `world.barbarian.t5` dans `battleforthecrown-pixi/src/pixi/assets/manifest.ts:41-42`) et `aliasFor()` retourne bien le bon alias, donc la PNG s'affiche — mais à une **taille T1**, et le fallback Graphics (utilisé pendant le chargement ou si la texture échoue) retombe également sur le rendu T1.

Cas reproduit (à valider IG après fix) : un T5 spawné dans la couronne `[50, 60]` tiles autour du spawn (cf. `docs/gameplay/07-barbarian-spawning.md` § Distribution des tiers) doit être visuellement le plus imposant et le plus rouge-or sombre du cluster ; il s'affiche aujourd'hui aussi petit qu'un T1 gris-marron.

## Cause racine

Deux fonctions de `battleforthecrown-pixi/src/pixi/scenes/worldMapEntityStyle.ts` ne branchent que **3 tiers** (T1, T2, T3) :

- `spriteSizeFor(entity)` lignes 63-66 : `const idx = entity.tier === "T3" ? 2 : entity.tier === "T2" ? 1 : 0;` → T4 et T5 retombent sur `idx = 0` (taille T1).
- `styleFor(entity)` lignes 84-99 : couleurs `COLOR.barbarianT1/T2/T3` + rings + radius uniquement définis pour T1/T2/T3 → T4 et T5 retombent sur la branche T1 (palette gris-marron, ring `0xffe4b6`, radius 10).

La palette `COLOR` lignes 37-42 ne contient pas non plus de `barbarianT4`, `barbarianT5`, `barbarianRingT4`, `barbarianRingT5`.

Côté shared, le tier `T1..T5` est déjà bien modélisé (`packages/shared/src/world/types.ts` + run 005 a aligné le catalogue backend T1-T5 + run 007 a étendu `rMax=60` pour intégrer T4/T5 sur l'anneau `[40, 60]`). Le gap est donc **purement côté rendu Pixi frontend**.

> 💡 Suivi de `tasks/archive/27-barbarian-tier-sprites-redesign.md` (résolu **spec** 2026-05-09 — production d'assets actée mais consommation côté code jamais branchée pour T4/T5). Les assets PNG ont été ajoutés au manifest entre-temps, mais le resolver de taille + le fallback Graphics n'ont jamais été étendus.

## Comportement attendu

- La fonction pure `spriteSizeFor(entity)` retourne une taille distincte pour chaque tier T1, T2, T3, T4, T5 — progression monotone croissante alignée avec la pente narrative (campement primitif → forteresse).
- La fonction pure `styleFor(entity)` retourne une couleur, un ring color et un radius distincts pour chaque tier T1, T2, T3, T4, T5 — palette progressive du gris-marron (T1) au rouge-or sombre (T5), cohérente avec le brief design § Lisibilité joueur.
- Sur la carte tactique, deux villages barbares de tier différent à proximité l'un de l'autre se distinguent au premier coup d'œil par leur **taille** et leur **teinte**, sans avoir besoin de cliquer.
- Le fallback Graphics (cercle coloré + ring) reste lisible même si la texture sprite n'est pas chargée — chacun des 5 tiers a son propre rendu fallback distinct.
- Aucune régression sur le rendu T1/T2/T3 existant (mêmes tailles et couleurs qu'aujourd'hui, ou ajustement coordonné si la nouvelle pente l'impose).
- Couverture de test étendue à T4 et T5 dans `worldMapEntityStyle.test.ts` (à minima : taille T1 < taille T2 < taille T3 < taille T4 < taille T5).

## Scope recommandé

### Frontend (≤ 3 fichiers)

- `battleforthecrown-pixi/src/pixi/scenes/worldMapEntityStyle.ts` :
  - Ajouter `barbarianT4`, `barbarianT5`, `barbarianRingT4`, `barbarianRingT5` dans `COLOR` (palette gris-marron → rouge-or sombre cohérente avec le brief design ; valeurs hex à figer dans une remontée design system, sinon proposer une interpolation simple T1→T5).
  - Étendre `spriteSizeFor` pour mapper `T1..T5` → idx `0..4` (ou un calcul exact `tierIndex(entity.tier)` aligné sur la pente `Math.pow(1.1, idx)` existante).
  - Étendre `styleFor` pour exposer une `color`/`ringColor`/`radius` distincte pour T4 et T5 (radius continu, p. ex. `10 + idx` ou `Math.round(10 * Math.pow(1.05, idx))`).
- `battleforthecrown-pixi/src/pixi/scenes/worldMapEntityStyle.test.ts` :
  - Ajouter des cas explicites pour `spriteSizeFor(barbarian("T4"))` et `spriteSizeFor(barbarian("T5"))` qui vérifient la **monotonie stricte croissante** T1 < T2 < T3 < T4 < T5.
  - Ajouter un test sur `styleFor(barbarian("T4"))` et `styleFor(barbarian("T5"))` confirmant que `color`, `ringColor` et `radius` divergent de la valeur T1.

### Backend

- Aucune mutation backend nécessaire. Le tier `T4`/`T5` est déjà persisté et exposé par `/world/:worldId/entities` (cf. run 005 + run 007).

### Shared

- Aucun changement nécessaire si le mapping reste local au frontend Pixi. **Alternative à considérer au refinement** : exposer un helper pur `barbarianTierIndex(tier: WorldTier): 0..4` dans `packages/shared/src/world/` pour devenir source de vérité partagée — utile si d'autres surfaces (HUD inbox, mini-map, panneaux) consomment plus tard le même mapping. À ne faire que si un deuxième consommateur émerge dans le scope du run.

### Docs

- Pas d'impact `docs/architecture/`. La spec gameplay `06-barbarians.md` reste la source de vérité, déjà à jour côté brief sprites.
- Mettre à jour `tasks/archive/27-barbarian-tier-sprites-redesign.md` (note ✅ résolu en bas) pour pointer vers ce ticket 084 quand il sera clos — c'est la **consommation runtime** du brief de spec 27.

## Pistes

Le ticket peut être exécuté en mode rapide via `$bftc-run @tasks/084-barbarian-tier-readability-t4-t5.md` :

- **Piste A — mapping discret 5 paliers (recommandée)** : étendre `COLOR` avec 2 nouvelles entrées T4/T5 (palette figée par brief design ou interpolée), étendre les ternaires `spriteSizeFor`/`styleFor` à 5 paliers. Plus simple, plus lisible, pas de helper partagé. Cadre les 5 valeurs explicitement, pas de surprise.
- **Piste B — helper pur shared `barbarianTierIndex`** : extraire la conversion `T1..T5 → 0..4` dans `packages/shared/src/world/` et l'appliquer côté Pixi. Légèrement plus de surface mais source unique pour les futurs consommateurs. À retenir uniquement si un deuxième consommateur émerge.

Piste A par défaut sauf décision contraire au refinement.

## Critères de succès

- [ ] `spriteSizeFor(barbarian("T1"))` < `spriteSizeFor(barbarian("T2"))` < `spriteSizeFor(barbarian("T3"))` < `spriteSizeFor(barbarian("T4"))` < `spriteSizeFor(barbarian("T5"))` (monotonie stricte croissante, vérifiée par test unit).
- [ ] `styleFor(barbarian("T4"))` et `styleFor(barbarian("T5"))` retournent une `color`, `ringColor` et `radius` distincts de T1 (vérifié par test unit).
- [ ] Aucun ternaire `entity.tier === "T3"` résiduel dans `worldMapEntityStyle.ts` — toute la logique tier passe par un mapping 5 paliers.
- [ ] `yarn workspace battleforthecrown-pixi test src/pixi/scenes/worldMapEntityStyle.test.ts` vert.
- [ ] `yarn static-check` vert.
- [ ] QA visuelle IG : sur un monde dont l'anneau spawn intersecte T4/T5 (cf. seed `barbarianSeeding.rMax=60`), un T5 est visiblement le plus large et le plus rouge-or sombre du cluster (capture d'écran dans le rapport final).

## Liens connexes (préflight scan)

- `tasks/archive/27-barbarian-tier-sprites-redesign.md` — **connexe** (spec amont, brief sprites déjà figé § Lisibilité joueur ; ce ticket en livre la consommation runtime).
- `tasks/runs/archive/030-feature-world-map-village-sprites-by-castle-level.md` — **connexe** (pattern « sprite par palier » déjà appliqué aux villages **joueurs** par niveau Château ; même approche à étendre aux barbares).
- `tasks/runs/archive/005-audit-barbarians.md` — **connexe** (audit backend T1-T5 catalogue / blueprint / régen — déjà aligné spec, ne touche pas au rendu).
- `tasks/runs/archive/007-audit-barbarian-spawning.md` — **connexe** (étend `rMax=60` pour intégrer T4/T5 sur l'anneau spawn — c'est ce qui rend ce ticket visible côté joueur).

Keywords scannés : `barbarian`, `tier`, `sprite`, `visual`, `T4`, `T5`, `readability`, `lisibilité`.

Pas de doublon actif détecté.
