# Run #010 — implementation-frontend-reinforcements

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (Finalisation de la feature renforts)
- **Spec source** : `docs/gameplay/04-combat.md` § Renforts entre ses propres villages
- **Type** : `feature`
- **Modules backend** : — (déjà prêt via #33)
- **Modules frontend** : 
    - `battleforthecrown-pixi/src/features/combat` (AttackDetailModal, ExpeditionList)
    - `battleforthecrown-pixi/src/features/army` (ArmyScreen, UnitList)
    - `battleforthecrown-pixi/src/api` (queries.ts, ws-bindings.ts)
    - `battleforthecrown-pixi/src/lib/types.ts`
- **Modules transverses** : `packages/shared/src/events/schemas.ts`, `packages/shared/src/combat/dtos.ts`

## Dépendances

- Run #33 (Backend renforts) terminé et validé.

## Critère de fin (acceptance)

- [ ] Le panneau d'envoi d'armée affiche un bouton « Renforcer » uniquement si le village cible appartient au joueur.
- [ ] Les expéditions de type REINFORCE sont affichées sur la carte du monde avec une distinction visuelle (couleur ou icône).
- [ ] L'écran Armée possède une section ou un onglet « Garnison » qui liste les troupes étrangères actuellement stationnées dans le village.
- [ ] Les actions « Rappeler » (depuis le village d'origine) et « Renvoyer » (depuis le village hôte) sont opérationnelles pour les unités en garnison.
- [ ] L'interface se met à jour en temps réel via WebSocket lors de l'envoi, du rappel et du retour des renforts (événements outbox `reinforcement.sent`, `reinforcement.recalled`, `reinforcement.returned`).

## Règles à respecter

- Tests : @.agents/rules/tests.md
- QA : @.agents/rules/qa.md
- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

- T0 — Ajouter la lecture backend minimale de garnison (`GET /combat/:villageId/garrison`) pour respecter le server-authoritative.
- T1 — Mettre à jour les contrats frontend (`api/queries.ts`, `lib/types.ts`) : types de renfort/garnison, mutations `reinforce` et `recall`, invalidations.
- T2 — Brancher les événements WebSocket `reinforcement.sent`, `reinforcement.recalled`, `reinforcement.returned`, `garrison.added` dans le store d'expéditions et les caches concernés.
- T3 — Adapter le panneau d'envoi d'armée pour proposer `Renforcer` uniquement vers un village possédé par le joueur.
- T4 — Ajouter la section `Garnison` à l'écran Armée avec actions `Rappeler` et `Renvoyer` depuis les données serveur.
- T5 — Différencier visuellement les expéditions `REINFORCE` dans la liste, la carte et les lignes de trajet.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

- 2026-05-10 — Étapes 0-2 terminées : préflight clean, fiche/spec/rules lues, cartographie code effectuée localement après timeout du `code_mapper`.
- 2026-05-10 — T0/T1 terminées : endpoint garrison backend et hooks REST frontend ajoutés.
- 2026-05-10 — T2 terminée : bindings WS `reinforcement.*` et `garrison.added` branchés.
- 2026-05-10 — T3 terminée : action `Renforcer` disponible depuis la carte pour ses propres villages.
- 2026-05-10 — T4 terminée : section `Garnison` ajoutée à l'écran Armée avec `Rappeler` / `Renvoyer`.
- 2026-05-10 — T5 terminée : expéditions `REINFORCE` distinguées dans liste, carte et mini-carte.

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

- Dérogation cartographie : `code_mapper` fermé après timeout silencieux ; reprise via `rtk rg/read` ciblés conformément à `tasks/lessons.md`.
- Écart backend détecté : aucun endpoint ne liste la garnison alors que l'acceptance exige un affichage persistant. Décision : ajouter un endpoint backend de lecture minimal, car les règles serveur-autoritaire interdisent de reconstruire la garnison côté client depuis les seuls événements WS.
- Raffinement contrat garnison : `GET /combat/:villageId/garrison` expose `INCOMING` et `OUTGOING` pour couvrir à la fois `Renvoyer` depuis l'hôte et `Rappeler` depuis l'origine.
- Review findings : majeur corrigé — `reinforcement.returned` inclut maintenant `expeditionId` pour éviter de retirer plusieurs snapshots de renfort sur un même couple origine/hôte.

## Rapport final

- Synthèse : feature renforts finalisée côté Pixi/React avec action `Renforcer` depuis la carte, section `Garnison` dans l'écran Armée, actions `Rappeler` / `Renvoyer`, rendu distinct `REINFORCE` dans liste/carte/mini-carte, et bindings WS `reinforcement.*` / `garrison.added`.
- Backend minimal ajouté : `GET /combat/:villageId/garrison` server-authoritative avec lignes `INCOMING` / `OUTGOING`, filtre `quantity > 0`, et payload `reinforcement.returned` déterministe via `expeditionId`.
- Tests : `test_runner` all vert (28 suites, 268 tests, smokes inclus), puis vérification post-review verte : shared build, test WS ciblé, backend unit, backend smoke.
- Static-check : type-check backend + pixi vert ; `lint:check` backend échoue sur baseline préexistant (85 problèmes, principalement règles type-aware sur fichiers non liés et smokes). Dérogation consignée dans le commit body.
- Review : 1 finding majeur corrigé (`reinforcement.returned` sans `expeditionId`) ; pas de finding bloquant restant.
- Docs : mises à jour ciblées dans `docs/gameplay/04-combat.md`, `docs/architecture/backend-modules.md`, `docs/architecture/realtime.md`.
- Tickets ouverts : aucun.
- QA user : vérifier en jeu le scénario renfort entre deux villages possédés, puis rappel/renvoi depuis l'écran Armée.
