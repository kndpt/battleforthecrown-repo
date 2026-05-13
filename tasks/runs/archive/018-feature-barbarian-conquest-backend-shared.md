# Run #018 — feature-barbarian-conquest-backend-shared

> **Statut** : DONE
> **Démarré** : 2026-05-13
> **Terminé** : 2026-05-13

## Cible

- **Phase roadmap** : Phase 5 — Conquête barbare
- **Spec source** : [`docs/gameplay/13-barbarian-conquest.md`](../../docs/gameplay/13-barbarian-conquest.md) + règles communes [`docs/gameplay/10-conquest.md`](../../docs/gameplay/10-conquest.md)
- **Type** : `feature`
- **Modules backend** : `combat`, `army`, `gameplay`, `world`, `event`, `prisma`
- **Modules frontend** : `—`

## Dépendances

- Phase 1 close : runs `001` à `007` archivés `DONE`.
- Phases précédentes livrées : inbox `012`/`015`, styles `013`/`014`, scouting `016`/`017`.
- Briques de conquête communes livrées par les tickets archivés `40`, `41`, `42`.
- Migrations locales appliquées, notamment `TrainingBuilding` et `PendingConquest`.
- Postgres + pg-boss disponibles pour les smokes backend.

## Critère de fin (acceptance)

- [ ] Le pipeline backend/shared existant `NOBLE` / `PendingConquest` / `conquest:finalize` est confronté aux specs `10` et `13`, et les écarts Phase 5 sont corrigés ou explicitement sortis du scope.
- [ ] Une attaque victorieuse contre un village barbare avec Seigneur survivant ouvre une fenêtre `PendingConquest` à durée spec par tier : T1 `2h`, T2 `4h`, T3 `6h`, T4 `9h`, T5 `12h`.
- [ ] Pendant la fenêtre, le Seigneur ne revient pas avec l'escorte ; l'escorte survivante et le loot reviennent normalement.
- [ ] Si le Seigneur meurt lors du combat de pré-conquête, aucune fenêtre n'est ouverte, `noble.killed` est émis, et le loot militaire reste ramené si l'escorte survit.
- [ ] À finalisation, un barbare T2 conquis devient un village joueur du conquérant avec `isBarbarian=false`, tier barbare vidé, ressources `0/0/0`, armée résidente `0`.
- [ ] Les bâtiments hérités respectent la whitelist spec et le niveau par tier ; aucune Tour de guet, Salle du Conseil ou Salle du Trône n'est matérialisée.
- [ ] Le village conquis démarre en style `BALANCED`, avec population recalculée selon le Moulin, les bâtiments matérialisés et le Seigneur installé.
- [ ] Les events Outbox/WS utiles à l'UI Phase 5 sont émis de façon cohérente : ouverture de fenêtre, interruption/mort Seigneur, conquête réussie.
- [ ] Un smoke backend réel couvre le cycle T2 complet : recrutement Seigneur → attaque → fenêtre → finalisation → transfert observable.
- [ ] `yarn static-check` est vert.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- Prisma : skill `bftc-prisma`
- Workers/outbox : skill `bftc-workers-outbox`

## Décomposition initiale (rempli par le lead à l'étape 3)

- T1 — Cartographier `ConquestService`, `CombatWorker`, `ConquestFinalizeWorker`, `RecruitNobleUseCase`, Prisma et smokes existants contre les specs `10`/`13`.
- T2 — Corriger la finalisation barbare dans `ConquestService` : bâtiments matérialisés whitelistés, niveaux par tier, ressources reset, population recalculée, style `BALANCED`.
- T3 — Adapter le smoke `conquest-finalize` pour prouver un barbare T2 finalisé : bâtiments, ressources, armée, population, style, events.
- T4 — Vérifier que les branches déjà livrées restent couvertes : fenêtre ouverte, Seigneur immobilisé/mort, interruption, recrutement Seigneur.
- T5 — Lancer smokes backend obligatoires + `yarn static-check`, puis review finale et doc impact.

## Progress (rempli pendant le run)

- 2026-05-13 — Étape 0 : préflight OK sur `main`, worktree clean, fiche `PLANNED`, specs/rules/SPEC/skills chargés.
- 2026-05-13 — Étapes 2-3 : cartographie lead + `code_mapper`. Constat : recrutement Seigneur, `PendingConquest`, worker finalization, hook combat, events et smokes existent déjà ; écart restant confirmé sur la matérialisation finale du village barbare conquis.
- 2026-05-13 — Étapes 4-5 : `ConquestService` corrige la matérialisation finale barbare ; `conquest-finalize.smoke.spec.ts` couvre T2, bâtiments whitelistés, ressources, population, style et Seigneur installé non disponible en armée.
- 2026-05-13 — Étape 8 : `yarn test:smoke` vert après correction d'un flaky hors diff initial dans le smoke fog-of-war (`250,250` pouvait entrer en collision avec le village joueur). `yarn static-check` vert.
- 2026-05-13 — Étapes 6-9 : review lead 5 axes OK après corrections (constantes shared, Seigneur non `UnitInventory`, fixture fog). SPEC backprop non nécessaire. Doc smoke mise à jour pour refléter le flux réel combat + `PendingConquest` + `conquest:finalize`.

## Décisions prises

- Scope corrigé en refinement : pas de migration Prisma et pas de nouveau contrat event ; le run ferme le gap backend/shared Phase 5 côté finalisation barbare + preuve smoke.
- Le run garde les sections `Cible`, `Dépendances`, `Critère de fin` inchangées ; seuls statut, décomposition, progress et rapport seront édités par le lead.
- Le Seigneur installé est consommé depuis `Garrison`, occupe la population du village conquis, mais ne redevient pas une unité `NOBLE` disponible dans `UnitInventory`. Cela aligne `docs/gameplay/10-conquest.md` et `13-barbarian-conquest.md` : armée résidente 0, Seigneur administratif.
- Le flaky fog-of-war corrigé est gardé dans ce commit parce qu'il bloquait le hard gate `yarn test:smoke` et ne change pas la logique produit.
- SPEC.md inchangé : aucun nouvel invariant transversal n'a été découvert ; les règles appliquées existent déjà dans les docs gameplay et la doc smoke.

## Rapport final

Run 018 livre la fermeture backend/shared de la conquête barbare Phase 5 côté finalisation. Les briques existantes `NOBLE`, `PendingConquest`, hook combat, worker `conquest:finalize` et events étaient déjà présentes ; le gap restant était l'état final du village barbare conquis.

Changements livrés :

- `ConquestService` matérialise désormais les villages barbares conquis selon la spec `13` : 7 bâtiments whitelistés, niveau T1/T2=1, T3=2, T4=3, T5=4, ressources reset, stock aligné Warehouse, style `BALANCED`, population recalculée.
- Le Seigneur immobilisé est consommé à la finalisation : retiré de la garnison d'occupation, population transférée vers le village conquis, pas de `NOBLE` en armée résidente.
- `conquest-finalize.smoke.spec.ts` prouve le scénario T2 avec garnison Seigneur, matérialisation, reset ressources/armée, population, style et events.
- `smoke.spec.ts` fixe le flaky fog-of-war qui créait parfois le barbare sur la même case que le village joueur.
- `docs/architecture/smoke-tests.md` décrit maintenant le flux smoke réel de conquête.

Fichiers touchés :

- `battleforthecrown-backend/src/modules/combat/conquest.service.ts`
- `battleforthecrown-backend/test/conquest-finalize.smoke.spec.ts`
- `battleforthecrown-backend/test/smoke.spec.ts`
- `docs/architecture/smoke-tests.md`

Tickets ouverts : aucun. Le frontend/UI reste dans le run `019`.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Pipeline `NOBLE` / `PendingConquest` / `conquest:finalize` confronté aux specs `10`/`13` — preuve : cartographie lead + `code_mapper`, gap résiduel limité à la finalisation barbare.
  - [x] Fenêtre de capture par tier et Seigneur survivant/mort — preuve : `yarn test:smoke`, suite `combat-conquest-hook.smoke.spec.ts` verte.
  - [x] Seigneur + escorte survivante immobilisés hors retour en garnison d'occupation — preuve : `combat-conquest-hook.smoke.spec.ts` verte, event `battle.resolved` sans unités survivantes retournées pendant la fenêtre.
  - [x] Mort Seigneur sans fenêtre, `noble.killed`, loot ramené — preuve : `combat-conquest-hook.smoke.spec.ts` verte.
  - [x] T2 finalisé devient village joueur, `isBarbarian=false`, tier vidé, ressources `0/0/0`, armée résidente `0` — preuve : `conquest-finalize.smoke.spec.ts`.
  - [x] Bâtiments hérités whitelist spec, aucun Watchtower/Council/Throne — preuve : `conquest-finalize.smoke.spec.ts`.
  - [x] Style `BALANCED` + population bâtiments + Seigneur installé — preuve : `conquest-finalize.smoke.spec.ts`.
  - [x] Events Outbox utiles (`capture-window-*`, `village.conquered`, `noble.killed`) — preuve : `yarn test:smoke`, suites conquest/recruit/combat vertes.
  - [x] `yarn static-check` vert — preuve : commande exécutée le 2026-05-13, exit 0.
- **Tests automatisés** :
  - `yarn workspace battleforthecrown-backend test:smoke conquest-finalize --runInBand` ✅ 2 tests verts.
  - `yarn test:smoke` ✅ 8 suites, 30 tests verts.
  - `yarn static-check` ✅ backend type-check, pixi type-check, backend lint, pixi lint verts.
- **Smokes lancés** :
  - `yarn test:smoke` ✅ 8 suites / 30 tests.
- **Smokes ajoutés/modifiés** :
  - Modifié `battleforthecrown-backend/test/conquest-finalize.smoke.spec.ts` : finalisation T2 avec bâtiments whitelistés, ressources reset, population, style `BALANCED`, Seigneur consommé sans armée résidente.
  - Modifié `battleforthecrown-backend/test/smoke.spec.ts` : fixture fog-of-war anti-collision de coordonnées.
- **QA fonctionnelle agent** : smokes backend réels avec Postgres + pg-boss + Outbox ; transfert et events observés par assertions DB/Outbox. Aucun curl manuel nécessaire.
- **Tests IG à faire par le user** : Aucun test IG nécessaire pour ce run backend/shared ; le flux UI est volontairement reporté au run `019`.
