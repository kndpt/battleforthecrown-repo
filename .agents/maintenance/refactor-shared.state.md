# refactor-shared — état (réécrit chaque run)

last: 2026-06-15 | thème: orphaned shared specs → pixi vitest
full: `archive/refactor-shared/2026-06-15-full.md`

## OPEN

_none — PR merged ou en attente review_

## Candidats prochains runs

1. **`combat/index.ts`** — supprimer `export type { ... }` redondant (lignes 16-29 avant `export * from './dtos'`). Scope : 1 fichier, 0 breaking.
2. **`events/schemas.ts`** — ajouter `satisfies Record<EventKind, z.ZodType>` sur `EVENT_PAYLOAD_SCHEMAS` pour guard compile-time. Scope : 1 fichier.
3. **`village/buildings.ts` split** — 537L monolithique → definitions.ts + speed-bonuses.ts + vision.ts. Scope : 4 fichiers, consommateurs à vérifier.
4. **`auth/schemas.ts`** — résoudre mismatch `displayName` optional input / required type output. Scope : 1-2 fichiers.
