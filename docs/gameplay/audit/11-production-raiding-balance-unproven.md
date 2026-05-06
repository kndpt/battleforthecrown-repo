# 11 — Objectif 50/50 production-pillage non garanti par les systèmes actuels

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `docs/gameplay`, `packages/shared`, `battleforthecrown-backend`
**Tags** : economy, raiding, production, balance

## Symptôme

La documentation affirme un objectif économique fort : production passive et pillage actif doivent contribuer chacun environ 50 % à la progression. Les systèmes observés ne démontrent pas encore que cet équilibre est garanti, surtout avec des raids barbares sans pertes et des quêtes/rétention encore principalement documentées.

## Localisation

- `docs/gameplay/02-economy-and-progression.md:134-147` — objectif 50/50 production passive vs pillage actif.
- `packages/shared/src/resources/production.ts:3-46` — table de production par niveau.
- `battleforthecrown-backend/src/modules/combat/loot/providers/resource-loot.provider.ts:32-76` — calcul de loot par facteur et capacité.
- `battleforthecrown-backend/src/modules/combat/strategies/barbarian-village.strategy.ts:17-20` — pas de pertes contre barbares.
- `docs/gameplay/05-events-and-retention.md:161-169` — impact économique prévu des quêtes quotidiennes.

## Détail

L'équilibre production/pillage dépend de nombreux paramètres : production par niveau, stockage, fréquence de raids, temps de trajet, capacité de transport, lootFactor, disponibilité des cibles, pertes, quêtes, événements. Plusieurs de ces éléments sont présents, mais l'audit n'a pas trouvé de preuve que l'ensemble atteint réellement le 50/50 visé dans les conditions de jeu actuelles.

## Impact gameplay

- Si le pillage est trop fort, les joueurs passifs décrochent et les actifs snowballent.
- Si le pillage est trop faible, l'armée devient une taxe plutôt qu'une accélération excitante.
- Si les barbares sont gratuits, l'économie peut devenir une boucle de farming répétitive.
- Les récompenses quotidiennes peuvent surcompenser ou devenir invisibles selon leur absence/présence.
- Les temps de construction et coûts peuvent être calibrés sur une économie qui n'existe pas encore réellement.

## Questions ouvertes

- Existe-t-il une simulation d'économie 30 jours qui valide l'objectif 50/50 ?
- Le lootFactor actuel est-il calibré contre les stocks réels des villages barbares ?
- Combien de raids/jour un joueur moyen peut-il faire selon les distances et vitesses actuelles ?
- Les quêtes quotidiennes sont-elles incluses ou non dans la cible de progression officielle ?

## Tickets liés

- [01 — Raids barbares sans risque réel](./01-barbarian-raids-no-risk.md)
- [03 — Onboarding économique sans action immédiate garantie](./03-onboarding-economy-no-guaranteed-first-actions.md)
- [04 — Population incohérente entre design et code](./04-population-design-code-drift.md)
