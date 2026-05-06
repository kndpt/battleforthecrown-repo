# 02 — Combat PvP trop binaire

**Sévérité** : 🔴 Critique
**Workspace(s)** : `battleforthecrown-backend`, `packages/shared`, `docs/gameplay`
**Tags** : combat, pvp, strategy, balance

## Symptôme

Le combat PvP actuel semble principalement comparer une puissance d'attaque totale à une puissance de défense totale. Le camp au-dessus gagne, le perdant principal subit des pertes totales, et les pertes du gagnant suivent un ratio simple. Cette résolution donne peu de place aux contres, à la composition, aux bâtiments défensifs, à l'information incomplète ou aux retournements partiels.

## Localisation

- `battleforthecrown-backend/src/modules/combat/strategies/player-village.strategy.ts:48` — TODO explicite sur walls, morale et building bonuses.
- `battleforthecrown-backend/src/modules/combat/strategies/player-village.strategy.ts:60-87` — calcul de puissance attaque/défense par somme brute.
- `battleforthecrown-backend/src/modules/combat/strategies/player-village.strategy.ts:97-115` — le gagnant est déterminé par `totalAttackPower > totalDefensePower`, puis le perdant est entièrement détruit.
- `docs/gameplay/04-combat-and-army.md:86-126` — le design annonce un combat simple mais stratégique, avec puissance cachée et espionnage.

## Détail

Les unités ont plusieurs champs de défense (`defenseInfantry`, `defenseCavalry`, `defenseArcher`) dans le shared, mais le calcul utilise actuellement `defenseInfantry` comme base unique. Les unités perdent donc une partie de leur identité tactique. Le mur est documenté comme bâtiment défensif, mais il est désactivé ou non branché dans la formule observée.

## Impact gameplay

- Le joueur peut optimiser avec un score brut plutôt qu'une lecture stratégique.
- Les unités spécialisées risquent d'avoir une valeur perçue faible si leurs contres ne s'expriment pas.
- Le scouting perd de l'intérêt si la réponse optimale est surtout "envoyer plus de puissance".
- Les défenses peuvent être soit inutiles, soit frustrantes, selon le ratio numérique.
- Le PvP peut favoriser fortement le snowball : un joueur en avance numériquement a peu de raisons de craindre un contre intelligent.

## Questions ouvertes

- Les types d'attaque/défense sont-ils censés être actifs au MVP ?
- La formule de pertes doit-elle produire plus de combats partiels ou des wipes fréquents ?
- Les murs et stratégies de village sont-ils considérés comme des éléments de combat centraux ou secondaires ?
- Les rapports exposent-ils assez d'information pour que le joueur comprenne pourquoi il a gagné ou perdu ?

## Tickets liés

- [01 — Raids barbares sans risque réel](./01-barbarian-raids-no-risk.md)
- [09 — Cibles de carte peu informatives avant attaque](./09-map-targets-low-information.md)
- [10 — PvP exposé avant garde-fous de snowball visibles](./10-pvp-snowball-guardrails-unclear.md)
