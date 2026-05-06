# 08 — Doublon `CombatLootResources` / `BattleLootResources` dans shared

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `packages/shared`
**Tags** : duplication, types, dto

## Symptôme

Deux interfaces strictement identiques cohabitent dans `packages/shared` pour représenter le butin de combat (wood / stone / iron). Aucune des deux n'est l'alias de l'autre — toute évolution future doit être propagée des deux côtés manuellement.

## Localisation

- `packages/shared/src/combat/dtos.ts:25-29` — `CombatLootResources`
- `packages/shared/src/events/types.ts:36-39` — `BattleLootResources`

Structure identique :
```ts
{
  wood: number;
  stone: number;
  iron: number;
}
```

## Détail technique

Les deux types vivent dans deux contextes :
- **DTOs HTTP** (`combat/dtos.ts`) — consommés par les responses REST `/combat/report/:id`.
- **Payloads Outbox** (`events/types.ts`) — consommés par les events WS `battle.resolved`, `battle.returned`.

C'est légitime de **distinguer DTO HTTP et payload event** : ils peuvent évoluer indépendamment (ex : on pourrait enrichir le DTO HTTP avec des metadata sans toucher au payload WS minimal). Mais aujourd'hui ils sont identiques, et rien ne les force à le rester.

À noter aussi : `combat/resolution.ts` définit `LootResult` qui est plus riche (avec metadata combat). Donc on a en fait **trois** structures liées au butin, dont deux qui pourraient être unifiées.

## Impact

- **Maintenance** : ajouter une ressource (couronnes ?) demande de modifier deux endroits, sans aide du compilateur.
- **Confusion d'intention** : un nouveau dev se demande "lequel utiliser ?". Sans convention écrite, il en utilise un au pif. Drift latent.
- **Risque drift** : le jour où l'un des deux gagne un champ et pas l'autre, le frontend reçoit du WS un payload moins riche que celui du REST, et l'état affiché diverge selon la source.

## Contexte

Très probablement issu d'une convergence : `events/types.ts` a été écrit pour le pattern Outbox (par cohérence avec le reste de `events/`), `combat/dtos.ts` a été écrit avec les autres DTOs combat. Personne n'a remarqué qu'ils étaient identiques.

## Pistes à explorer

- **Aliasing simple** : `BattleLootResources = CombatLootResources` (ou un nom neutre `LootResources` partagé).
- **Type unique nommé** : créer un seul type `LootResources` dans `packages/shared/src/resources/` (ou `combat/`), réexporté depuis les deux endroits.
- **Maintenir la séparation** : si la décision est qu'ils peuvent diverger un jour, alors documenter explicitement (commentaire dans les deux fichiers expliquant pourquoi ils sont distincts).
- **Audit plus large** : chercher d'autres types identiques dans shared (ex : `Record<UnitType, number>` répété, `{ x: number; y: number }` répété).

## Résolution effective (2026-05-06)

**Option retenue** : type unique partagé `LootResources` dans `packages/shared/src/combat/loot.ts`, suppression des deux interfaces dupliquées.

### Périmètre

- Création de `combat/loot.ts` consolidant `LootResources` (nouveau), `LootResult` et `CombatResolution`.
- Renommage `combat/resolution.ts` → `combat/loot.ts` (sémantique élargie : module "résultats post-combat").
- Suppression de `CombatLootResources` (`combat/dtos.ts`) — `CombatLoot.resources?` et `.remainingResources?` pointent désormais vers `LootResources`.
- Suppression de `BattleLootResources` (`events/types.ts`) — `BattleResolvedPayload.loot.resources`, `BattleReturnedPayload.loot.resources` et `VillageAttackedPayload.resourcesLost` pointent désormais vers `LootResources`.
- Réécriture de `LootResult.resources` / `.remainingResources` (auparavant inline `{wood, stone, iron}`) en `LootResources`.
- Frontend pixi aligné : `battleforthecrown-pixi/src/lib/types.ts` re-exporte `LootResources` du shared au lieu de le redéclarer.

### Périmètre explicitement non traité (autres tickets)

- Inline `{ wood: number; stone: number; iron: number }` côté backend pour le snapshot du défenseur (`combat/interfaces/combat-context.interface.ts:22`, `combat/combat.worker.ts:404,412`) — sémantique distincte ("ressources détenues" ≠ "butin pris"), à garder local au backend.
- `CombatLootDto` permissif (champs optionnels) dans `pixi/api/queries.ts:378` — relève du [ticket 04](./04-world-config-permissive-typing.md).
- Drift entre `CombatLoot` (shared) / `LootResult` (shared) / `CombatLoot` (pixi) — `CombatReportResponseDto` n'est pas appliqué au runtime (`combat.worker.ts:233` sérialise `loot` comme `Prisma.InputJsonValue` brut). Sujet plus large à isoler.
- `StorageLimits` (`resources/types.ts`) — même forme `{wood, stone, iron}` mais sémantique distincte (capacité, pas butin).

### Vérifications de sortie

- ✅ Plus aucune occurrence de `CombatLootResources` ni `BattleLootResources` dans le repo (hors legacy `battleforthecrown/` intouchable).
- ✅ `yarn workspace @battleforthecrown/shared build` OK.
- ✅ `cd battleforthecrown-backend && yarn build` OK.
- ✅ `yarn workspace battleforthecrown-pixi test --run` : 57/57 verts.
- ⚠️ Tests backend : 7 échecs (`loot.manager.spec.ts`, `production.worker.spec.ts`) **préexistants** — vérifié en re-jouant les tests sur `main` vierge. Hors scope.
- ⚠️ Erreur tsc dans `pixi/PixiCanvas.tsx:32` **préexistante** — vérifiée à l'identique sur `main` vierge.

## Tickets liés

- [02 — Events WS non bindés](./02-ws-events-not-bound.md) — autres signes de tension contractuelle dans les events.
- [04 — Typage permissif `WorldConfigDto`](./04-world-config-permissive-typing.md) — `CombatLootDto` permissif relève de ce ticket.

## Dimensions à valider en sortie

- Plus aucun type strictement identique en double dans shared (sauf justification écrite case par case).
- Un audit léger des autres duplications potentielles est fait.
