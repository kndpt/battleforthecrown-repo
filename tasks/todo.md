# Bottom sheet multi-villages - timers navigation

- [x] Cartographier le rendu capitale/timers et les callbacks de navigation village/vue.
- [x] Retirer le badge `CAPITALE` du bottom sheet multi-villages.
- [x] Rendre les timers cliquables: sélectionner le bon village puis ouvrir la vue métier associée.
- [x] Ajouter/adapter les tests ciblés.
- [x] Lancer les vérifications frontend pertinentes puis `yarn static-check`.
- [x] Review finale, docs impact, commit.

## Review

- Correctness: le badge texte `Capitale` n'est plus mappé dans les cards; le statut capitale reste visible par le visuel couronné.
- UX: les timers présents sont des boutons dédiés; chantier ouvre `/game`, formation et seigneur ouvrent `/game/army` après sélection du village.
- Tests: `GameHeader.test.tsx` couvre absence du badge et navigation par timers.
