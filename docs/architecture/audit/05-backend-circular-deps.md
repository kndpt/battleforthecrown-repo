# 05 — Dépendances circulaires entre modules backend (`forwardRef`)

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`
**Tags** : architecture, coupling, bounded-context

## Symptôme

Plusieurs paires de modules NestJS s'injectent mutuellement via `forwardRef()`. C'est un signal que les frontières entre bounded contexts sont floues : les modules ont des responsabilités qui se chevauchent ou des points de coordination mal placés.

## Localisation

D'après le rapport backend Phase A :

- `VillageModule` ↔ `ResourcesModule`
  - `src/modules/village/village.module.ts:14`
  - `src/modules/resources/resources.module.ts:11`
- `ArmyModule` ↔ `ResourcesModule` (idem pattern)
- `PopulationModule` → `VillageModule`
  - `src/modules/population/population.module.ts:10`

## Détail technique

`forwardRef()` est utilisé en NestJS quand deux modules doivent s'injecter mutuellement dans leur `providers`/`imports`. C'est un mécanisme légitime, mais quand il se multiplie, c'est généralement le symptôme que :

1. **Les responsabilités sont mal réparties** : par exemple `VillageService` doit débiter des ressources (donc dépend de `ResourcesService`) et `ResourcesService` doit lire les bâtiments (donc dépend de `VillageService`).
2. **Il manque un module / service "façade"** ou un orchestrateur qui combinerait les deux sans dépendance circulaire.
3. **La logique métier transverse n'a pas de domicile** (par exemple "un upgrade de bâtiment" est à la fois un fait Village et un fait Resources).

Le pattern Outbox aggrave un peu cette tension : les events sont créés dans la transaction de mutation, donc la mutation doit "savoir" quels events émettre, ce qui pousse les services à se connaître davantage.

## Impact

- **Fragilité d'init** : NestJS résout les dépendances à l'init. Une mauvaise ordre, un nouveau module ajouté entre les deux, et l'init plante.
- **Tests difficiles** : mocker `ResourcesService` dans un test de `VillageService` exige de mocker aussi le forwardRef inverse, ce qui démultiplie le boilerplate.
- **Compréhension** : difficile de raisonner sur "qui appelle qui" quand les flèches vont dans les deux sens.
- **Évolution** : refactor d'un module impose des changements en cascade dans son partenaire.

## Contexte

Ce pattern apparaît typiquement dans un projet jeune où les bounded contexts ont émergé "par features" plutôt que "par invariants". Au début, "ressources" et "village" sont quasi le même domaine, donc s'entremêlent. Quand le domaine grossit (combat, conquête, stratégie...), la séparation devient nécessaire mais coûteuse à faire après coup.

## Pistes à explorer

- **Identifier les invariants** : quel module est garant de quoi ? Qui peut ouvrir une transaction ?
- **Module orchestrateur** : par exemple `BuildingUpgradeService` qui dépend de `VillageService` et `ResourcesService`, mais sans qu'eux-deux se connaissent.
- **Domain events internes** : au lieu d'appeler directement, émettre un event interne (Nest event-emitter) que l'autre module écoute. Découple, au prix d'une indirection.
- **Repository / read-model pattern** : extraire les lectures lourdes (`getVillageWithBuildings`) dans un service de lecture neutre, consommé par les deux côtés.
- **Inverser les dépendances** : par exemple, plutôt que `VillageService` appelle `ResourcesService.deduct()`, c'est `BuildingUpgradeService` qui orchestre les deux.

## Tickets liés

- [06 — God services backend](./06-backend-god-services.md) — `WorldConfigService` est partout, ce qui aggrave le couplage transverse.
- [03 — Dual path resources.changed](./03-resources-changed-dual-path.md) — symptôme : le même event est créé à deux endroits, parce que la responsabilité est partagée de manière floue.

## Dimensions à valider en sortie

- Plus aucun `forwardRef()` dans le code backend (ou justification documentée case par case).
- Chaque mutation métier (upgrade, train, attack) a un domicile clair (un seul service orchestrateur).
- Les tests unitaires d'un module n'exigent pas de mocker plus de 2 services tiers.
