# 01 — Raids barbares sans risque réel

**Sévérité** : 🔴 Critique
**Workspace(s)** : `battleforthecrown-backend`, `packages/shared`, `docs/gameplay`
**Tags** : combat, barbarians, risk-reward, economy

## Symptôme

Les attaques contre les villages barbares sont actuellement résolues comme du pillage sans pertes pour l'attaquant. La boucle militaire documentée repose pourtant sur des raids barbares comme première activité active, puis comme levier économique important. Si cette boucle n'a aucun risque, elle devient une optimisation de capacité de transport plutôt qu'une décision stratégique.

## Localisation

- `battleforthecrown-backend/src/modules/combat/strategies/barbarian-village.strategy.ts:17` — commentaire explicite `MVP: No losses for attacker`.
- `battleforthecrown-backend/src/modules/combat/strategies/barbarian-village.strategy.ts:18-20` — pertes attaquant vides, défenseur sans troupes, survivants identiques aux unités envoyées.
- `docs/gameplay/01-overview.md:44-51` — la boucle militaire décrit les barbares comme activité de pillage et d'apprentissage.
- `docs/gameplay/02-economy-and-progression.md:134-147` — le design vise un équilibre 50/50 production passive vs pillage actif.

## Détail

Le code backend traite le village barbare comme une source de ressources défendue par aucune armée. Les templates barbares existent côté shared, mais leur usage effectif ne se retrouve pas dans la stratégie de résolution barbare actuelle. Le résultat est que la difficulté d'un raid barbare dépend surtout du trajet, du stock de la cible et de la capacité de transport, pas d'une évaluation combat.

## Impact gameplay

- Le joueur apprend que l'attaque est gratuite tant qu'il cible des barbares.
- Les unités rapides et porteuses deviennent naturellement dominantes.
- La tension de combat est reportée brutalement au PvP, au lieu d'être apprise progressivement.
- Le pillage actif peut accélérer la progression sans contrepartie proportionnelle.
- Les rapports de combat barbares risquent de manquer d'émotion : pas de pertes, pas de suspense, pas de décision mémorable.

## Questions ouvertes

- Les villages barbares sont-ils censés avoir des troupes dès le MVP ou seulement plus tard ?
- Le tier barbare affiché sur la carte correspond-il aujourd'hui à une difficulté réelle ?
- Le joueur peut-il spammer les villages barbares proches sans coût durable autre que le temps de trajet ?
- Les templates barbares actuels reflètent-ils encore le catalogue d'unités réel ?

## Tickets liés

- [02 — Combat PvP trop binaire](./02-pvp-combat-too-binary.md)
- [09 — Cibles de carte peu informatives avant attaque](./09-map-targets-low-information.md)
- [11 — Objectif 50/50 production-pillage non garanti par les systèmes actuels](./11-production-raiding-balance-unproven.md)
