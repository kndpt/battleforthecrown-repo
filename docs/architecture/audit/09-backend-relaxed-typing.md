> ✅ **Résolu le 2026-05-06.** Voir section [Résolution](#résolution) en fin de ticket.

# 09 — Typage relâché backend (`as any`, `Record<string, number>`, `Promise<any>`)

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend` (impact aussi `packages/shared` et `battleforthecrown-pixi` via les contrats)
**Tags** : typing, type-safety, drift

## Symptôme

Plusieurs zones du backend court-circuitent le typage TypeScript : casts `as any`, retours `Promise<any>`, `Record<string, number>` au lieu de `Record<UnitType, number>`. Chaque écart isolé est petit, mais cumulés ils créent des trous dans le filet de sécurité au compile-time.

## Localisation

D'après le rapport backend Phase A :

- `src/modules/event/event.utils.ts:18` — `payload: payload as any` (cast nécessaire pour Prisma `Json`).
- `src/modules/power/power.controller.ts:~20` — `type as any` lors du passage du paramètre `type` (`'total' | 'kingdom' | 'army'`) au service.
- `src/modules/combat/return.worker.ts:~60` — `const loot = report.loot as any` lecture de la colonne JSON sans type guard.
- `src/modules/world/world-config.service.ts:~70` — `getCrownsConfig(_worldId): Promise<any>`.
- Multiples occurrences de `Record<string, number>` pour des collections d'unités (rapport shared) :
  - `packages/shared/src/combat/dtos.ts:22` — `units: Record<string, number>` dans `AttackCommand`.
  - `packages/shared/src/combat/dtos.ts:44-45` — `lossesAttacker: Record<string, number>`.
  - `packages/shared/src/events/types.ts:75` — `losses: Record<string, number>`.

## Détail technique

Le typage permissif a deux origines distinctes :

### 1. Frontière JSON / Prisma

Prisma stocke des `Json` non typés (`world.config`, `expedition.units`, `eventOutbox.payload`, `combatReport.loot`). Quand le code lit ces colonnes, TypeScript voit `JsonValue` (impraticable). D'où les `as any`. Mais ce cast court-circuite **toute** vérification : si la structure JSON change, rien n'alerte.

### 2. Contrats lâches dans `shared`

`Record<string, number>` est typé pour la sérialisation réseau (un client peut envoyer ce qu'il veut, le backend doit valider). Mais à l'intérieur du backend, après validation, on devrait avoir `Record<UnitType, number>` pour profiter de l'exhaustivité du type.

Aujourd'hui le typage faible se propage du DTO réseau jusque dans les services internes, donc les bugs (clés inconnues, typos) ne sont pas attrapés par TypeScript.

## Impact

- **Trous de sécurité au compile-time** : un typo `'CALAVRY'` au lieu de `'CAVALRY'` n'est pas détecté tant que la valeur n'est pas effectivement utilisée.
- **Refactor risqué** : renommer un `UnitType` en shared ne propage pas dans les `Record<string, number>` — il faut grep et corriger à la main.
- **Drift contrat WS** : `event.utils.ts:18` cast `payload as any` permet au [ticket 03](./03-resources-changed-dual-path.md) d'exister.
- **Documentation** : `Promise<any>` ne dit rien au lecteur sur la forme de retour.

## Contexte

Mélange normal d'un projet TS strict mais jeune : les cas frontière JSON/Prisma ne sont pas encore industrialisés (pas de Zod-au-milieu, pas de mappers), et certains types réseau ont été copiés depuis le frontend sans durcissement intermédiaire.

## Pistes à explorer

### Pour les frontières JSON (Prisma)

- **Validation Zod** au point de lecture/écriture : un schéma par champ JSON, parsé à l'entrée/sortie de la DB.
- **Mappers typés** : `parseEventOutboxPayload(row: EventOutbox): TypedPayload` qui valide ET type.
- **Migration vers colonnes typées** : si la flexibilité JSON n'est pas vraiment exploitée, exploser en colonnes Prisma (rigide mais sûr).

### Pour `Record<string, number>` units

- Garder `Record<string, number>` au DTO réseau (DTO Zod le valide en entrée).
- Convertir en `Record<UnitType, number>` ou `Map<UnitType, number>` une fois validé, pour le reste du flow interne.
- Audit shared : repérer tous les `Record<string, number>` qui devraient être `Record<UnitType, number>` et durcir.

### Pour les casts isolés

- `power.controller.ts` : Zod sur le paramètre query (`z.enum(['total', 'kingdom', 'army'])`), retire le `as any`.
- `world-config.service.ts:getCrownsConfig` : type explicite via shared (`CrownsSettings`).

## Tickets liés

- [03 — Dual path resources.changed](./03-resources-changed-dual-path.md) — symptôme : payload Outbox cast en `any`.
- [04 — World config permissive typing](./04-world-config-permissive-typing.md) — même problème côté frontend.
- [07 — Templates barbares](./07-shared-dead-barbarian-templates.md) — `Record<string, number>` permet ce drift de types fantômes.

## Dimensions à valider en sortie

- Pas de `as any` sans justification documentée case par case.
- `Record<string, number>` n'apparaît plus que dans les DTOs réseau (jamais dans les services internes).
- Toute lecture de colonne `Json` Prisma passe par un parser typé.
- Build TypeScript en mode strict (`--noImplicitAny`) sans warning.

## Résolution

Résolu le 2026-05-06 par une refonte structurelle du typage interne du combat. Approche : créer un type fort partagé (`UnitMap`) puis durcir tous les flux qui passent par les frontières JSON Prisma.

### Changements appliqués

**Shared** (`packages/shared/src/`) :
- `army/unit-map.ts` : `UnitMap = Partial<Record<UnitType, number>>` + `UnitMapSchema = z.partialRecord(UnitTypeSchema, z.number().int().nonnegative())`. Source de vérité unique pour les collections d'unités.
- `combat/schemas.ts` : `LootResultSchema`, `CombatLootSchema` (schemas Zod réutilisés par les codecs backend).
- `events/schemas.ts` : registre `EVENT_PAYLOAD_SCHEMAS` (1 schema Zod par `EventKind`).
- `combat/dtos.ts`, `combat/loot.ts`, `events/types.ts` : remplacement systématique de `Record<string, number>` par `UnitMap` dans les DTOs réseau et payloads d'events.
- `village/strategy.ts` : `getStrategyBonusValue` devient générique sur la clé du bonus (retourne `NonNullable<StrategyBonus[K]>`), supprime les `as number` / `as Record<ResourceType, number>` côté callers.

**Backend** (`battleforthecrown-backend/src/`) :
- `modules/combat/codecs/` (nouveau) : parsers/encoders colocalisés pour `expedition.units`, `combatReport.{loot, lossesAttacker/Defender, totalUnits*}`. Toute lecture/écriture des colonnes JSON Prisma passe par ces helpers ; les casts `as unknown as Prisma.InputJsonValue` sont isolés à 2 endroits dans les codecs.
- `modules/event/codecs/payload.codec.ts` (nouveau) : `parseEventPayload<K>` (validation Zod par `kind`), `encodeEventPayload<K>` (cast frontière unique).
- `modules/event/event.utils.ts` : `createOutboxEvent` utilise l'encoder typé (plus de `payload as any`).
- `modules/event/event-outbox.service.ts:dispatchEvent` : remplace les 9 casts `event.payload as XxxPayload` par `parseEventPayload(event.kind, event.payload)`. Le payload est désormais validé runtime au moment du dispatch (un payload mal formé en DB est détecté au lieu d'être propagé silencieusement).
- `modules/combat/dto/attack-command.schema.ts` (nouveau, remplace `attack-command.dto.ts` class-validator) : Zod schema réutilisant `UnitMapSchema`. Le DTO d'entrée combat est désormais typé `UnitMap` du controller jusqu'au service.
- `modules/combat/{combat.worker, return.worker, combat.service, strategies/, loot/, interfaces/}.ts` : propagation `UnitMap` dans toute la chaîne combat. Plus aucun `as Record<string, number>` ni `as unknown as Prisma.InputJsonValue` hors des codecs.
- `modules/world/world-config.service.ts:getTravelTimeForArmy` : signature `UnitMap`.
- `modules/power/power.controller.ts` : `@Query('type')` validé via Zod enum, supprime `type as any`.
- `common/prisma.types.ts` : `PrismaClientOrTx` étendu pour unir `Prisma.TransactionClient | PrismaClient`, supprime les `as unknown as PrismaClientOrTx` dans `OutboxPublisher` (3 sites).
- `modules/world/world-entities-query.service.ts` : type `BarbarianVillageData` dérivé d'un schema Zod (parité avec les autres colonnes JSON).
- `eslint.config.mjs` : `@typescript-eslint/no-explicit-any` activé en `error` (avec `off` pour `*.spec.ts` car les mocks utilisent `as any` légitimement).

### Vérification

- Build : `yarn workspace @battleforthecrown/shared build`, `yarn workspace battleforthecrown-backend build`, `yarn workspace battleforthecrown-pixi build` → tous verts.
- Tests : 88 / 88 tests combat passent (3 échecs pré-existants dans `loot.manager.spec.ts` + 4 dans `production.worker.spec.ts` : fixtures obsolètes, **pas** liées au ticket — `UNIT_CATALOG.MILITIA.carryCapacity` a été changé 50→25 et `updateProduction` a perdu un paramètre, à traiter séparément).
- 15 / 15 tests `event-outbox.service.spec.ts` passent. La rigidification a détecté une typo dans les fixtures (`SWORDSMAN`, qui n'est pas un `UnitType` valide) — corrigée vers `MILITIA`. Exactement le bug que le ticket visait à empêcher.
- Lint `no-explicit-any` : zéro violation dans le code prod.
- QA backend (port 15002) : POST `/combat/attack` rejette désormais les typos (`{units: { CALAVRY: 1 }}` → 400 avec message Zod détaillant l'enum attendu) et les shapes invalides (`units: "oops"` → 400). Les payloads valides traversent jusqu'au service.

### Volontairement non fait

- **Migration de l'enum Prisma `VillageStrategy` vers le type shared `VillageStrategyType`** : les casts `strategy as VillageStrategyType` restent (4 sites) car ces deux enums ont les mêmes valeurs mais sont nominalement distincts. Trade-off avec un risque marginal (les valeurs sont alignées par convention).
- **`tsconfig.json` `noImplicitAny: true`** : non activé (configuration backend reste à `strictNullChecks: true` seulement). Le filet ESLint `no-explicit-any: error` couvre l'essentiel pour ce ticket ; passer à full strict est un chantier transversal séparé.
- **Tests pré-cassés** (`loot.manager.spec.ts`, `production.worker.spec.ts`) : non corrigés ici car indépendants du ticket 09 (carryCapacity de MILITIA / signature `updateProduction`). À traiter dans un ticket dédié à la maintenance des fixtures de test.
