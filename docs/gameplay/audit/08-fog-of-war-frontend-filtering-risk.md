# 08 — Fog of war partiellement neutralisé côté frontend

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-pixi`, `battleforthecrown-backend`, `docs/gameplay`
**Tags** : fog-of-war, map, information, security

## Symptôme

La documentation présente le fog of war comme une règle server-authoritative. L'écran carte inspecté récupère pourtant les entités du monde, construit une liste complète, puis applique un filtre de vision côté frontend. Même si le backend filtre peut-être déjà ailleurs, la présence d'un filtrage local sur `allEntities` crée un risque de fuite ou d'écart avec la règle de design.

## Localisation

- `docs/gameplay/01-overview.md:74-96` — règles de fog of war, blips, vision et server-authoritative.
- `battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx:49-56` — `buildMapEntities(...)` puis `filterEntitiesByVision(...)` côté frontend.
- `battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx:59-61` — le store reçoit `visibleEntities`.
- `packages/shared/src/village/buildings.ts:427-438` — rayons de vision par niveau de Watchtower.

## Détail

Un fog of war efficace est à la fois une mécanique d'engagement et un contrat d'information. Si le frontend reçoit plus d'entités que ce qu'il doit afficher, un joueur technique peut potentiellement inspecter les données. Même sans triche, l'existence de deux filtres possibles peut produire des divergences entre ce que le serveur considère visible et ce que l'UI affiche.

## Impact gameplay

- La valeur stratégique de la Watchtower peut être diminuée si les données sont accessibles côté client.
- Les blips et la curiosité perdent leur fonction si l'information complète transite déjà.
- Les futures mécaniques de scouting, embuscade ou surprise deviennent plus fragiles.
- Le joueur peut voir une carte différente selon les chemins REST/WS et les filtres actifs.

## Questions ouvertes

- `useWorldEntitiesQuery` reçoit-il déjà un payload filtré par le backend ?
- Les blips sont-ils produits côté serveur ou reconstruits côté client ?
- Les expéditions hors vision sont-elles filtrées côté serveur dans tous les endpoints et events ?
- Les villages du joueur multi-village sont-ils correctement intégrés dans l'union des zones de vision ?

## Tickets liés

- [09 — Cibles de carte peu informatives avant attaque](./09-map-targets-low-information.md)
- [12 — Multi-village et conquête encore peu porteurs dans le code actif](./12-multivillage-conquest-loop-not-active.md)
