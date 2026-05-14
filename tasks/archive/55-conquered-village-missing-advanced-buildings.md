# 55 — Bâtiments avancés absents après conquête d'un village barbare

**Sévérité** : 🟠 Moyenne
**Statut** : ✅ Résolu

## Symptôme

Après conquête d'un village barbare, le château atteint le niveau 3 sur le village conquis mais la **Tour de Guet (WATCHTOWER)** n'apparaît jamais dans le panneau « Bâtiments » du frontend — ni dans la section « À construire », ni dans « À débloquer ». Le bâtiment est tout simplement absent de la liste.

Le même problème touche `COUNCIL_HALL` et `THRONE_HALL` (qui se débloquent à castle 4 et 6 — pas immédiatement visibles ici mais affectés par le même bug).

### Reproduction observée (DB locale)

Village conquis `cmorq0wfr002zvdkyu1r4vn7s` (« Cursed Village », `conquered_at = 2026-05-13`) :

```
type        | level
------------+------
BARRACKS    | 2
CASTLE      | 3
FARM        | 2
IRON        | 2
STONE       | 2
WAREHOUSE   | 2
WOOD        | 2
```

→ **7 rows** seulement. Aucune row `WATCHTOWER`, `COUNCIL_HALL`, `THRONE_HALL`.

## Cause racine

Le frontend (`BuildingManagementPanel.tsx` + `buildingLockState.ts`) calcule les sections « À construire » / « À débloquer » à partir du tableau `buildings` renvoyé par `GET /villages/:id/buildings`. Cet endpoint mappe simplement les rows `Building` existantes en DB — pas de bâtiments « virtuels » ajoutés côté serveur :

```ts
// battleforthecrown-backend/src/modules/village/village.service.ts:64
return village.buildings.map((b) => ({ ... }));
```

Lors de la création d'un village joueur via `JoinWorldUseCase`, on crée bien 10 rows incluant des rows level 0 pour les bâtiments encore non construits :

```ts
// battleforthecrown-backend/src/modules/world/join-world.use-case.ts:165
export const INITIAL_BUILDINGS = [
  { type: BUILDING_TYPES.CASTLE,       level: 1 },
  { type: BUILDING_TYPES.WOOD,         level: 1 },
  { type: BUILDING_TYPES.STONE,        level: 1 },
  { type: BUILDING_TYPES.IRON,         level: 1 },
  { type: BUILDING_TYPES.WAREHOUSE,    level: 1 },
  { type: BUILDING_TYPES.FARM,         level: 0 },
  { type: BUILDING_TYPES.BARRACKS,     level: 0 },
  { type: BUILDING_TYPES.WATCHTOWER,   level: 0 },
  { type: BUILDING_TYPES.COUNCIL_HALL, level: 0 },
  { type: BUILDING_TYPES.THRONE_HALL,  level: 0 },
];
```

À l'inverse, lors d'une **conquête barbare**, `ConquestService.acceptCaptureInTx` supprime tous les buildings et n'en recrée que 7 — sans aucune row level 0 pour les bâtiments avancés :

```ts
// battleforthecrown-backend/src/modules/combat/conquest.service.ts:29
const BARBARIAN_CONQUEST_BUILDINGS = [
  BUILDING_TYPES.CASTLE,
  BUILDING_TYPES.WOOD,
  BUILDING_TYPES.STONE,
  BUILDING_TYPES.IRON,
  BUILDING_TYPES.WAREHOUSE,
  BUILDING_TYPES.FARM,
  BUILDING_TYPES.BARRACKS,
] as const satisfies readonly BuildingType[];

// ligne 414-435 :
const materializedBuildings = BARBARIAN_CONQUEST_BUILDINGS.map((type) => ({
  villageId: targetVillageId,
  type,
  level: materializedLevel,
}));
…
await tx.building.deleteMany({ where: { villageId: targetVillageId } });
await tx.building.createMany({ data: materializedBuildings });
```

Tous les bâtiments matérialisés prennent le même `materializedLevel` (1 à 4 selon le tier barbare). WATCHTOWER, COUNCIL_HALL et THRONE_HALL ne sont **jamais** insérés.

Résultat : ces 3 bâtiments n'existent pas en DB pour un village conquis, et `getBuildings` ne les renvoie pas → le front ne peut pas les afficher.

Note : la spec barbare (`packages/shared/src/world/barbarian-templates.ts`) déclare bien un `WATCHTOWER` (level 4/6/8 selon T3/T4/T5) sur les villages barbares pré-conquête — utilisé par la vision/scout — mais ce contenu est rasé puis remplacé par `BARBARIAN_CONQUEST_BUILDINGS`. La conquête reset volontairement à un niveau plus bas (cohérent avec le gameplay) mais le reset oublie les rows level 0.

## Comportement attendu

Après conquête d'un village barbare, le tableau `Building` du village conquis doit contenir une row pour **chaque** type de bâtiment du catalogue (mêmes types que `INITIAL_BUILDINGS`), avec :

- niveau matérialisé (1-4) pour les bâtiments « de base » (CASTLE, WOOD, STONE, IRON, WAREHOUSE, FARM, BARRACKS) ;
- niveau **0** pour les bâtiments avancés (WATCHTOWER, COUNCIL_HALL, THRONE_HALL) — exactement comme à la création d'un village joueur.

→ La WATCHTOWER doit apparaître dans la section « À construire » dès que `castleLevel ≥ 3`, et dans « À débloquer » sinon.

## Scope recommandé

### Backend

1. Dans `conquest.service.ts`, étendre la liste matérialisée pour inclure les bâtiments avancés en level 0.
2. Préserver la sémantique actuelle : les 7 bâtiments de base prennent `materializedLevel`, les avancés prennent `0`.
3. Idéalement, déduire les bâtiments level 0 depuis le catalogue partagé (`BUILDING_TYPES` ∖ liste des matérialisés) plutôt que dupliquer une liste — pour éviter qu'un nouveau bâtiment ajouté au catalogue soit ré-oublié à la prochaine itération.
4. La fonction `calculateBuildingPopulationUsed` ne change pas (les level 0 contribuent 0 population).
5. Vérifier qu'aucun autre code (production tick, vision service, garrison) ne suppose que les rows level 0 sont absentes après conquête.

### Tests

- Smoke ou unit ciblé sur `ConquestService.acceptCaptureInTx` qui vérifie qu'après une conquête barbare T1→T5, les 10 types de buildings existent (7 au level matérialisé, 3 au level 0).
- Vérifier que `vision.service` continue de fonctionner : WATCHTOWER level 0 = `isWorldUnlocked: false`, donc pas de disque de vision ajouté pour le village conquis tant que la tour n'est pas construite (le code existant `village.buildings[0]` après filtre `type: WATCHTOWER` retournera bien la row level 0, et `WATCHTOWER_VISION_LEVELS[0]` est déjà géré).

### Frontend

Aucun changement nécessaire — `BuildingManagementPanel` + `getBuildingLockState` gèrent déjà correctement les rows level 0 (état `unbuilt-available` ou `unbuilt-locked` selon `castleLevel`).

### Migration des données existantes

Pour les villages déjà conquis avant le fix (ex : `cmorq0wfr002zvdkyu1r4vn7s`), prévoir au choix :

- script ponctuel qui insère les rows manquantes (level 0) pour tout village conquis sans WATCHTOWER/COUNCIL_HALL/THRONE_HALL ;
- ou backfill paresseux dans `getBuildings` (à éviter — alourdit la lecture).

Le script ponctuel est plus propre.

## Critères de succès

- Après conquête d'un village barbare, la WATCHTOWER apparaît dans le panneau « Bâtiments » :
  - section « À construire » si le château du village conquis ≥ 3 ;
  - section « À débloquer » sinon.
- COUNCIL_HALL et THRONE_HALL apparaissent également (dans « À débloquer » tant que le château n'est pas au niveau requis).
- Le test backend prouve que les 10 types de buildings sont créés à la conquête.
- Le village `cmorq0wfr002zvdkyu1r4vn7s` (et tout autre déjà conquis) est rétro-corrigé.
- Aucune régression sur la vision, le combat, la population, la production du village conquis.
