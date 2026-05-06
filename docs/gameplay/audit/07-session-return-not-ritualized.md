# 07 — Retour en session insuffisamment ritualisé

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-pixi`, `battleforthecrown-backend`, `docs/gameplay`
**Tags** : session-loop, return-flow, mobile-ux, retention

## Symptôme

Le jeu calcule des productions passives, constructions, entraînements, couronnes et expéditions, mais le retour en session ne semble pas présenté comme un moment ritualisé. Le joueur revient probablement à un état de jeu mis à jour, sans synthèse émotionnelle forte de ce qui s'est passé pendant son absence.

## Localisation

- `battleforthecrown-pixi/src/features/game/GameSession.tsx:52-69` — baseline ressources poussée dans le store via REST.
- `battleforthecrown-pixi/src/features/game/GameSession.tsx:70-87` — baseline couronnes.
- `battleforthecrown-pixi/src/features/game/GameSession.tsx:105-136` — synchronisation des expéditions actives.
- `docs/gameplay/01-overview.md:211-218` — philosophie mobile : feedback visuel constant, sessions courtes utiles.

## Détail

La plomberie temps réel et cache permet de garder l'état synchronisé. Ce n'est pas la même chose qu'un rituel de retour : résumé de production, constructions terminées, attaques subies, rapports non lus, récompenses disponibles, opportunités limitées. Les systèmes techniques existent en partie, mais leur agrégation en moment produit n'est pas visible dans les fichiers inspectés.

## Impact gameplay

- Le retour après plusieurs heures peut manquer de gratification immédiate.
- Les événements importants peuvent être dispersés dans plusieurs écrans.
- Le joueur peut ne pas comprendre rapidement "quoi faire maintenant".
- Les notifications et rapports peuvent devenir fonctionnels plutôt qu'émotionnels.

## Questions ouvertes

- Existe-t-il un écran ou modal de retour non inspecté ?
- Les événements Outbox contiennent-ils assez de données pour reconstruire une synthèse depuis la dernière session ?
- Le champ `lastLoginAt` est-il exploité côté gameplay ou seulement maintenu en DB ?
- Quels événements doivent être considérés comme importants pour un retour de session ?

## Tickets liés

- [03 — Onboarding économique sans action immédiate garantie](./03-onboarding-economy-no-guaranteed-first-actions.md)
- [05 — Rétention moderne surtout documentée](./05-retention-systems-mostly-documented.md)
- [06 — Progression saisonnière absente de la boucle active](./06-seasonal-progression-missing.md)
