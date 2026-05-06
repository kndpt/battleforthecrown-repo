# 03 — Onboarding économique sans action immédiate garantie

**Sévérité** : 🔴 Critique
**Workspace(s)** : `battleforthecrown-backend`, `battleforthecrown-pixi`, `docs/gameplay`
**Tags** : onboarding, economy, first-session, retention

## Symptôme

La création d'un village initialise les ressources à `0` par défaut, sauf variables d'environnement. Cela peut empêcher le joueur d'enchaîner plusieurs actions dès sa première session. Pour un jeu mobile moderne, la première session doit généralement garantir une séquence d'actions courtes, visibles et gratifiantes.

## Localisation

- `battleforthecrown-backend/src/modules/world/world.service.ts:513-526` — stock initial créé avec `WOOD_STARTING_AMOUNT`, `STONE_STARTING_AMOUNT`, `IRON_STARTING_AMOUNT`, sinon `0`.
- `battleforthecrown-backend/src/modules/world/world.service.ts:462-505` — bâtiments initiaux créés, dont Farm/Barracks/Watchtower au niveau 0.
- `docs/gameplay/02-economy-and-progression.md:104-110` — early game visé : construction rapide, premiers raids, découverte.
- `docs/gameplay/01-overview.md:35-42` — boucle économique centrale : produire, investir, progresser.

## Détail

Le village initial possède déjà des bâtiments producteurs niveau 1, donc la progression démarre passivement. Mais en l'absence de ressources initiales, l'expérience peut commencer par de l'attente plutôt que par une action dirigée. La documentation insiste sur des sessions courtes utiles et des décisions lisibles ; le premier contact réel risque d'être plus statique.

## Impact gameplay

- Le joueur peut ne pas avoir de premier "moment de pouvoir".
- Le tutoriel implicite par action est affaibli : il voit des systèmes mais ne les manipule pas assez vite.
- La construction, l'armée et la carte peuvent sembler verrouillées plutôt que progressivement révélées.
- Le risque de churn D0 augmente si la première minute ne donne pas d'objectif clair et réalisable.

## Questions ouvertes

- Les variables d'environnement de ressources initiales sont-elles toujours définies dans les environnements de test/prod ?
- La première session attendue est-elle calibrée manuellement ou laissée à la production passive ?
- Le joueur reçoit-il ailleurs une récompense initiale qui compense ce stock à zéro ?
- Le chemin "première construction → caserne → premier raid" est-il réalisable sans pause longue ?

## Tickets liés

- [05 — Rétention moderne surtout documentée](./05-retention-systems-mostly-documented.md)
- [07 — Retour en session insuffisamment ritualisé](./07-session-return-not-ritualized.md)
- [11 — Objectif 50/50 production-pillage non garanti par les systèmes actuels](./11-production-raiding-balance-unproven.md)
