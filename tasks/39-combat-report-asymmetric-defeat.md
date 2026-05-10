# 39 — Rapport de combat asymétrique victoire/défaite

🟢 **Mineur** (Phase 2) — issue du [run 005](./runs/005-audit-barbarians.md). Spec amont : [`docs/gameplay/06-barbarians.md`](../docs/gameplay/06-barbarians.md) § Lisibilité joueur > Rapport de combat.

## Contexte

La spec impose une **asymétrie informationnelle** sur le rapport de combat post-raid :

| Issue | Affiché |
| --- | --- |
| **Victoire** (≥1 troupe survit) | tier + troupes barbares rencontrées + pertes attaquant + ressources volées + ressources restantes |
| **Défaite** (toutes les troupes attaquantes mortes) | tier + pertes attaquant — **rien d'autre** |

🎯 Intention : la défaite a une vraie pénalité informationnelle. Le joueur qui sous-estime un tier ne saura même pas pourquoi il a perdu.

## Pourquoi Phase 2

Le rapport de combat vit aujourd'hui dans `CombatReport` (table Prisma) et est consommé par le panneau battle reports. La **spec inbox / boîte de réception** est en Phase 2 — c'est là que la cosmétique du rapport sera revue. Pas la peine d'introduire une contrainte de masquage tant que le canal d'affichage n'est pas finalisé.

## État actuel

`CombatReport` stocke aujourd'hui de manière exhaustive : `attackerUnits`, `defenderUnits`, `lossesAttacker`, `lossesDefender`, `loot`, `resourcesLeft`, etc. Aucune asymétrie côté écriture.

## Pistes

- Stocker tout en DB (pour audit/replay), masquer côté **lecture** selon `result === 'DEFEAT'` dans le service qui sert le rapport au front.
- Ne pas stocker du tout les champs interdits si défaite : plus simple mais perd l'info pour debug/admin.
- Recommandation : **masquage à la lecture**, avec une projection DTO côté service. Préserve la traçabilité serveur.

## Dépendances

- Lié à #38 (résolution combat barbare réelle) — sans pertes attaquant calculées, la victoire/défaite n'a pas de sens.
- Lié à la spec inbox (Phase 2) — finaliser ensemble le contrat DTO du rapport.
