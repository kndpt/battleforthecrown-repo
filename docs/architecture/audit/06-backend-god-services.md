# 06 — God services backend (`world-config`, `world`, `barbarian-seeding`)

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`
**Tags** : architecture, srp, refactor

## Symptôme

Trois services backend dépassent largement la taille raisonnable et mélangent plusieurs responsabilités hétérogènes :

- `WorldConfigService` — 237 LOC, ~20 méthodes publiques mélangeant lookup config, calculs coûts, calculs production, travel time, bonus stratégie, validation placement.
- `WorldService` — 579 LOC.
- `BarbarianSeedingService` — 522 LOC.
- `VillageService` — 343 LOC, méthode `upgradeBuilding` orchestre 7 lectures parallèles avant transaction.

## Localisation

- `src/modules/world/world-config.service.ts` (237 LOC)
- `src/modules/world/world.service.ts` (579 LOC)
- `src/modules/world/barbarian-seeding.service.ts` (522 LOC)
- `src/modules/village/village.service.ts` (343 LOC)

## Détail technique

### `WorldConfigService` — le cas le plus net

Ce service est consommé par **presque tous** les autres modules métier. Il expose :

- Lecture brute de `world.config` (champ JSON Prisma).
- Calculs dérivés : `getBuildingCost`, `getProductionRate`, `getTravelTime`, `getStrategyBonus`, etc.
- Validation de placement de villages.
- Configuration des couronnes (`getCrownsConfig: Promise<any>` — voir [ticket 09](./09-backend-relaxed-typing.md)).

C'est à la fois :
1. **Un repository** (lit `world.config`).
2. **Un calculator** (applique des formules de `packages/shared/logic`).
3. **Un validator** (placement).
4. **Un cache** ? (à vérifier — éventuelle mémoisation en mémoire).

Tous les autres services en dépendent (`VillageService`, `ResourcesService`, `ArmyService`, `CombatService`, `PowerService`, `CrownsService`). C'est un point de couplage central — modifier une signature fait propager dans tout le backend.

### `WorldService`, `BarbarianSeedingService`

À auditer en détail, mais 500+ LOC en NestJS suggère typiquement :
- Plusieurs flows métier dans un même service (création monde + lecture monde + jointure user + leaderboard…).
- Logique procédurale lourde (seeding barbares = génération chunks + placement + initialisation buildings/units…) qui mériterait des sous-services.

### `VillageService.upgradeBuilding`

Lit en parallèle 7 entités (village, building, ressources, population, queue, config, stratégie) avant la transaction. Si une seule lecture échoue, la mutation est annulée. C'est correct fonctionnellement, mais signale que la responsabilité de "préparer un upgrade" pourrait être extraite (validateur dédié).

## Impact

- **Tests** : un service de 500+ LOC avec ~15 dépendances injectées exige des dizaines de mocks par scénario. Les tests deviennent fragiles et lents.
- **Compréhension** : ouvrir `WorldConfigService` ne dit pas ce qu'il fait — il faut lire les 20 méthodes.
- **Évolution** : ajouter un calcul (par exemple, "coût en couronnes d'un upgrade premium") n'a pas de domicile évident.
- **Couplage transverse** : `WorldConfigService` étant partout, les changements y sont craints. Tendance à éviter le refactor → la dette s'aggrave.

## Pistes à explorer

### Pour `WorldConfigService`

- Découper en :
  - `WorldConfigRepository` — lit/écrit la config en DB.
  - `WorldConfigService` (slim) — fournit l'objet `WorldSettings` typé (validation Zod).
  - Calculs (`calculateBuildingCost`, etc.) consommés directement depuis `packages/shared/logic` au lieu de passer par un service backend.
  - `VillagePlacementValidator` — extrait la validation placement.

### Pour `WorldService` et `BarbarianSeedingService`

- Lecture détaillée puis découpage par flow métier (création monde / jointure / leaderboard / seeding chunks / seeding placement…).

### Pour `VillageService.upgradeBuilding`

- Extraire `BuildingUpgradeValidator` (les 7 lectures + checks) et `BuildingUpgradeExecutor` (la transaction + outbox).

### Critère général

- Cible : aucun service > 200 LOC ou 10 méthodes publiques sans justification documentée.

## Tickets liés

- [04 — World config permissive typing](./04-world-config-permissive-typing.md) — la config sortant de ce service est mal typée.
- [05 — Dépendances circulaires](./05-backend-circular-deps.md) — `WorldConfigService` partout aggrave le couplage.
- [09 — Typage relâché backend](./09-backend-relaxed-typing.md) — `getCrownsConfig: Promise<any>` ici même.

## Dimensions à valider en sortie

- Plus de service backend > 200 LOC (sauf justification écrite case par case).
- Un nouveau calcul / validateur a un domicile évident (pas "ça va dans WorldConfigService").
- Les tests unitaires d'un service nécessitent un nombre raisonnable de mocks (< 5).
