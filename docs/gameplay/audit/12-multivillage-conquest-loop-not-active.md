# 12 — Multi-village et conquête encore peu porteurs dans le code actif

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`, `battleforthecrown-pixi`, `docs/gameplay`
**Tags** : conquest, multi-village, late-game, world

## Symptôme

La vision long terme repose sur la conquête, le réseau de villages, les zones d'influence et la différenciation macro. Le code actif inspecté montre la gestion de plusieurs villages possédés, mais la conquête par Seigneur, l'installation de 6h, les zones d'influence et l'identité forte des villages semblent encore peu présentes ou non visibles dans les flux centraux.

## Localisation

- `docs/gameplay/01-overview.md:53-63` — boucle de conquête avec Seigneur et capture 6h.
- `docs/gameplay/01-overview.md:146-151` — zones d'influence et bonus de proximité.
- `docs/gameplay/04-combat-and-army.md:105-115` — conquête détaillée.
- `packages/shared/src/army/unit.ts:62-69` — unité `NOBLE` présente avec niveau Caserne 10.
- `battleforthecrown-backend/src/modules/combat/combat.worker.ts` — résolution de combat et retour d'armée, sans trace évidente dans les portions inspectées d'une capture 6h par Seigneur.
- `battleforthecrown-backend/src/modules/world/world.service.ts:435-442` — création d'un premier village seulement si le joueur n'en a aucun.

## Détail

Le jeu possède déjà les primitives d'un monde persistant : villages, coordonnées, expéditions, rapports, possession. Mais la boucle qui transforme une victoire militaire en expansion territoriale semble encore au stade de vision ou de préparation. Le late game documenté dépend fortement de cette boucle.

## Impact gameplay

- La progression peut plafonner autour d'un village optimisé.
- Les objectifs late game deviennent moins concrets.
- La carte risque de servir surtout au farming, pas à la stratégie territoriale.
- Les couronnes, Seigneurs et puissance royaume perdent une partie de leur raison d'être.
- Les zones d'influence et la proximité des villages ne peuvent pas encore créer de méta spatiale forte.

## Questions ouvertes

- La conquête est-elle implémentée dans un service non inspecté ou seulement prévue ?
- L'unité `NOBLE` est-elle entraînable et utilisable aujourd'hui en conditions normales ?
- Les villages barbares conquis conservent-ils leur identité, leurs bâtiments ou leurs coordonnées ?
- Le backend suit-il une capture en cours, son timer et ses interruptions ?
- Les zones d'influence ont-elles un modèle de données ou sont-elles uniquement documentées ?

## Tickets liés

- [02 — Combat PvP trop binaire](./02-pvp-combat-too-binary.md)
- [08 — Fog of war partiellement neutralisé côté frontend](./08-fog-of-war-frontend-filtering-risk.md)
- [10 — PvP exposé avant garde-fous de snowball visibles](./10-pvp-snowball-guardrails-unclear.md)
