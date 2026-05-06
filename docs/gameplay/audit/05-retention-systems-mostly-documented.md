# 05 — Rétention moderne surtout documentée

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `docs/gameplay`, `battleforthecrown-pixi`, `battleforthecrown-backend`
**Tags** : retention, liveops, quests, daily-loop

## Symptôme

La documentation décrit des raids barbares globaux, événements Oyez, bénédictions quotidiennes, quêtes journalières/hebdomadaires et classements. Ces mécaniques sont centrales pour un jeu mobile moderne, mais elles ne semblent pas encore former une boucle active visible dans l'expérience actuelle.

## Localisation

- `docs/gameplay/01-overview.md:65-72` — boucle de rétention listée : raids, événements, classements, calendrier.
- `docs/gameplay/05-events-and-retention.md:1-3` — le document annonce les mécaniques de rétention principales.
- `docs/gameplay/05-events-and-retention.md:48-91` — bénédictions quotidiennes.
- `docs/gameplay/05-events-and-retention.md:93-169` — quêtes quotidiennes et hebdomadaires.
- `docs/gameplay/05-events-and-retention.md:171-180` — classements.

## Détail

Le code consulté montre des boucles de base opérationnelles : ressources, bâtiments, entraînement, combat, carte, rapports. En revanche, les systèmes qui créent le rituel quotidien et la pression événementielle semblent principalement documentés. Cela crée un écart entre la vision "jeu mobile live" et le comportement réel disponible pour le joueur.

## Impact gameplay

- Les sessions peuvent devenir purement utilitaires : récolter, lancer un timer, partir.
- Le joueur manque de raisons fortes de revenir à heure fixe ou chaque jour.
- Les biais de progression courte, completion, rareté et événement limité sont peu exploités.
- L'économie risque de manquer de sources de récompenses lisibles hors production/pillage.
- La comparaison sociale et la méta hebdomadaire restent faibles si les classements ne rythment pas l'expérience.

## Questions ouvertes

- Quelles mécaniques de rétention sont déjà branchées dans une branche non inspectée ?
- L'ordre de priorité produit place-t-il les quêtes avant les événements serveur ?
- Les récompenses de quêtes prévues sont-elles calibrées contre l'économie actuelle ou contre la vision cible ?
- Les joueurs ont-ils aujourd'hui un objectif quotidien clairement affiché ?

## Tickets liés

- [03 — Onboarding économique sans action immédiate garantie](./03-onboarding-economy-no-guaranteed-first-actions.md)
- [06 — Progression saisonnière absente de la boucle active](./06-seasonal-progression-missing.md)
- [07 — Retour en session insuffisamment ritualisé](./07-session-return-not-ritualized.md)
