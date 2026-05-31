# SPEC — BFTC Agent Runtime

But : donner aux agents le minimum de contexte stable pour décider vite pendant `$bftc-run`.
Ce fichier ne remplace pas `docs/` : il référence les sources de vérité et ne garde que les contraintes qui changent une décision d'exécution.

## §C — Contraintes non négociables

- Stack : NestJS + Prisma + Postgres backend, Pixi/React frontend, yarn workspaces.
- Gameplay server-authoritative : pas de logique métier canonique côté client.
- Events cross-process via Outbox ; pas de publication directe qui contourne l'Outbox.
- DB : aucun `DROP`, `TRUNCATE`, `DELETE`, `ALTER TABLE ... DROP COLUMN` ou migration destructive sans accord user explicite.
- `prisma migrate reset` interdit dans `/run`.
- Git : pas de `--no-verify`, pas de `git push` automatique, commits en anglais au format `<type>(<scope>): <subject>`.
- Shared package : `packages/shared/` expose types/formules pures ; les frontends le consomment sans y mettre de logique applicative.

## §S — Sources de vérité

| Domaine | Source |
|---|---|
| Architecture | `docs/architecture/decisions.md` |
| Modèle DB | `docs/architecture/data-model.md` + `battleforthecrown-backend/prisma/schema.prisma` |
| Realtime / Outbox | `docs/architecture/realtime.md` |
| Setup DB | `docs/architecture/db-setup.md` |
| Gameplay | `docs/gameplay/` |
| Règles agentiques | `.agents/rules/` |
| Runs / tickets | `tasks/runs/`, `tasks/`, `tasks/README.md` |

## §V — Invariants à appliquer

Format : `V<n> | <invariant actionnable> | source: <path>`

<!-- Ajouter uniquement si l'invariant est durable, transversal, et réellement utile à un futur run. -->

V1 | Un retour de raid doit réutiliser la durée aller figée au dispatch (`Expedition.outboundTravelMs`), jamais recalculer avec la config monde ou la stratégie courante au moment de la résolution. | source: tasks/archive/35-return-travel-time-recomputed-vs-spec.md
V2 | La puissance armée d'un village est rattachée au village d'origine des troupes : compter `UnitInventory`, `Expedition` active/retour et `Garrison` par origine réelle, jamais seulement par présence locale. | source: tasks/runs/archive/025-fix-origin-anchored-army-power.md
V3 | Toute donnée visible joueur dépendante d'un monde doit être filtrée par `worldId` côté backend et keyée par `worldId` côté frontend ; `userId` seul ne suffit pas pour power, reports, inbox, HUD ou profils. | source: tasks/runs/archive/034-fix-world-scoped-player-data.md
V4 | L'onboarding de première session est un état dédié `userId × worldId`, distinct des cartes quotidiennes, et progresse uniquement depuis les facts serveur Outbox dans l'ordre scripté courant. | source: tasks/runs/036-feature-scripted-onboarding-runtime.md
V5 | Un rapport inbox = fait métier dans une table typée par domaine (`CombatReport`, `ScoutReport`, `ReinforcementReport`) ; l'état lu/masqué est par destinataire (`InboxEntry` ou colonnes `read*/hidden*`) ; `EventOutbox` reste temps réel, jamais une archive. Ne pas créer de table `Report` polymorphe ni stocker le métier dans l'Outbox. | source: tasks/runs/archive/044-feature-reinforcement-reports.md

## §B — Bugs récurrents / anti-patterns

Format :

| id | symptôme | cause racine | fix canonique | source |
|---|---|---|---|---|

<!-- Ajouter uniquement si le bug est récurrent, subtil, ou assez coûteux pour mériter une prévention explicite. -->

| B1 | capture interrompue sans rapport défenseur pour l'occupant | les villages barbares sous capture étaient traités comme sans `defenderUserId` malgré leur garnison joueur | si une `PendingConquest.OPEN` existe sur la cible, la garnison d'occupation rend `attackerUserId` défenseur de rapport et destinataire `village.attacked` | tasks/53-capture-occupation-defense-report-missing.md |
| B2 | carte multi-village avec un seul disque de vision | le frontend recalculait un rayon depuis le village sélectionné au lieu de consommer la vision serveur | `GET /world/:worldId/entities` expose `visionDisks`; Pixi/mini-carte/filtre client consomment ces disques autoritatifs, jamais le niveau Watchtower local courant | tasks/archive/58-multi-village-vision-disks-missing.md |
## §A — Règle d'ajout

Avant d'ajouter une entrée :

1. Vérifier que l'info n'appartient pas plutôt à `docs/`, `.agents/rules/`, une fiche run, ou un ticket.
2. Ajouter une source traçable (`tasks/runs/archive/...`, `tasks/archive/...`, doc ou commit).
3. Écrire une phrase actionnable, pas une observation vague.
4. Ne pas ajouter d'entrée si elle ne changerait pas concrètement la cartographie, le refinement, l'implémentation, la review ou les tests.
