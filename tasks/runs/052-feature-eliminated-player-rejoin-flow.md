# Run #052 — feature-eliminated-player-rejoin-flow

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 7 — Conquête PvP. Premier vertical retenu sans `$bftc-slice` : état joueur éliminé + retour volontaire sur le monde + alternative autres mondes.
- **Spec source** :
  - [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md) — fin de fenêtre réussie, rapport `Capture perdue`, pas de cooldown ni bouclier post-perte.
  - [`docs/gameplay/10-conquest.md`](../../docs/gameplay/10-conquest.md) — règles communes de conquête.
  - [`docs/gameplay/19-world-lifecycle.md`](../../docs/gameplay/19-world-lifecycle.md) — multi-mondes, membership, statuts `OPEN` / `LOCKED`.
- **Type** : `feature`
- **Modules backend** : `world` (`join-world.use-case.ts`, `world.controller.ts`, `world.service.ts` ou endpoint/use-case dédié), conquête/realtime à vérifier.
- **Modules frontend** : `features/worlds`, `api/queries.ts`, `api/ws-bindings.ts`, `WorldSessionGate`, écran / composant "royaume perdu".
- **Modules transverses** : shared DTO world/events si état explicite retenu, docs gameplay/architecture/tasks.

## Décisions de cadrage

1. **Un joueur membre d'un monde mais sans village est un état métier valide**, pas une erreur technique. Cas principal : dernier village perdu par conquête PvP.
2. **Un membre éliminé peut revenir sur le même monde même si le monde est `LOCKED`.** `LOCKED` bloque les nouveaux entrants, pas le retour d'un membre déjà inscrit. `ENDED` reste non jouable.
3. **Pas de bouclier post-perte, pas de cooldown de re-conquête.** La décision gameplay stable de `14-pvp-conquest.md` et du ticket archivé `23` ne doit pas être rouverte.
4. **Ne pas passer par self-reset.** La perte PvP involontaire doit préserver `WorldMembership`, historique, rapports et contexte de monde ; le self-reset volontaire reste un autre outil.
5. **Premier run vertical borné.** Le run doit livrer l'écran "royaume perdu" + retour sur monde + choix autre monde. L'accès complet à l'inbox sans village actif est hors scope, sauf blocage découvert pendant la cartographie.

## Dépendances

- Aucune dépendance bloquante active.
- Runs / tickets connexes déjà archivés :
  - [`024 — Modal Victoire de conquête`](./archive/024-feature-conquest-victory-modal.md) — feedback conquérant livré ; pendant défenseur explicitement hors scope.
  - [`008 — Self-reset world`](./archive/008-self-reset-world.md) — reset volontaire, à ne pas confondre avec une élimination PvP.
  - [`033 — Écran sélection royaumes Pixi`](./archive/033-feature-worlds-selection-screen.md) — écran `/worlds`, cards et CTA.
  - [`034 — Isolation multi-monde des données joueur`](./archive/034-fix-world-scoped-player-data.md) — caches et endpoints world-scoped.
  - [`23 — Snowball PvP : ni cooldown re-conquête, ni bouclier post-perte`](../archive/23-pvp-snowball-no-cooldown-no-shield.md) — décision stable à préserver.
  - [`19 — Village conquis sans vision propre`](../archive/19-conquered-village-vision-gap.md) — contexte conquête/vision, hors sujet direct.

## Critère de fin (acceptance)

- [ ] `WorldSessionGate` ne rend plus `Impossible de charger ton royaume.` pour l'état `WorldMembership` existant + `0` village ; il rend un état "royaume perdu" assumé. _(auto : test Pixi)_
- [ ] L'écran mobile `/game` affiche un message DA clair expliquant que le dernier village a été conquis, sans ton technique ni blame joueur. _(visuel/gameplay IG)_
- [ ] L'écran "royaume perdu" propose deux CTA visibles : revenir sur ce monde et choisir un autre monde. _(visuel/gameplay IG)_
- [ ] Le CTA "revenir sur ce monde" crée un nouveau village initial pour un membre existant à `0` village, avec bâtiments initiaux, ressources, population et onboarding cohérents. _(auto : smoke/curl/SQL)_
- [ ] Un membre qui possède encore au moins un village ne recrée jamais de village supplémentaire via `enter`, `join` ou le nouveau chemin rejoin. _(auto : test backend/smoke)_
- [ ] Un membre éliminé peut respawn dans un monde `LOCKED`; un non-membre ne peut toujours pas rejoindre un monde `LOCKED`; un monde `ENDED` reste non jouable. _(auto : test backend/smoke)_
- [ ] `/worlds` affiche un CTA "Revenir" pour `isJoined && villageCount === 0`, et continue d'afficher "Entrer" pour `isJoined && villageCount > 0`. _(auto : test Pixi)_
- [ ] `/worlds/:worldId` applique la même distinction `Revenir` / `Entrer` que la liste des mondes. _(auto : test Pixi)_
- [ ] La perte du dernier village conserve `WorldMembership` et les rapports `Capture perdue`; aucun self-reset destructif n'est déclenché. _(auto : smoke/SQL)_
- [ ] Sur `village.conquered` reçu par l'ancien propriétaire, les caches `myMemberships`, `myVillages`, `worldEntities` et reports du monde sont invalidés, sans afficher le modal victoire conquérant. _(auto : test ws-bindings)_
- [ ] "Choisir un autre monde" mène à `/worlds` et ne laisse pas de contexte `worldId` / `villageId` stale bloquant les autres mondes. _(auto : test Pixi + visuel/gameplay)_
- [ ] `yarn static-check`, tests backend ciblés, tests Pixi ciblés et smoke backend pertinent sont verts. _(auto : commandes)_

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma` si schema/migration touchés
- Workers/Outbox : skill `bftc-workers-outbox` si event/realtime touché
- React/HUD : skill `bftc-react-hud`
- Design-system migration : skill `bftc-design-system-migration` si le run porte un visuel depuis `battleforthecrown-design-system/`

## Liens détectés

- **À faire avant** : Aucun.
- **À faire après** : Aucun identifié.
- **Doublon potentiel** : Aucun.
- **Connexe** :
  - [`024 — Modal Victoire de conquête`](./archive/024-feature-conquest-victory-modal.md) — pendant conquérant livré ; pendant défenseur hors scope.
  - [`008 — Self-reset world`](./archive/008-self-reset-world.md) — reset volontaire ; ne doit pas absorber l'élimination PvP.
  - [`033 — Écran sélection royaumes Pixi`](./archive/033-feature-worlds-selection-screen.md) — `/worlds`, cards, CTA join/enter.
  - [`034 — Isolation multi-monde des données joueur`](./archive/034-fix-world-scoped-player-data.md) — world-scoping à préserver.
  - [`67 — Réactivité temps réel de la puissance après combat`](../archive/67-power-realtime-combat-events.md) — invalidations côté ancien propriétaire à vérifier.
- **Déjà résolu (archive)** :
  - [`23 — Snowball PvP : ni cooldown re-conquête, ni bouclier post-perte`](../archive/23-pvp-snowball-no-cooldown-no-shield.md) — décision stable, ne pas rouvrir.
  - [`19 — Village conquis sans vision propre`](../archive/19-conquered-village-vision-gap.md) — vision après conquête, hors sujet direct.
- **Keywords scannés** : `conquer`, `village`, `world`, `reset`, `capture`, `membership`, `last village`, `eliminated`.

## Décomposition initiale (rempli par le lead à l'étape 3)

> Draft de cartographie (`run_planner`). À raffiner à l'étape 3 du `$bftc-run`.

- **T1 — Contrat élimination/rejoin** : cartographier précisément `WorldMembership.villageCount`, `JoinWorldUseCase`, `enterWorld`, `/worlds`, `/game`; choisir entre état implicite `villageCount=0` et DTO/endpoint explicite. Acter la règle `LOCKED`: membre éliminé peut respawn, non-membre reste bloqué.
- **T2 — Backend retour sur monde** : garantir un chemin idempotent qui crée un village initial pour un membre existant à `0` village, sans dupliquer de village pour les membres actifs et sans contourner `ENDED`.
- **T3 — Conquête/realtime** : vérifier que la finalisation de conquête PvP conserve `WorldMembership`, écrit le rapport `Capture perdue`, et notifie/invalide correctement l'ancien propriétaire.
- **T4 — Écran "royaume perdu"** : remplacer le panel danger de `WorldSessionGate` par une surface DA-compatible, mobile-first, avec message clair, CTA "Revenir" et CTA "Choisir un autre monde".
- **T5 — `/worlds`** : ajuster view-model, labels et handlers pour distinguer `Revenir` (`isJoined && villageCount === 0`) de `Entrer` (`isJoined && villageCount > 0`) et `Rejoindre` (non-membre).
- **T6 — `/worlds/:worldId`** : appliquer le même contrat sur la page détail monde, avec erreurs traduites et contexte nettoyé.
- **T7 — Tests et smokes** : ajouter ou adapter tests backend rejoin/LOCKED/ENDED, smoke SQL perte dernier village si infra disponible, tests Pixi gate/view-model/detail/ws.
- **T8 — Docs et QA** : backprop `14-pvp-conquest.md` / `19-world-lifecycle.md` si l'état éliminé ou la règle `LOCKED` ne sont pas explicitement documentés ; remplir l'Acceptance & QA.

## Points d'attention

- **Règle `LOCKED`** : le retour d'un membre éliminé est autorisé en `LOCKED`, car `LOCKED` bloque les nouveaux entrants. Ne pas généraliser aux non-membres.
- **`ENDED`** : ne pas recréer de village dans un monde terminé ; le joueur doit choisir un autre monde.
- **Historique PvP** : préserver les rapports de capture et ne pas supprimer les traces via self-reset.
- **Inbox sans village actif** : ne pas élargir le run à une refonte complète de l'accès messages sans village. Si un CTA "voir le rapport" est demandé plus tard, ouvrir un follow-up ou cadrer un run dédié.
- **Données existantes** : vérifier le cas réel `airstyle59@gmail.com` en SQL lecture seule si nécessaire pendant le run, puis réparer ou signaler les lignes déjà bloquées.
- **UX wording** : éviter une formulation punitive. Le message doit expliquer l'événement et proposer une reprise claire.
- **Village initial** : réutiliser la source de vérité de création initiale (`JoinWorldUseCase` / lifecycle bâtiments), pas une reconstruction frontend ou un second seed divergent.
- **Realtime** : le même event `village.conquered` sert au conquérant et à l'ancien propriétaire ; garder le modal victoire uniquement côté `newOwnerId`.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** : _(rempli à l'étape 10)_
- **Review indépendante** : `Déclenchée` requise (raison : (a) back+front, (c) diff estimé > 100 lignes, (d) invariant durable `membre sans village / rejoin après élimination`).
- **Tests automatisés** : _(rempli à l'étape 10)_
- **Smokes ajoutés/modifiés** : _(rempli à l'étape 10)_
- **QA fonctionnelle agent** : _(rempli à l'étape 10)_
- **Tests IG à faire par le user** : _(rempli à l'étape 10)_
