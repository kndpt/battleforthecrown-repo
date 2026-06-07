# Run #047 — feature-capture-reports

> **Statut** : DONE
> **Démarré** : 2026-06-07
> **Terminé** : 2026-06-07

## Cible

- **Phase roadmap** : Phase 7 — Conquête PvP
- **Spec source** : [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md), [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md)
- **Type** : feature
- **Modules backend** : `combat`, `conquest`, `reports`, `event`
- **Modules frontend** : `pixi/features/combat`, `pixi/api`, inbox/messages

## Dépendances

- Conquête PvP et fenêtre `PendingConquest` déjà livrées.
- Inbox combat persistante déjà livrée par [`012-feature-inbox-combat-reports`](./archive/012-feature-inbox-combat-reports.md).
- Rapport défenseur d'occupation partiel déjà traité par [`tasks/archive/53-capture-occupation-defense-report-missing.md`](../archive/53-capture-occupation-defense-report-missing.md).
- Modal victoire conquête déjà livré par [`024-feature-conquest-victory-modal`](./archive/024-feature-conquest-victory-modal.md), mais ne remplace pas un rapport inbox persistant.

## Critère de fin (acceptance)

- [ ] Les specs `14-pvp-conquest.md` et `17-inbox-and-reports.md` décrivent la matrice complète des rapports de capture, y compris l'exception village barbare.
- [ ] Une attaque initiale avec Seigneur produit toujours un rapport de combat normal, victoire ou défaite.
- [ ] Chaque attaque reçue pendant une capture PvP crée les rapports attendus pour l'attaquant tiers, l'attaquant initial occupant et le propriétaire original selon le contrat spec.
- [ ] Si le village en capture est barbare, aucun rapport n'est créé pour un défenseur propriétaire inexistant.
- [ ] Plusieurs attaques successives pendant la même fenêtre produisent chacune leurs rapports sans écraser les précédents.
- [ ] La fin de capture PvP crée un rapport final pour le conquérant et pour le joueur qui perd le village.
- [ ] Un joueur non destinataire ne peut pas lire, marquer lu, ni masquer un rapport capture.
- [ ] Les états lu/masqué restent isolés par destinataire.
- [ ] Les events existants `battle.resolved`, `village.attacked`, `village.conquered` et `village.capture-window-*` continuent à rafraîchir inbox, carte et activités de capture.
- [ ] L'inbox distingue visuellement attaque, défense de capture, capture réussie et capture perdue sans exposer d'UUID brut.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- T1 — Modèle rapports : ajouter un état inbox observateur à `CombatReport` avec migration additive, sans table transverse.
- T2 — Backend capture : créer/présenter les rapports attaque initiale, défense/observation pendant capture et finalisation de capture, en conservant les events Outbox existants.
- T3 — Accès sécurité : étendre list/detail/read/delete aux rôles attaquant, défenseur et observateur avec états isolés et cas self-attack.
- T4 — Frontend inbox : typer le contrat et afficher des labels lisibles `Attaque`, `Défense de capture`, `Capture contestée`, `Capture réussie`, `Capture perdue` sans UUID brut.
- T5 — Specs/tests/QA : documenter la matrice, renforcer tests unitaires/smokes ciblés, lancer static checks et review indépendante.

## Progress (rempli pendant le run)

- 2026-06-07 — Préflight effectué sur branche dédiée `run/047-feature-capture-reports`; deux artefacts Yarn non suivis préexistants laissés hors commit.
- 2026-06-07 — Cartographie terminée : `CombatReport` ne gérait que deux rôles, `occupationDefense` couvrait l'occupant mais pas le propriétaire original, et aucun rapport final inbox n'était créé.
- 2026-06-07 — Backend livré : migration additive observateur, rôle `recipientRole`, accès/read/delete isolés, rapports de combat pendant capture et rapport final de capture.
- 2026-06-07 — Frontend/shared livré : DTO/events typés, invalidations inbox sur events capture/conquête, labels inbox et modal pour capture contestée/réussie/perdue.
- 2026-06-07 — Docs mises à jour : matrice capture dans `14-pvp-conquest.md`, contrat inbox capture dans `17-inbox-and-reports.md`, data model `CombatReport` aligné.
- 2026-06-07 — Review indépendante initiale `BLOCK` : self-attack masqué qui réapparaissait, invalidation inbox finalisation manquante, fuite `observerUserId` au défenseur.
- 2026-06-07 — Findings corrigés : déduplication par destinataire, invalidation `village.conquered`/`capture-window-completed`, payload WS observateur séparé.
- 2026-06-07 — QA locale complémentaire : Postgres/Docker disponibles, smokes DB réels exécutés ; le smoke inbox a révélé que les rapports attacker-only étaient exclus par un `NOT` Prisma sur colonnes nullable, corrigé en filtrant par rôle effectif.

## Décisions prises

- `CombatReport` reste la source de vérité MVP pour les rapports de capture : pas de table `Report` transverse.
- Un troisième rôle `observer` est ajouté uniquement pour le propriétaire original d'un village joueur contesté pendant capture ; l'état lu/masqué est isolé par `readByObserver` / `hiddenByObserver`.
- Pendant une fenêtre ouverte, `defenderUserId` représente l'occupant de garnison ; le propriétaire original distinct devient `observerUserId`. Village barbare : pas d'observateur propriétaire inexistant.
- Le rapport final de capture est un `CombatReport` sans unités/pertes, marqué par `details.captureFinalized`, partagé entre conquérant et ancien propriétaire joueur distinct.
- Review indépendante obligatoire déclenchée (back+front, specs, invariant durable, diff > 100 lignes). Verdict initial `BLOCK`, findings P0/P1/P2 corrigés puis review de validation `GO`.

## Rapport final

Run livré :

- Specs : matrice complète des rapports de capture, exception village barbare et labels inbox documentés.
- Backend : `CombatReport` supporte attaquant/défenseur/observateur, accès/read/delete sont scopés par destinataire, les attaques pendant capture notifient occupant + observateur, et la finalisation crée un rapport persistant.
- Frontend : inbox et modal distinguent attaque, défense de capture, capture contestée, capture réussie et capture perdue ; les events capture/conquête invalident les rapports.
- Tests : presenter backend, helper UI, smokes DB ciblés et suite smoke complète passés localement ; QA runtime agent backend/front effectuée sans navigateur IG.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Specs matrice rapports capture — `rg "Matrice des rapports inbox|Catégorie capture|Défense de capture|Capture réussie|Capture perdue" docs/gameplay/14-pvp-conquest.md docs/gameplay/17-inbox-and-reports.md` → matrice et labels présents.
  - [x] Attaque initiale avec Seigneur = rapport combat normal — `rtk yarn test` → suite smoke complète passée, incluant `combat-attack.smoke.spec.ts` et `combat-conquest-hook.smoke.spec.ts`.
  - [x] Attaque pendant capture PvP = rapports attendus pour les destinataires concernés — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- combat-reports-inbox.smoke.spec.ts conquest-finalize.smoke.spec.ts combat-conquest-hook.smoke.spec.ts realtime-socket.smoke.spec.ts` → 4 suites / 11 tests passés.
  - [x] Exception barbare sans rapport propriétaire — `rg "originalOwnerUserId|observerUserId" battleforthecrown-backend/src/modules/combat/combat.worker.ts battleforthecrown-backend/src/modules/combat/conquest.service.ts` → observateur seulement si village joueur/propriétaire distinct.
  - [x] Attaques successives sans écrasement — `rg "combatReport.create" battleforthecrown-backend/src/modules/combat/combat.worker.ts` → chaque résolution crée une nouvelle ligne ; pas d'upsert.
  - [x] Rapport final conquérant + joueur perdant — `rg "captureFinalized|writeCaptureFinalReportInTx" battleforthecrown-backend/src/modules/combat/conquest.service.ts battleforthecrown-backend/test/conquest-finalize.smoke.spec.ts` → création + assertion smoke ajoutées.
  - [x] Accès interdit aux non-destinataires — `rg "canAccessReport|getReportRole|getAllReports" battleforthecrown-backend/src/modules/combat/combat-report.service.ts` → list/detail/read/delete passent par les rôles destinataires.
  - [x] États lu/masqué isolés par destinataire — `rtk yarn workspace battleforthecrown-backend test:smoke:run -- combat-reports-inbox.smoke.spec.ts conquest-finalize.smoke.spec.ts` → read/delete attaquant/défenseur/observateur passés ; le cas attacker-only nullable a été corrigé après premier échec smoke.
  - [x] Events existants rafraîchissent inbox/carte/activités — `rg "invalidateCombatReports|village.capture-window-completed|village.conquered" battleforthecrown-pixi/src/api/ws-bindings.ts` → `battle.resolved`, `village.attacked`, `village.conquered`, `capture-window-completed` invalident l'inbox.
  - [x] Labels inbox lisibles — `../node_modules/.bin/vitest run src/features/combat/combatReportView.test.ts` → labels attaque/défense/capture testés sans UUID brut.
- **Review indépendante** : Déclenchée (raison: back+front, invariant gameplay durable, specs modifiées, diff > 100 lignes). Verdict initial `BLOCK`; findings P0 self-attack delete, P1 invalidation inbox capture finale, P2 fuite UUID observateur résolus. Review de validation : `GO`, aucun finding restant.
- **Tests automatisés** :
  - `./node_modules/.bin/prisma generate --schema battleforthecrown-backend/prisma/schema.prisma` → OK.
  - `./node_modules/.bin/tsc -p packages/shared/tsconfig.json && ./node_modules/.bin/tsc --noEmit -p battleforthecrown-backend/tsconfig.json && ./node_modules/.bin/tsc -b battleforthecrown-pixi/tsconfig.json --noEmit` → OK.
  - `cd battleforthecrown-backend && ./node_modules/.bin/eslint "{src,apps,libs,test}/**/*.ts" --quiet` → OK.
  - `cd battleforthecrown-pixi && ../node_modules/.bin/eslint . --quiet` → OK, avec warning externe `baseline-browser-mapping`.
  - `cd battleforthecrown-backend && ../node_modules/.bin/jest src/modules/combat/combat-report.presenter.spec.ts --runInBand` → OK, 6 tests.
  - `cd battleforthecrown-pixi && ../node_modules/.bin/vitest run src/features/combat/combatReportView.test.ts` → OK, 5 tests.
  - `rtk yarn static-check` → OK après correctif de listing.
  - `rtk yarn test` → OK : backend unit 26 suites / 283 tests, Pixi 63 fichiers / 354 tests, smokes 25 suites / 63 tests.
  - `rtk yarn build` → OK : backend build, Pixi production build, shared build.
  - `git diff --check` → OK.
- **Smokes lancés** : Ciblés et complets localement. `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` → OK après application de la migration additive sur `battleforthecrown_smoke`. `rtk yarn workspace battleforthecrown-backend test:smoke:run -- combat-reports-inbox.smoke.spec.ts conquest-finalize.smoke.spec.ts` → premier run `FAIL` sur listing attacker-only, correctif appliqué, relance OK 2 suites / 4 tests. `rtk yarn test` → full smoke OK 25 suites / 63 tests. Note : `realtime-socket.smoke.spec.ts` logge encore une erreur Prisma/pg-boss de teardown sur `resources.changed`, reproduite seule, mais le test passe et l'erreur ne concerne pas le payload `village.attacked` modifié.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/combat-reports-inbox.smoke.spec.ts` (observer/read/delete/self-attack), `battleforthecrown-backend/test/conquest-finalize.smoke.spec.ts` (rapport final `captureFinalized`).
- **QA fonctionnelle agent** : Exécutée sur DB temporaire clonée `battleforthecrown_047qa`, backend `15002`, frontend `5174`. `curl -fsS http://localhost:15002/health` → `database.status=up`; `curl -fsSI http://localhost:5174/` et `/design-system` → HTTP 200. Via REST authentifié : register + join world + `GET /combat/reports` → HTTP 200 ; création d'un rapport attacker-only dans la DB QA puis `GET /combat/reports`/`GET /combat/report/:id` → rapport listé, `recipientRole=attacker`; `PATCH read` puis `DELETE` → `isRead=true`, liste sans rapport, détail 404. DB temporaire supprimée après QA.
- **Tests IG à faire par le user** :
  - [ ] Lancer une capture PvP réelle, ouvrir l'inbox du conquérant et vérifier le label `Attaque` sur le combat initial puis `Capture réussie` à la fin.
  - [ ] Pendant la capture, faire attaquer le village par un tiers ou le propriétaire original et vérifier `Défense de capture` côté occupant et `Capture contestée` côté propriétaire original.
  - [ ] Vérifier qu'un village barbare capturé ne génère aucun rapport pour un propriétaire inexistant.
  - [ ] Vérifier visuellement qu'aucune carte/modale inbox n'affiche d'UUID brut.

## Contexte cartographié

Le modèle actuel `CombatReport` est centré sur deux rôles persistants : `attackerUserId` et `defenderUserId`, avec `readByAttacker/readByDefender` et `hiddenByAttacker/hiddenByDefender`. `combat-report.presenter.ts` contient déjà une exception `occupationDefense` qui présente à l'occupant initial un combat subi pendant une capture comme un rapport de défense.

Cette base ne couvre pas encore tout le besoin :

- le propriétaire original d'un village joueur en cours de capture n'a pas de rôle inbox explicite quand un tiers attaque la capture ;
- le rapport final de capture/perte n'est pas une archive métier persistante, `village.conquered` étant seulement un event temps réel ;
- les villages barbares ne doivent pas générer de rapport pour un propriétaire inexistant ;
- la terminologie du propriétaire original pendant une attaque de fenêtre doit être tranchée dans la spec avant codage.

## Pistes de design

### Piste A — Projection capture sur `CombatReport`

Garder le rapport d'attaque normal pour l'attaquant tiers, projeter l'attaquant initial en `Défense de capture`, et ajouter dans `details` une variante pour le propriétaire original du village joueur, par exemple `Capture contestée` / `Village sous capture attaqué`.

Avantage : peu de tables nouvelles, continuité avec `occupationDefense`.

Risque : le modèle binaire `attackerUserId` / `defenderUserId` devient de plus en plus spécial-casé, surtout pour trois destinataires et les rapports finaux.

### Piste B — Rapport métier capture dédié

Créer un vrai rapport de capture, par exemple `CaptureReport` + entrées inbox par destinataire, pour les événements qui ne sont pas strictement un combat attaquant/défenseur : notification du propriétaire original pendant la fenêtre, capture réussie, village perdu.

Avantage : modèle propre pour les rapports multi-destinataires et les rapports finaux.

Risque : plus de migration/API/frontend, donc à cadrer strictement pour ne pas refondre toute l'inbox.

### Piste C — Extension JSON minimale

Étendre `CombatReport.details` avec des variantes `captureDefense`, `captureContested`, `captureFinal`, et adapter le presenter/frontend.

Avantage : rapide.

Risque : dette de modèle durable, access control plus fragile, et mauvaise séparation entre combat réel et événement final de capture.

## Recommandation initiale

Commencer le run par la spec et choisir la piste après cartographie détaillée du modèle inbox. Le libellé recommandé pour le propriétaire original pendant une attaque de fenêtre est **Capture contestée** : il ne défend pas directement le combat, mais il reçoit une information importante sur le village qu'il est en train de perdre.

Si le modèle `CombatReport` ne peut pas représenter proprement les trois vues sans ambiguïté d'accès, privilégier la piste B plutôt que d'empiler des rôles implicites dans `details`.

## Liens détectés

- **À faire avant** : trancher et écrire le contrat du propriétaire original pendant les attaques de fenêtre dans `14-pvp-conquest.md` et `17-inbox-and-reports.md`.
- **À faire après** : éventuels filtres/catégories inbox et deep-link push vers rapport capture quand les notifications seront branchées.
- **Doublon potentiel** : [`tasks/archive/53-capture-occupation-defense-report-missing.md`](../archive/53-capture-occupation-defense-report-missing.md) couvre seulement le rapport défenseur pour l'occupant initial.
- **Connexe** : [`tasks/runs/archive/012-feature-inbox-combat-reports.md`](./archive/012-feature-inbox-combat-reports.md), [`tasks/runs/archive/024-feature-conquest-victory-modal.md`](./archive/024-feature-conquest-victory-modal.md), [`tasks/archive/41-capture-window-data-model.md`](../archive/41-capture-window-data-model.md), [`tasks/archive/42-combat-conquest-hook.md`](../archive/42-combat-conquest-hook.md), [`tasks/archive/46-capture-window-tracker-missing.md`](../archive/46-capture-window-tracker-missing.md).
- **Déjà résolu** : `occupationDefense` partiel, `PendingConquest`, capture finalize, modal victoire conquête.
- **Keywords scannés** : `capture`, `conquest`, `report`, `combat`, `noble`, `village`.

## Points d'attention

- Ne pas casser le comportement `occupationDefense` existant : l'attaquant initial doit continuer à lire comme défenseur quand sa garnison de capture est attaquée.
- Vérifier le cas self-attack déjà mentionné dans le ticket 53.
- Ne pas créer de rapport propriétaire pour un village barbare.
- Ne pas utiliser `EventOutbox` comme archive métier persistante.
- Préserver l'isolation lu/masqué par destinataire, notamment si le rapport implique trois joueurs.
- La feature est large ; si le refinement dépasse un scope raisonnable, segmenter en deux runs : spec/backend modèle, puis frontend/UX inbox.
