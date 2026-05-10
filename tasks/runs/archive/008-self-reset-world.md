# Run #008 — self-reset-world

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : **hors phase** — outil joueur transverse (équivalent fonctionnel d'un « leave & rejoin propre »). Ne bloque ni ne débloque aucune phase de [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md). À justifier en intro du commit.
- **Spec source** : pas de spec dédiée. La sémantique « état initial » se réfère à [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) § Démarrage et au flow `JoinWorldUseCase` (création village + ResourceStock + Population + CrownBalance).
- **Type** : `feature`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/world/` (nouveau use-case `reset-world.use-case.ts` + endpoint dans `world.controller.ts`)
  - `battleforthecrown-backend/src/modules/world/world.module.ts` (provider du use-case)
  - **Lecture seule** : `join-world.use-case.ts` (référence inverse — table par table, ce que `Join` crée doit être ce que `Reset` détruit)
- **Modules frontend** :
  - `battleforthecrown-pixi/src/features/worlds/MyWorldsScreen.tsx` (bouton « Réinitialiser ce monde » sur la carte de monde)
  - `battleforthecrown-pixi/src/api/queries.ts` (mutation `useResetWorldMutation` + invalidations)
  - `battleforthecrown-pixi/src/ui/modals/` (modale de confirmation — réutiliser `Modal` existant, pas de nouveau primitive)
- **Modules transverses** : —
- **Décision tranchée à la planification** :
  - Cible reset = **self-reset uniquement**. Le user reset SON propre compte sur un monde. Pas de RBAC, pas de guard admin. `WorldRole.MOD` (enum Prisma actuellement inutilisé) reste explicitement hors scope.
  - Profondeur = **hard reset** (full wipe). Après reset, le joueur peut re-rejoindre via le flow normal `POST /world/:id/join` comme un nouveau joueur.
  - Périmètre = **run unique end-to-end** (backend + bouton IG + QA hybride).

## Dépendances

- **Aucun run amont bloquant**. Phase 1 (audits 001-007) toujours en cours mais le reset est orthogonal aux specs économie/buildings/combat — ne touche aucune formule.
- **Hypothèse à valider à l'étape 2 (cartographie)** : confirmer qu'aucun worker pg-boss ne crash si sa cible (village/expedition/training row) disparaît entre-temps. Pattern attendu : chaque worker fait un `findUnique` au début et `return` silencieux si null. Si un worker ne respecte pas ce pattern, le run le corrige *au passage* (1 fichier, défensif) — pas un nouveau ticket.

## Critère de fin (acceptance)

### Backend

- [ ] **Endpoint** `DELETE /world/:worldId/me` créé. Auth : `@CurrentUser()`. Pas de `@Public()`.
- [ ] **Use-case `ResetWorldUseCase.execute({ userId, worldId })`** : transaction Prisma unique qui supprime, dans cet ordre (FK + ergonomie de logs) :
  1. `Expedition` `WHERE attackerVillageId IN (villages du user sur ce monde)` — pas de FK, suppression manuelle obligatoire.
  2. `CombatReport` `WHERE worldId = :worldId AND attackerUserId = :userId` (le joueur en attaquant) **+** `UPDATE ... SET defenderUserId = NULL, defenderVillageId = NULL WHERE worldId = :worldId AND defenderUserId = :userId` (anonymisation côté défenseur — préserve le report pour l'autre joueur). Décision documentée dans `## Décisions prises` à l'étape 3.
  3. `Village` `WHERE userId = :userId AND worldId = :worldId` — cascade Prisma sur `Building`, `ResourceStock`, `Population`, `UnitInventory`, `UnitTraining`, `PowerSnapshot`, `VillageStrategyConfig`. **Vérifier** que `prisma/schema.prisma` cascade bien tous ces enfants (déjà confirmé planif : 100 % `onDelete: Cascade`).
  4. `CrownBalance` `WHERE userId = :userId AND worldId = :worldId` — pas de cascade automatique.
  5. `WorldSeedState` `WHERE userId = :userId AND worldId = :worldId` — pas de cascade automatique.
  6. `WorldMembership` `WHERE userId = :userId AND worldId = :worldId` — en dernier (UI consomme).
  7. `EventOutbox` ⇒ **pas touché**. Les events non dispatchés référenceront des aggregates fantômes ; le frontend doit déjà ignorer les events orphelins (cas reconnect WS). À valider à l'étape 2.
- [ ] **Idempotence** : un reset sur un monde où le user n'a déjà aucune trace renvoie 200 (no-op silencieux). Pas de `NotFoundException`.
- [ ] **Aucun event Outbox émis pour le reset.** Pas de `world.player-reset` ni équivalent. Justification : aucun autre joueur n'a besoin d'être notifié en temps réel d'un reset (pas de partage de vue persistant). Les vues `WorldEntities` se rafraîchiront naturellement au prochain refetch / mouvement viewport. **À reverrer si la review identifie un cas concret de désync visible chez un autre joueur.**
- [ ] **Pas de logique métier** dans `world.controller.ts` (cf. `nest-conventions.md`). Le controller délègue au use-case et c'est tout.
- [ ] **Tests pure-logic** : aucun. `ResetWorldUseCase` est de l'orchestration Prisma pure → smoke (cf. `tests.md`). Si un helper pur émerge à l'écriture (ex. `buildResetTransactionPlan(userId, worldId)`), tester ce helper. Sinon, **pas de spec** pour ce run. Documenter explicitement dans le rapport final.
- [ ] **Smoke** : ajouter un flow dans `test/smoke/` qui exerce `joinWorld → upgrade → reset → joinWorld → upgrade` pour vérifier l'idempotence + reseed propre. **Si > 50 lignes ou si l'infrastructure smoke ne le couvre pas trivialement → ticketé**, pas livré dans ce run.
- [ ] `yarn workspace battleforthecrown-backend test` vert (incluant unit existants).

### Frontend

- [ ] **Bouton** sur chaque carte de monde dans `MyWorldsScreen.tsx`, entre « Entrer » et le bord du panel, variant `danger` size `sm`, label « Réinitialiser ».
- [ ] **Modale de confirmation** (réutiliser `@/ui/modals/Modal`) avec :
  - Titre : `Réinitialiser <nomDuMonde> ?`
  - Corps : explication courte + liste à 3 puces des conséquences (« Tous tes villages seront supprimés », « Tes couronnes du monde seront perdues », « Tes expéditions en cours seront annulées »).
  - **Champ texte de garde-fou** : l'utilisateur doit taper le nom du monde pour activer le bouton de confirmation. Réutilise un pattern UI existant si présent ; sinon `Input` brut + état local.
  - Boutons : « Annuler » (ghost) + « Réinitialiser définitivement » (danger, disabled tant que le texte ne match pas).
- [ ] **Mutation `useResetWorldMutation`** dans `api/queries.ts`. `onSuccess` invalide :
  - `queryKeys.myMemberships(userId)`
  - `queryKeys.myVillages(userId, worldId)`
  - `['villages']` global (par cohérence avec `useJoinWorldMutation`)
  - **Pas optimistic** — opération destructive, le rollback est non trivial et le coût latence (1 transaction Prisma) est acceptable.
- [ ] **Pas de redirect implicite**. Après reset, l'utilisateur reste sur `MyWorldsScreen` ; la carte de monde sort naturellement de la liste (membership supprimée). Si l'utilisateur était `/game` au moment du reset (cas hors flow nominal — reset depuis un settings IG plus tard) : **hors scope, ticketé**.
- [ ] **`useGameStore.context`** : si `worldId === resetWorldId`, clear le contexte (`setContext({ worldId: null, villageId: null })`) après succès. Évite que l'utilisateur clique « Entrer » sur un autre monde avec un contexte stale.
- [ ] `yarn workspace battleforthecrown-pixi test` vert.
- [ ] `yarn workspace battleforthecrown-pixi build` vert.

### QA

- [ ] **`## QA backend (vérifié par l'agent)`** — instance sur port 15002, scénario complet : register → join → upgrade un bâtiment → reset → vérification SQL exhaustive (0 row pour les 8 tables liées) → re-join → vérification que le village initial est bien recréé.
- [ ] **`## QA`** (user IG) — checklist trivial : « rejoindre un monde → cliquer Réinitialiser → confirmer → carte disparaît → cliquer Rejoindre → village neuf ». ≤ 5 cases.

### Docs / Git

- [ ] **`docs/architecture/auth.md`** — section « Pas (encore) bloqué » mise à jour si la decision impacte l'analyse RBAC. Vérifier qu'on ne contredit pas l'absence d'admin.
- [ ] **`docs/architecture/data-model.md`** — vérifier si une note « cycle de vie player ↔ monde » est utile. Si oui, ajouter ; sinon, justifier.
- [ ] **Pas de nouvelle doc** créée par défaut. La doc existe via le code + le run archivé.
- [ ] Commit unique format `<type>(<scope>): <subject>` (cf. `git.md`). Type = `feat`, scope = `backend/world` + `pixi/worlds` (multi-scope = subject explicite).
- [ ] Section `## Rapport final` remplie + `git mv` de la fiche dans `runs/archive/`.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md
- Backend : @battleforthecrown-backend/.claude/rules/nest-conventions.md, @battleforthecrown-backend/.claude/rules/prisma.md, @battleforthecrown-backend/.claude/rules/workers.md
- Frontend : @battleforthecrown-pixi/.claude/rules/react-hud.md

## Décomposition initiale (rempli par le lead à l'étape 3)

Décomposition finalisée après cartographie (sub-agent `code-mapper` id `a039f9825a8f1f020`) :

- **T1 — Cartographie** ✅ Confirmé : Village cascade les 7 enfants attendus (Building, ResourceStock, Population, UnitInventory, UnitTraining, PowerSnapshot, VillageStrategyConfig). Expedition + CombatReport sans relation Prisma vers Village/User → suppression manuelle obligatoire. Workers (combat, return, construction, training) tous safe (pattern `findUnique` + early return). OutboxWorker safe (payload JSON sans jointure). Frontend ws-bindings sans guard explicite mais inoffensif (sera overwrite au refetch).
- **T2 — Backend** : `ResetWorldUseCase` + endpoint `DELETE /world/:worldId/me` + provider module. 3 fichiers : `world/reset-world.use-case.ts` (nouveau), `world/world.controller.ts`, `world/world.module.ts`. Transaction Prisma unique, ordre : Expedition → CombatReport (delete attaquant + nullify défenseur) → Village (cascade) → CrownBalance → WorldSeedState → WorldMembership. Idempotent (no-op si rien à supprimer).
- **T3 — Smoke** : 1 `it()` dans `test/smoke.spec.ts`. Flow register → join → upgrade WOOD → reset → vérif SQL exhaustive (0 row sur 7 tables) → re-join → vérif village neuf lv1. Budget ≤ 60 lignes (infra mature, helpers OK).
- **T4 — Frontend mutation** : `useResetWorldMutation` dans `api/queries.ts`. Pattern miroir de `useJoinWorldMutation`. `onSuccess` invalide memberships + villages + clear `useGameStore.context` si `worldId` matche.
- **T5 — Frontend UI** : bouton "Réinitialiser" sur chaque carte de monde dans `MyWorldsScreen.tsx` + Modal inline avec garde-fou texte (typer le nom du monde). Réutilise `Modal` existant.
- **T6 — Review** : `agent-skills:code-reviewer` sur le diff complet (5 axes, sévérité par finding).
- **T7 — Fix findings + re-tests** : fixs bloquants/majeurs ; mineurs ticketés si hors scope. `test-runner` final (backend unit + smoke + pixi).
- **T8 — QA backend agent + rapport + commit + archive** : QA backend sur port 15002. Rapport final. `git mv` vers `runs/archive/`. Commit unique conventional. Pas de push.

## Points d'attention

- **`Expedition` et `CombatReport` n'ont aucune relation Prisma vers `Village`/`User`** (vérifié `schema.prisma:294-351`). Cascade automatique impossible — suppression manuelle obligatoire dans la transaction. **Si cette observation est remise en cause à l'étape 2 (cartographie), corriger la décomposition.**
- **`CombatReport` côté défenseur** : un report où le user reset était défenseur appartient logiquement à l'attaquant (qui veut garder son rapport). Décision = anonymiser (`SET defenderUserId = NULL, defenderVillageId = NULL`). Le report reste lisible côté attaquant ; le défenseur (qui n'existe plus sur ce monde) ne le verra pas. Justifier dans `## Décisions prises`.
- **Inbound expeditions** (autres joueurs en route vers une cible désormais supprimée) : `Expedition.targetRefId` pointait vers un village du joueur reset. Au moment où `combat.worker` se déclenche pour cette expédition, le village n'existe plus.
  - **Comportement attendu** : l'expédition doit revenir « returning » avec 0 loot, sans combat. À vérifier dans le code de `combat.worker` à l'étape 2. Si le worker crash sur village manquant → fix défensif inclus dans le run (1 fichier, ≤ 5 lignes : `if (!targetVillage) { schedule return; return; }`).
  - **Si le fix défensif > 10 lignes** → ticketé et noté en risque résiduel ; le run ne s'arrête pas pour ça.
- **pg-boss jobs orphelins** (construction/training d'un village supprimé) : même logique. Workers attendus à `findUnique(buildingId)` → `if (!row) return`. Vérification à l'étape 2.
- **Idempotence** : si le user spamme « Réinitialiser » deux fois en parallèle (clic rapide + WebSocket re-render), la 2ᵉ requête doit être no-op. Le DELETE Prisma est intrinsèquement idempotent ; on **ne renvoie pas 404** si rien à supprimer. Test : envoyer 2× la requête en parallèle dans la QA backend.
- **EventOutbox non purgée** : on laisse les events non dispatchés vivre. Le frontend voit déjà des events orphelins en cas de reconnect tardif (cf. `realtime.md` § « Garanties »). À confirmer à l'étape 2 — si le frontend crash sur un event orphelin référençant un village supprimé, ouvrir un ticket défensif côté `ws-bindings.ts`, ne pas l'inclure dans 008.
- **WebSocket en cours** : le user est connecté à `gameSocket` quand il clique reset. Si reset depuis `MyWorldsScreen`, il n'est pas dans une room `worldId` (la room est joinée par `GameScreen`). Cas nominal OK. **Si la décision future ajoute le bouton dans un settings IG (depuis `GameScreen`)**, la déconnexion / room leave devient nécessaire — hors scope 008.
- **Sécurité** : l'endpoint est `/world/:worldId/me` — `:userId` n'est pas dans l'URL, c'est `@CurrentUser().id` qui le détermine. **Aucun risque de spoof**. Pas besoin d'`OwnershipService.assertWorldMember` car la suppression est intrinsèquement scopée à `(userId, worldId)` et idempotente.
- **`WorldRole.MOD`** : enum présent en Prisma, jamais lu en code. **Ce run ne le touche pas.** Si une review le pointe comme dead code, ouvrir un ticket de cleanup, pas le résoudre ici.
- **Garde-fou frontend** : la saisie du nom du monde au clavier est explicitement choisie comme garde-fou (pattern « tape le nom du repo pour le delete » de GitHub) plutôt qu'un double-clic ou une countdown — moins frustrant en répétition, plus solide contre le clic accidentel. Pas de remise en cause sans nouvelle décision user.

## Progress (rempli pendant le run)

- **2026-05-10** — Étape 0 préflight OK. Étape 1 saute (aucune ambiguïté, fiche complète). Étape 2 cartographie (sub-agent `code-mapper` id `a039f9825a8f1f020`) : décomposition pré-établie validée intégralement. Étape 3 décomposition finalisée. Statut → RUNNING.
- **2026-05-10** — T2 backend (sub-agent `implementer` id `a6841a4ab07f56bd0`) → 3 fichiers conformes mais 7 fichiers de reformatage Prettier hors scope reverter via `git checkout`. Build TS vert.
- **2026-05-10** — T3 smoke écrit directement par le lead (helpers matures, pattern connu). Smoke vert (sub-agent `test-runner` id `ad7c7f093fbc75f69`).
- **2026-05-10** — T4 mutation + T5 UI codés directement par le lead. Build pixi vert (1 fix `variant="default"` → `"neutral"`).
- **2026-05-10** — T6 review (sub-agent `code-reviewer` id `a651758038d1fed28`) → 3 majeurs, 0 bloquant. Findings traités en T7.
- **2026-05-10** — T7 : transaction array → callback (intègre `findMany`), assertion défenseur dans le smoke, idempotence parallèle (`Promise.all`), count `combatReport`. Re-tests verts (sub-agent `test-runner` id `acbb7a9c6c7fcec5c`) : 187 tests passent, 0 échec.
- **2026-05-10** — T8 QA backend port 15002 OK : register → join → reset → 0 row sur 9 tables → re-join → village neuf lv1. Doc `data-model.md` mise à jour (note cycle player↔monde). Cleanup user fixture.

## Décisions prises

Décisions de planification déjà actées :

- **Self-reset uniquement** (cf. réponse user). Pas de RBAC, `WorldRole.MOD` hors scope.
- **Hard reset** (full wipe, peut re-join). Pas de soft reset, pas de re-join propre avec membership conservée.
- **Run unique end-to-end** (backend + UI + QA), pas de ticketage front.
- **Anonymisation des CombatReport côté défenseur** (préserver l'historique de l'attaquant).
- **Garde-fou par saisie du nom du monde** (pattern GitHub-like).
- **Pas d'event Outbox `world.player-reset`** par défaut (à reverrer si review identifie un cas de désync visible).

Décisions prises pendant le run :

- **Forme `$transaction(async tx => ...)`** retenue (vs forme array initiale). Aligne sur la rule `prisma.md` ET intègre le `findMany(villageIds)` dans la transaction → pas de race avec un `joinWorld` concurrent.
- **Inbound expeditions non explicitement nettoyées** par le use-case. Justification : `combat.worker.ts` (lignes 113, 141, 146) garde `if (defenderVillage)` autour de tout side-effect lié à la cible — combat résolu "à vide" → `lossesAttacker` appliquées, `loot = {}`, expédition repart `RETURNING`. L'attaquant repart bredouille mais ne crash pas. Comportement acceptable produit ; couvert par la lecture du code, pas par un smoke dédié (set-up trop coûteux pour un edge-case).
- **Garde-fou texte case-sensitive** assumé (pattern GitHub-like, défense contre clic accidentel — pas un piège UX).
- **Doc `data-model.md`** : note ajoutée dans § Mondes pour décrire le cycle de vie player↔monde (join + reset, pointe vers les use-cases).
- **Doc `auth.md`** : pas de modif. Le run ne contredit ni n'élargit l'analyse RBAC existante (`WorldMembership.role` reste l'unique notion).

### Dérogation lead

- **T2** — sub-agent `implementer` (id `a6841a4ab07f56bd0`) annonçait 3 fichiers `FILES_TOUCHED` mais avait reformaté Prettier 7 fichiers hors scope (login.dto, refresh.dto, register.dto, prisma-shared-enums, combat.service, combat.worker, upgrade-building.use-case, smoke.spec — uniquement wrap de lignes longues, aucun changement sémantique). Hard gate `git diff` a détecté l'écart, lead a `git checkout --` les 7 fichiers pour rester chirurgical (3 fichiers réels du contrat).

### Review findings (sub-agent `code-reviewer` id `a651758038d1fed28`)

- **[majeur] Inbound expeditions non gérées** → arbitré : comportement défensif déjà en place dans `combat.worker`. Documenté ci-dessus, pas de fix code.
- **[majeur] Forme `$transaction` array vs callback** → fixé en T7 (refacto callback + intégration `findMany`).
- **[majeur] Smoke incomplet (défenseur, parallèle)** → fixé en T7 (3 assertions ajoutées : `defenderUserId/defenderVillageId === null`, `Promise.all` de 2 DELETE, `combatReport` count).
- **[mineur] `combatReport` absent du bloc counts** → fixé en T7.
- **[nit] Forme conditionnelle `...(villageIds.length > 0 ? [...] : [])`** → résolu par le passage en callback (`if (villageIds.length > 0)` lisible).
- **[nit] Garde-fou case-sensitive** → assumé (cf. décisions).
- **[nit] Pas de rate-limit sur DELETE destructif** → ticket résiduel implicite (pattern à appliquer quand le throttler global sera mis en place, hors scope MVP).
- **Tous les autres axes (security, performance, architecture)** : RAS ou mineur acceptable.

## Rapport final

### Synthèse

Endpoint `DELETE /world/:worldId/me` livré : un joueur peut se "réinitialiser" sur un monde donné depuis l'écran *Mes royaumes* (bouton danger + modale de confirmation avec saisie du nom du monde). Backend : transaction Prisma callback qui efface villages (cascade sur 7 enfants), CrownBalance, WorldSeedState, WorldMembership, expeditions sortantes + reports attaquant, et anonymise les `CombatReport` côté défenseur. Idempotent (no-op si rien à supprimer), thread-safe (transaction couvre `findMany` + `deleteMany`). Le joueur peut re-join immédiatement comme un nouveau joueur via le flow normal. Aucun event Outbox émis.

### Fichiers touchés

Backend :
- `battleforthecrown-backend/src/modules/world/reset-world.use-case.ts` (nouveau, 50 lignes)
- `battleforthecrown-backend/src/modules/world/world.controller.ts` (+endpoint DELETE)
- `battleforthecrown-backend/src/modules/world/world.module.ts` (+provider)
- `battleforthecrown-backend/test/smoke.spec.ts` (+1 `it()` "reset world", ~95 lignes avec assertions étendues)

Frontend :
- `battleforthecrown-pixi/src/api/queries.ts` (+`useResetWorldMutation`)
- `battleforthecrown-pixi/src/features/worlds/MyWorldsScreen.tsx` (bouton + modale garde-fou)

Docs :
- `docs/architecture/data-model.md` (note cycle de vie player↔monde dans § Mondes)

### Tests

- Unit backend : 9 suites / 108 tests verts.
- Unit pixi : 13 suites / 79 tests verts.
- Smoke backend : 14 tests verts (le nouveau "reset world" en 271 ms inclus). Couvre : full wipe sur 9 tables, anonymisation `CombatReport` côté défenseur, idempotence séquentielle ET parallèle, re-join post-reset avec village neuf lv1.
- Build TS backend + pixi : verts.
- QA backend port 15002 : flow `register → join → upgrade → DELETE → 0 row → re-join → village neuf lv1` exécuté contre la DB dev — conforme.

### Tickets résiduels

- **Rate-limiting DELETE destructif** : à inclure quand un throttler global sera mis en place (pattern hors scope MVP, signalé en review nit).
- **doc `data-model.md`** mentionne `BuildingQueue`, `ArmyUnit`, `TrainingQueue` (refactorisés en `UnitInventory`/`UnitTraining`/`Building.startTime/endTime`) — désync **préexistante**, hors scope du run.

### QA (à faire par le user, in-game)

**Résultat attendu** : depuis *Mes royaumes*, un bouton "Réinitialiser" rouge apparaît sur chaque carte de monde ; le clic ouvre une modale qui exige de taper le nom du monde pour activer le bouton de confirmation ; après confirmation, la carte disparaît et un re-join via "Découvrir d'autres mondes" donne un village vierge.

- [ ] Sur *Mes royaumes*, vérifier qu'un bouton "Réinitialiser" rouge apparaît sur chaque carte
- [ ] Cliquer "Réinitialiser" sur un monde → la modale s'ouvre, le bouton "Réinitialiser définitivement" est grisé
- [ ] Taper le nom exact du monde → le bouton s'active
- [ ] Confirmer → la carte de monde disparaît de la liste
- [ ] Aller sur "Découvrir d'autres mondes", rejoindre le même monde → on revient sur *Mes royaumes* avec une nouvelle carte (1 village)

### Méta-évaluation du run

- **Cartographie validée intégralement** par l'observation : tous les points d'attention pré-listés (cascades, workers safe, Outbox safe) confirmés sans surprise.
- **Une dérogation lead** (T2 reformatage Prettier hors scope par l'implementer). Détectée par le hard gate `git diff` immédiat — pas escaladé.
- **Review productive** : 3 majeurs pertinents, dont 2 réellement actionnables et fixés (M2 + M3). Le 3ᵉ (M1 inbound) tranché par lecture du code défensif existant. Pas de cycle correctif.
- **Périmètre final** : 6 fichiers de code + 1 doc + 1 fiche. Conforme à la pré-décomposition.
