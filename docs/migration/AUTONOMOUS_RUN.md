# Run autonome nocturne — protocole

> **Lis ce fichier EN ENTIER avant toute action.** Tu es en mode autonome (`--dangerously-skip-permissions`). Cela ne te dispense PAS des règles ci-dessous — au contraire, c'est ce qui te tient.

## Contexte

Tu prends en main le chantier de migration du frontend `battleforthecrown` vers une stack Vite + React + PixiJS v8 + Zustand + TanStack Query.

L'utilisateur a validé tous les choix d'architecture. Le plan est figé et documenté dans `docs/migration/`. Ton job pour cette session : **exécuter les phases dans l'ordre, jusqu'au bout, en t'auto-paçant via `/loop`**.

L'utilisateur dort. Il auditera demain matin via `git log` + `CHANGELOG.md`.

## Ordre de lecture obligatoire au démarrage

1. `~/.claude/CLAUDE.md` (auto, déjà chargé) — préférences globales user
2. `/CLAUDE.md` (racine du repo, auto) — briefing repo
3. **Ce fichier** (`docs/migration/AUTONOMOUS_RUN.md`) — protocole nocturne
4. `docs/migration/README.md` — carte de la doc
5. `docs/migration/03-migration-plan.md` — plan détaillé des 8 phases (la référence)
6. `docs/migration/db-setup.md` — commandes DB + SQL utiles
7. `docs/migration/06-api-contract-snapshot.md` — endpoints REST + events WS

Avant d'attaquer une phase, **(re)lire la section correspondante de `03-migration-plan.md`** + tout doc référencé.

## Règles non négociables

### Toujours faire

- ✅ **Plan mode ON** pour toute phase non triviale (toutes sauf 0). Génère le plan, exécute-le, vérifie.
- ✅ **Definition of Done strict** : ne pas marquer une phase « ok » sans que TOUS les critères de DoD soient remplis. En cas d'échec, écris un blocker et passe à la suivante si elle est indépendante.
- ✅ **Commit propre par phase**, format `<type>(<scope>): <subject>`, en EN. Exemple : `feat(pixi-frontend): scaffold Vite + React + Pixi v8`.
- ✅ **Mise à jour de `docs/migration/CHANGELOG.md`** à la fin de chaque phase (entrée complète selon le template du fichier).
- ✅ **Mise à jour de `docs/migration/README.md`** (table de statut des phases).
- ✅ **Vérification empirique** : pour chaque DoD, exécute la commande qui le prouve (test, curl, query SQL, screenshot). « Ça compile » ne suffit pas.
- ✅ **Yarn**, jamais npm.
- ✅ **TodoWrite** pour suivre la phase en cours.

### Jamais faire

- ❌ **`git push`**, **`git push --force`**. Tout reste en local.
- ❌ **`git reset --hard`**, **`git checkout -- .`** sur du travail non-committé.
- ❌ **`git rebase -i`**, **`git rebase --no-edit`** (interdits par le system prompt).
- ❌ **`docker compose down -v`** (le `-v` détruit le volume DB → toutes les données disparaissent).
- ❌ **`prisma migrate reset`** (CLAUDE user : « never reset a prisma db »).
- ❌ **Modifier `battleforthecrown/`** (legacy — sert de référence vivante).
- ❌ **Modifier `battleforthecrown-backend/`** (sauf si bug bloquant identifié → écrire un blocker et passer à autre chose).
- ❌ **Modifier `packages/shared/`** (lecture seule pour les workspaces frontend).
- ❌ **Supprimer `battleforthecrown/`** (la suppression est en Phase 7, mais laisse-la **en attente de validation user au matin** — archive en branche `legacy/nextjs-frontend` mais ne supprime pas du working tree).
- ❌ **Désactiver des hooks git** (`--no-verify`, `--no-gpg-sign`).
- ❌ **Ajouter de la dépendance non documentée** dans `05-pixijs-stack-decisions.md` sans mettre à jour le doc.
- ❌ **`any`** TypeScript pour faire taire le compilateur. Toujours typer correctement.
- ❌ **Inventer un endpoint** ou un event WS qui n'est pas dans `06-api-contract-snapshot.md`. Si manquant : blocker + skip.

### En cas de blocker

1. Écris une entrée `❌ Blocker` dans le CHANGELOG.
2. Commits ce qui marche (même partiellement) avec un message explicite : `wip(<scope>): <progress> — blocker: <raison>`.
3. **Si la phase suivante est indépendante**, passe à la suite.
4. **Sinon**, mets-toi en pause (laisse une entrée TODO dans le CHANGELOG, ne consomme plus d'itérations `/loop`).
5. **Au matin, l'utilisateur reprend.**

## Comment tu boucles avec `/loop`

L'utilisateur a dû lancer la session avec :

```
claude --dangerously-skip-permissions
```

Puis dans le prompt initial :

```
/loop "Continue la migration PixiJS de Battle for the Crown selon docs/migration/AUTONOMOUS_RUN.md. Avance d'une phase, valide la Definition of Done, commits, mets à jour CHANGELOG.md, puis enchaîne."
```

`/loop` sans intervalle = **mode self-paced**. À chaque tour :
- Tu fais le boulot.
- À la fin du tour, tu appelles `ScheduleWakeup` avec `delaySeconds` = 60 à 3600 selon ce que tu attends (compile court → 60-270s, build/test long → 300-1800s, idle → 1800-3600s).
- Si tu termines toutes les phases ou si tu hits un blocker terminal : **n'appelles pas ScheduleWakeup → la boucle s'arrête.**

Cf. la doc Claude Code sur `/loop` et `ScheduleWakeup`.

## Phases à exécuter

| # | Statut cible cette nuit | Notes |
|---|-------------------------|-------|
| 0 | ✅ À faire | DB Docker up + migrations + seed + scaffold Vite |
| 1 | ✅ À faire | Auth + sélection monde, pas de canvas |
| 2 | ✅ À faire | WebSocket + stores Zustand + interpolation |
| 3 | ✅ À faire | HUD village complet (sans canvas) |
| 4 | ✅ À faire | WorldMap PixiJS avec viewport (placeholders graphiques) |
| 5 | ✅ À faire | VillageScene PixiJS top-down + viewport (placeholders) |
| 6 | ✅ À faire | Animations expéditions + particules `@pixi/particle-emitter` |
| 7 | 🟡 À faire SAUF la suppression du legacy | Archive en branche `legacy/nextjs-frontend` mais **garde** le dossier `battleforthecrown/` dans le working tree pour validation user au matin |
| 8 | ✅ À faire | Consolidation documentaire (CLAUDE.md hiérarchique) |

L'utilisateur a explicitement demandé : **« faisons toutes les phases, le but est d'avoir une bonne base pour demain. On itérera ensemble ensuite. »**

→ Va aussi loin que tu peux, mais **qualité > quantité**. Une Phase 4 bâclée vaut moins qu'une Phase 4 solide même si on s'arrête là.

## Assets à utiliser (placeholders pour Phase 4-5)

Dossiers fournis par le user (read-only, hors repo) :

- `/Users/kelvindupont/Documents/Kelvin/games/StrategyGameIcons/Spritesheets/spritesheet.png` + `spritesheet.json`
  - Format compatible Pixi `Assets.load` (TexturePacker JSON Hash).
  - 86 icônes 128×128 : `WoodLogs`, `Stone`, `Bricks`, `GoldCoin`, `Wheat`, `Cow`, `Sheep`, `HorseHead`, `Barrel`, `Cloth`, etc.
  - **Usage prévu** : icônes ressources HUD, icônes commerce (futur), animaux (décoration village).

- `/Users/kelvindupont/Documents/Kelvin/games/Icon Pack - Casual Game 300/256x256/`
  - PNG individuels 256×256.
  - Sélection utile : `ICON_Crown.png` (couronne premium), `ICON_Coin.png` (gold), `ICON_Card_Gold.png` (boutons), `ICON_Bell_Gold.png` (notifications).

**Convention de copie d'assets** :

```bash
# Au début de Phase 4 ou Phase 5, copier ce dont tu as besoin :
mkdir -p battleforthecrown-pixi/public/assets/strategy-icons
cp "/Users/kelvindupont/Documents/Kelvin/games/StrategyGameIcons/Spritesheets/spritesheet.png" \
   battleforthecrown-pixi/public/assets/strategy-icons/
cp "/Users/kelvindupont/Documents/Kelvin/games/StrategyGameIcons/Spritesheets/spritesheet.json" \
   battleforthecrown-pixi/public/assets/strategy-icons/

mkdir -p battleforthecrown-pixi/public/assets/ui
cp "/Users/kelvindupont/Documents/Kelvin/games/Icon Pack - Casual Game 300/256x256/ICON_Crown.png" \
   battleforthecrown-pixi/public/assets/ui/crown.png
# etc.
```

**Ce qui manque** : sprites de bâtiments, villages, unités, tuiles de carte. Pour Phase 4-5-6, **utiliser des `Graphics` Pixi colorées + labels texte** comme placeholders. Documenter dans le CHANGELOG la liste exacte des assets manquants à produire / acheter post-migration.

## Workflow d'une itération typique

1. **Récupère le statut** : lire `docs/migration/CHANGELOG.md` (dernière entrée), faire `git status` + `git log -5 --oneline`.
2. **Identifie la phase courante** : regarde la table dans `README.md` migration.
3. **Plan** : entre en plan mode (sauf Phase 0 où c'est trivial), produis un plan détaillé, valide-le toi-même, exécute.
4. **Exécute** :
   - Pour chaque tâche : TodoWrite la tâche, exécute, marque complete.
   - Tests/lint/type-check au fur et à mesure.
5. **Vérifie la Definition of Done** :
   - Coche un par un les critères de DoD.
   - Si un test manuel est requis (UI dans le navigateur) : décris ce qui devrait apparaître à l'écran. **Tu n'as pas accès au navigateur** → la vérification UI sera faite par le user au matin. Documente dans le CHANGELOG ce que tu attendrais en visuel.
6. **Commit** : un seul commit par phase (ou max 2-3 si vraiment gros).
7. **CHANGELOG** : ajoute une entrée complète avec le template.
8. **README index** : mets à jour la table de statut.
9. **ScheduleWakeup** pour la phase suivante (delaySeconds court si on enchaîne, long si on attend quelque chose).

## Détails utiles

### Backend qui doit tourner

Le backend doit tourner pour valider Phase 1+ (login → DB).

Au début de Phase 0.A, après le bootstrap DB :

```bash
PORT=15001 yarn workspace battleforthecrown-backend start:dev
```

Lance-le **en background** (Bash `run_in_background: true`) — ne bloque pas la boucle. Stocke le PID, surveille les logs occasionnellement.

Sanity check à intervalle régulier : `curl -fsS http://localhost:15001/health`. S'il répond pas, relance.

### CORS

Le backend a déjà `CORS_ORIGINS=http://localhost:3000,http://localhost:5173` dans `.env`. **Ne touche pas** — Vite tourne sur 5173 par défaut, donc c'est aligné.

### Variables d'env nouveau frontend

Crée `battleforthecrown-pixi/.env.local` :

```
VITE_API_BASE_URL=http://localhost:15001
VITE_WS_URL=http://localhost:15001
```

### Tester un login en SQL après Phase 1

```bash
docker exec battleforthecrown-postgres \
  psql -U postgres -d battleforthecrown \
  -c 'SELECT id, email, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 5;'
```

### Conventions de code

- **Types stricts** (pas de `any`).
- **No emojis** dans le code (sauf request explicite user).
- **No comments** sauf invariants non-obvious. WHY, pas WHAT.
- **Tests Vitest** pour la logique métier non triviale (pas pour les composants triviaux).

### Commits — exemples

```
feat(pixi-frontend): scaffold Vite + React 19 + Pixi v8

chore(db): bootstrap Postgres via docker compose, run prisma migrations

feat(pixi-frontend/auth): implement login + register flows with TanStack Query

feat(pixi-frontend/ws): connect socket.io and pipe events to Zustand stores

feat(pixi-frontend/village): port HUD panels (no canvas yet)

feat(pixi/world-map): WorldMapScene with pixi-viewport and entity reconciliation

feat(pixi/village): VillageScene top-down with viewport zoom/pan (mobile portrait)

feat(pixi/effects): expedition path animations + dust particles

chore(legacy): archive battleforthecrown to branch legacy/nextjs-frontend

docs(migration): consolidate CLAUDE.md hierarchy and rules
```

## Garde-fous techniques additionnels

### Avant chaque commande destructive

Réfléchis : **ce que je vais faire est-il réversible ?**
- ✅ `rm fichier-temporaire` → OK
- ⚠️ `rm -rf` sur un dossier généré (`node_modules`, `dist`, `.next`) → OK
- ❌ `rm -rf src/` → STOP
- ❌ `git rm -r battleforthecrown/` → STOP avant Phase 7

### Quand tu doutes

Inscris la décision dans le CHANGELOG sous « Décision en cours de run », fais le choix le plus conservateur (celui qui te laisse le plus d'options ouvertes pour le matin), et continue.

### Limite contexte

Si tu sens que ton contexte se charge (>200k tokens accumulés), **commits plus souvent** et **résume davantage** dans le CHANGELOG plutôt que de garder de longues citations. Le CHANGELOG = mémoire externe.

## En sortie : ce que doit voir l'utilisateur au matin

1. `git log --oneline` montre une suite de commits propres, un par phase.
2. `docs/migration/CHANGELOG.md` documente chaque phase (statut, écart, blockers).
3. `docs/migration/README.md` table de statut à jour.
4. Le backend est down (tu l'as arrêté à la fin) ou up et stable. **Le mentionner dans la dernière entrée CHANGELOG.**
5. La DB Docker est up (ne pas l'arrêter — l'utilisateur peut vouloir la consulter au matin).
6. Aucune commande `git push`, aucun `--force`.
7. Le legacy `battleforthecrown/` existe TOUJOURS dans le working tree (l'utilisateur valide la suppression).

## Dernier rappel

> **Qualité > quantité.** Si tu arrives à une Phase 4 propre et que tu n'as plus l'énergie pour la 5, c'est OK. L'utilisateur préfère 4 phases solides à 8 phases bâclées. Documente où tu t'es arrêté, pourquoi, et ce qu'il reste à faire.

Bonne nuit, et bon courage. 🌙
