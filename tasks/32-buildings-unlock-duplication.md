# 32 — Drift potentiel : `unlockCastleLevel` dupliqué entre `BUILDING_DEFINITIONS` et `BUILDING_UNLOCK_REQUIREMENTS`

**Sévérité** : 🟡 Mineure (architecture / risque de drift silencieux)
**Statut** : 🆕 Ouvert 2026-05-10 (issue de [run 002](./runs/archive/002-audit-buildings.md) — finding review `agent-skills:code-reviewer`)

## Symptôme

Dans `packages/shared/src/village/buildings.ts`, le niveau Château requis pour débloquer un bâtiment est défini **deux fois** :

1. Dans `BUILDING_DEFINITIONS[type].unlockCastleLevel` (utilisé par `calculateBuildingCost` côté logic).
2. Dans `BUILDING_UNLOCK_REQUIREMENTS[type]` (utilisé par `getBuildingUnlockRequirement`, consommé par `upgrade-building.use-case.ts:70` pour bloquer la première construction).

Run 002 a ajouté `COUNCIL_HALL` et `THRONE_HALL` dans **les deux** tables (4 et 6 respectivement). Aucun désalignement aujourd'hui, mais le risque structurel est là : un futur ajout/modification d'un seul des deux passerait silencieusement sans casser le build.

## État actuel (post run 002)

- 12 bâtiments avec `unlockCastleLevel` défini dans `BUILDING_DEFINITIONS` (sauf `CASTLE`, racine).
- `BUILDING_UNLOCK_REQUIREMENTS` couvre 11 bâtiments (sauf `CASTLE`).
- Pas de check d'alignement entre les deux. Un ajout "moitié" passe TS strict.

## Pistes

### Piste A — Dériver `BUILDING_UNLOCK_REQUIREMENTS` depuis `BUILDING_DEFINITIONS`

```ts
export const BUILDING_UNLOCK_REQUIREMENTS = Object.fromEntries(
  Object.entries(BUILDING_DEFINITIONS)
    .filter(([_, def]) => def.unlockCastleLevel !== undefined)
    .map(([type, def]) => [type, def.unlockCastleLevel]),
) as Partial<Record<BuildingType, number>>;
```

**Tradeoff** : Source unique. Léger overhead de calcul à l'import (négligeable). Compat-friendly avec callers.

### Piste B — Supprimer `BUILDING_UNLOCK_REQUIREMENTS`, exposer un helper

`getBuildingUnlockRequirement(type)` devient `BUILDING_DEFINITIONS[type]?.unlockCastleLevel ?? null`. Le record exporté disparaît (1 caller backend à confirmer).

**Tradeoff** : Encore plus simple. Peut casser un caller frontend qui itère sur le record.

### Piste C — Garder le statu quo + test d'alignement

Ajouter un test dans `buildings.spec.ts` qui itère et vérifie que `unlockCastleLevel === BUILDING_UNLOCK_REQUIREMENTS[type]` pour chaque bâtiment.

**Tradeoff** : Pas de refacto. Filet de sécurité simple. Reste une duplication conceptuelle.

## Recommandation

Piste A en priorité (élimine la duplication, conserve l'API publique). Piste C en repli si des callers résistent.

## Référence audit

Run 002 — finding review `Architecture > majeur` (drift potentiel signalé par `agent-skills:code-reviewer`, hors scope du run pour rester dans le périmètre audit).
