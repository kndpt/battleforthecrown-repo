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

## Tickets liés

- [02 — Events WS non bindés](./02-ws-events-not-bound.md) — autres signes de tension contractuelle dans les events.

## Dimensions à valider en sortie

- Plus aucun type strictement identique en double dans shared (sauf justification écrite case par case).
- Un audit léger des autres duplications potentielles est fait.
