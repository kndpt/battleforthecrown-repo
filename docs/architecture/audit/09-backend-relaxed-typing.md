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
