# Run #038 — fix-quarter-population-scaling-modal

> **Statut** : DONE
> **Démarré** : 2026-05-26
> **Terminé** : 2026-05-26

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant
- **Spec source** : [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) § Population ; [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md) § Quartier
- **Type** : fix
- **Modules backend** : `workers/construction`, `combat/conquest`, `world-config`
- **Modules frontend** : `pixi/features/village`, `pixi/features/design-system/components`

## Dépendances

- Aucune dépendance bloquante.
- Contexte connexe : [`029 — Migration design-system des modales bâtiment restantes`](./archive/029-migrate-building-modals-design-system.md), [`002 — Audit spec 03 : bâtiments`](./archive/002-audit-buildings.md), [`073 — Format compact ressources et villageois dans le header`](../archive/073-compact-resource-population-header-format.md), [`57 — Source canonique du lifecycle des bâtiments joueur`](../archive/57-player-village-building-lifecycle-roster.md).

## Critère de fin (acceptance)

- [ ] `getQuarterPopulationLimit(level)` retourne une valeur définie pour chaque niveau 1..10 du Quartier.
- [ ] Les niveaux Quartier 6..10 ne fallbackent plus à `250` et la progression inclut un delta non nul sur `7 -> 8`.
- [ ] Une complétion d'upgrade Quartier au-delà du niveau 5 met `population.max` à la capacité du niveau cible, pas à `250` par défaut.
- [ ] Les flows de conquête qui matérialisent une population via un niveau de Quartier continuent à recalculer `population.max` avec le helper shared corrigé.
- [ ] Le rendu Quartier en mode population n'affiche plus `/ heure` ni `/ h`.
- [ ] La modal Quartier `niv. 7 -> 8` affiche une capacité de population actuelle/prochaine cohérente avec un delta non nul.
- [ ] La jauge `Logement` reste basée sur `population.used / population.max` et ne confond pas capacité avec production passive.
- [ ] Le run indique explicitement si une correction non destructive des données existantes est nécessaire, appliquée ou justifiée comme non requise.
- [ ] Checks ciblés puis `rtk yarn static-check` passent, sauf baseline rouge documentée hors scope.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- Shared : étendre `QUARTER_POPULATION_LIMITS` à tous les niveaux effectifs du Quartier (1..10) et tester le contrat `7 -> 8`.
- Backend smoke : durcir la complétion Quartier pour prouver qu'un upgrade `7 -> 8` met `population.max` sur la capacité cible.
- Frontend : rendre la modale Quartier comme capacité/logement et non production horaire, puis tester les libellés critiques.
- Données existantes : inspecter la DB locale pour déterminer si un backfill non destructif est nécessaire.
- Vérification : tests ciblés, smokes backend, static-check, review indépendante, docs impact, archive.

## Progress (rempli pendant le run)

- Préflight terminé : worktree clean, règles `.agents`, `SPEC.md`, briefings backend/pixi, docs gameplay Population/Quartier et leçons lus.
- Cartographie terminée : le fallback `250` vient de `packages/shared/src/village/population.ts` et impacte `construction.worker.ts`, `conquest.service.ts`, `world-config.service.ts`, `ResourceBuildingDetailModal.tsx`.
- Implémentation terminée : `QUARTER_POPULATION_LIMITS` couvre 1..10, la modale Quartier affiche une capacité/logement sans unités horaires, et les tests ciblés couvrent helper, rendu et complétion 7 -> 8.
- Correction DB locale appliquée : 27 lignes `population.max` héritées ont été augmentées selon le niveau Quartier 7/8/10 ; vérification post-update `remaining_mismatches = 0`.
- Vérifications automatisées terminées : tests ciblés backend/pixi, smoke construction, smoke backend complet et `rtk yarn static-check` verts.

## Décisions prises

- La courbe Quartier conserve les niveaux 1..5 existants et prolonge 6..10 avec des valeurs arrondies lisibles : `430`, `480`, `535`, `595`, `665`.
- `getQuarterPopulationLimit` clamp les niveaux hors table vers la borne définie la plus proche, afin qu'un niveau supérieur accidentel ne retombe plus à la capacité minimale.
- La modale Quartier garde les cartes de capacité basées sur la courbe shared, mais la jauge `Logement` utilise explicitement `population.used / population.max` runtime.
- Review indépendante déclenchée (raison : back+front + invariant durable) ; verdict `GO`. Le mineur sur le dénominateur de jauge a été corrigé et couvert par test.
- Documentation gameplay non modifiée : `docs/gameplay/02-economy-and-progression.md` et `03-buildings.md` pointent déjà vers `packages/shared/src/village/population.ts` comme source des valeurs exactes.

## Rapport final

Correction livrée. `getQuarterPopulationLimit` couvre maintenant tous les niveaux effectifs du Quartier `1..10`; les niveaux `6..10` ne retombent plus à `250`, et `7 -> 8` passe de `480` à `535`.

La complétion backend Quartier continue de passer par le helper shared, avec smoke réel sur un upgrade `7 -> 8`. La conquête reste branchée sur le même helper shared dans `ConquestService`, donc elle consomme automatiquement la courbe corrigée.

La modale Quartier affiche désormais une capacité/logement : plus de `/ heure` ni `/ h` en mode population. La jauge `Logement` reste basée sur `population.used / population.max`.

Correction DB locale non destructive appliquée : 27 villages existants Quartier 7/8/10 avaient une `population.max` héritée trop basse (`250`, `200`, `300`) ; ils ont été mis à jour vers `480`, `535`, `665`. Vérification post-update : `remaining_mismatches = 0`.

Fichiers touchés :
- `packages/shared/src/village/population.ts`
- `battleforthecrown-backend/src/modules/world/world-config.service.spec.ts`
- `battleforthecrown-backend/test/construction.smoke.spec.ts`
- `battleforthecrown-pixi/src/features/design-system/components/ResourceBuildingModal.tsx`
- `battleforthecrown-pixi/src/features/design-system/components/ResourceBuildingModal.test.tsx`
- `battleforthecrown-pixi/src/features/village/ResourceBuildingDetailModal.tsx`
- `battleforthecrown-pixi/src/features/village/ResourceBuildingDetailModal.test.tsx`

Ticket ouvert : aucun.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] `getQuarterPopulationLimit(level)` couvre `1..10` — `rtk yarn workspace battleforthecrown-backend test world-config.service.spec.ts` → 28 tests verts, dont table `[250,279,310,346,385,430,480,535,595,665]`.
  - [x] Quartier `6..10` ne fallback plus à `250`, delta `7 -> 8` non nul — `rtk yarn workspace battleforthecrown-backend test world-config.service.spec.ts` → `8 > 7`, `99 -> 665`.
  - [x] Complétion upgrade Quartier `7 -> 8` met `population.max` à la capacité cible — `rtk yarn workspace battleforthecrown-backend test:smoke:run construction.smoke.spec.ts` → smoke `construction: completing QUARTER 7 → 8 refreshes max population` vert.
  - [x] Conquête recalcule `population.max` via helper shared corrigé — `rtk grep -n "getQuarterPopulationLimit" battleforthecrown-backend/src/modules/combat/conquest.service.ts` → helper utilisé pour `maxPopulation`.
  - [x] Rendu Quartier population sans `/ heure` ni `/ h` — `rtk yarn workspace battleforthecrown-pixi test ResourceBuildingModal.test.tsx ResourceBuildingDetailModal.test.tsx` → 2 tests verts, assertions négatives sur unités horaires.
  - [x] Modal Quartier `niv. 7 -> 8` affiche une capacité actuelle/prochaine avec delta non nul — `rtk yarn workspace battleforthecrown-pixi test ResourceBuildingModal.test.tsx ResourceBuildingDetailModal.test.tsx` → `480`, `535`, `+55 villageois`.
  - [x] Jauge `Logement` basée sur `population.used / population.max` — `rtk yarn workspace battleforthecrown-pixi test ResourceBuildingModal.test.tsx ResourceBuildingDetailModal.test.tsx` → wrapper testé avec `320 / 999`.
  - [x] Correction non destructive données existantes — `postgresql-cli database query BFTC_DB_LOCAL "SELECT COUNT(*)::int AS remaining_mismatches ..."` → `remaining_mismatches = 0`.
  - [x] Static check — `rtk yarn static-check` → vert.
- **Review indépendante** : Déclenchée (raison: back+front, invariant durable), verdict `GO`; mineur sur la jauge résolu par patch + test.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-backend test world-config.service.spec.ts` → 1 suite, 28 tests verts.
  - `rtk yarn workspace battleforthecrown-pixi test ResourceBuildingModal.test.tsx ResourceBuildingDetailModal.test.tsx` → 2 fichiers, 2 tests verts.
  - `rtk yarn static-check` → vert.
- **Smokes lancés** :
  - `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` → OK.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:run construction.smoke.spec.ts` → 1 suite, 3 tests verts.
  - `rtk yarn test:smoke` → 24 suites, 50 tests verts. Logs `PgBoss`/Prisma observés pendant l'arrêt de certains clones, sans échec de suite.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/construction.smoke.spec.ts` modifié pour couvrir `QUARTER 7 -> 8` avec mise à jour réelle de `population.max`.
- **QA fonctionnelle agent** : SQL local exécuté sur `BFTC_DB_LOCAL` : snapshot des 27 lignes incohérentes, update ciblé non destructif, puis vérification `remaining_mismatches = 0`.
- **Tests IG à faire par le user** :
  - [ ] Ouvrir un Quartier niveau 7 et vérifier que la modal affiche `480` puis `535` villageois, avec `+55 villageois`, sans `/ heure` ni `/ h`.

## Notes de cadrage

- Symptôme observé : la modal Quartier `niv. 7 -> 8` affiche `+250 / heure` pour le niveau courant et le prochain, puis `+0 / h`.
- Cause probable : `QUARTER_POPULATION_LIMITS` couvre seulement les niveaux 1..5, tandis que `QUARTER` est un bâtiment 1..10. Le fallback actuel de `getQuarterPopulationLimit(6+)` retourne `250`.
- Le sujet n'est pas seulement UI : `construction.worker.ts` applique ce helper à la complétion Quartier, et `conquest.service.ts` l'utilise aussi lors de la matérialisation de population.
- La sémantique gameplay attendue est une capacité de villageois, pas un débit horaire. La modal doit donc avoir un wording spécifique population ou masquer la comparaison courante si le design retenu est "prochain niveau uniquement".
- Si des villages existants ont déjà un Quartier niveau 6+ avec `population.max=250`, prévoir une correction non destructive ciblée ou documenter pourquoi elle n'est pas nécessaire.
