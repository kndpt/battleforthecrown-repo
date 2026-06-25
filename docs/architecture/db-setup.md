# DB setup — Postgres + Prisma

> Commandes pour bootstrap, debug et reset de la base Postgres du backend.

## Stack

- **Postgres 16-alpine** dans Docker (`battleforthecrown-postgres`).
- **Prisma 6.17** comme ORM (migrations dans `battleforthecrown-backend/prisma/migrations/`).
- **pg-boss** utilise un schéma séparé `pgboss` (créé automatiquement par le backend au démarrage).
- Connexion : `postgresql://postgres:postgres@localhost:5432/battleforthecrown` (cf. `battleforthecrown-backend/.env`).

## Bootstrap from scratch

```bash
# 1. Démarrer Postgres dans Docker
cd battleforthecrown-backend
docker compose up -d

# 2. Vérifier que c'est healthy
docker compose ps
# → STATUS doit afficher "healthy"

# 3. Appliquer les migrations Prisma
yarn workspace battleforthecrown-backend prisma migrate deploy

# 4. Générer le client Prisma (si pas déjà fait)
yarn workspace battleforthecrown-backend prisma generate

# 5. Seed la config par défaut du monde
docker exec -i battleforthecrown-postgres \
  psql -U postgres -d battleforthecrown \
  < battleforthecrown-backend/prisma/seed-default-world-config.sql

# 6. Sanity check : lister les tables
docker exec battleforthecrown-postgres \
  psql -U postgres -d battleforthecrown -c '\dt'
```

Tables attendues (extrait) : `User`, `World`, `Village`, `Building`, `ResourceStock`, `Population`, `UnitInventory`, `UnitTraining`, `WorldSeedState`, `ChunkSpawnState`, `EventOutbox`, `WorldMembership`, `ZoneCapacity`, `CrownBalance`, `Expedition`, `CombatReport`, `ScoutReport`, `VillageStrategyConfig`.

## Lancer le backend après le bootstrap

```bash
PORT=15001 yarn workspace battleforthecrown-backend start:dev
# → backend log "Nest application successfully started" sur :15001
# → CORS pré-configurés pour http://localhost:5173 (Vite)
```

`start:dev` vérifie d'abord `prisma migrate status`. Si des migrations sont pending, le backend ne démarre pas et affiche la commande `prisma migrate deploy` à lancer.

Sanity HTTP : `curl http://localhost:15001/health` → 200.

## DB smoke (`battleforthecrown_smoke` + clones par worker)

Stratégie : un **template** migré (`battleforthecrown_smoke`) sert de modèle Postgres ; le préflight crée N **clones** (`battleforthecrown_smoke_w1` … `_wN`) via `CREATE DATABASE … TEMPLATE`. Chaque Jest worker se connecte à son propre clone → vraie isolation, parallélisme `maxWorkers: 10`.

```bash
# 1. Créer la base template (une fois)
docker exec battleforthecrown-postgres \
  psql -U postgres -c 'CREATE DATABASE battleforthecrown_smoke;'

# 2. Appliquer les migrations Prisma au template
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke" \
  yarn workspace battleforthecrown-backend prisma migrate deploy

# 3. Lancer la suite smoke (le préflight (re)crée les 10 clones depuis le template)
yarn workspace battleforthecrown-backend test:smoke
```

À chaque évolution du schéma Prisma, rejouer `prisma migrate deploy` sur le **template**. Le préflight clone le template à chaque run, donc les clones sont toujours à jour. Pas de seed manuel : chaque smoke insère son propre `World` (cf. `test/fixtures/smoke-world-config.ts`).

Le container Postgres doit autoriser ≥ 300 connections (10 workers × Nest + pg-boss ≈ 250) — configuré dans `docker-compose.yml` via `command: postgres -c max_connections=300`. Recréer le container après changement (`docker compose up -d --force-recreate postgres`).

Le préflight (`scripts/smoke-preflight.sh`) détecte automatiquement le backend Postgres : container Docker `battleforthecrown-postgres` (dev local) ou serveur Postgres natif sur `localhost:5432` (env Claude Code web, sans daemon Docker). Aucune commande à changer.

Overrides :
- `SMOKE_DATABASE_URL` : bypass complet, force une URL spécifique (debug d'un test précis).
- `SMOKE_TEMPLATE_DB` : change le nom du template (défaut `battleforthecrown_smoke`).
- `SMOKE_WORKERS` : change le nombre de clones générés par le préflight (défaut `10`).
- `SMOKE_PG_CONTAINER` : change le nom du container Docker ciblé (défaut `battleforthecrown-postgres`).

### Latence worker compressée (levier dominant)

La plupart du wall-clock smoke n'est pas du CPU mais de l'**attente de jobs pg-boss enchaînés** (training → unité suivante, combat → retour, …) : chaque reprise coûte un cycle de poll (défaut pg-boss 2 s). `jest-smoke-setup.ts` injecte deux env *gated test-only* (prod/dev les laissent unset → cadence normale) :

- `PGBOSS_WORKER_POLL_MS=500` — poll des job workers ramené au plancher pg-boss (500 ms) au lieu de 2 s. Appliqué centralement dans `src/infra/pg-boss/queue-worker.helper.ts` (`withPollOverride`).
- `OUTBOX_POLL_INTERVAL=250` — dispatcher Outbox 4× plus rapide.

C'est ce qui a fait passer la suite de ~46 s à ~16 s (−65 %), avant même tout split de fichier. Toucher ces valeurs avant de multiplier les workers : c'est le levier le moins coûteux en complexité.

### Scaler quand la suite grossit

Plancher incompressible = durée du **plus long fichier smoke** (aujourd'hui `army-training-queue` ~12 s). Tout le reste se parallélise. Quand la suite dépasse à nouveau le seuil de douleur (~3-5 min), tirer ces leviers dans cet ordre (le levier 0 — compresser la latence worker, cf. § ci-dessus — est déjà appliqué et reste le moins coûteux) :

1. **Splitter le fichier le plus long.** Si un smoke pèse plus que la moyenne × 3, le découper par sous-domaine — c'est lui qui dicte le temps total, pas le nombre de fichiers. `army-training` (44 s avant tuning poll) a été coupé en `army-training` + `army-training-queue` ; au-delà d'un 2ᵉ split l'overhead de boot Nest par fichier annule le gain de parallélisme (mesuré).
2. **Monter `maxWorkers` et `SMOKE_WORKERS` en miroir.** Plafond utile = nombre de cores physiques (au-delà, contention CPU & I/O annule le gain). Sur Mac M-series courants : 8-10. Sur CI cloud : matcher au runner. Les deux variables doivent **rester égales** sinon des workers cherchent une DB qui n'existe pas.
3. **Bumper `max_connections` Postgres.** Si un run échoue avec `sorry, too many clients already`, augmenter dans `docker-compose.yml` (`postgres -c max_connections=…`). Règle de pouce : `maxWorkers × 25` (Prisma pool ~17 + pg-boss ~10 par app Nest).
4. **Réduire le pool Prisma par worker.** Si bumper `max_connections` est cher (CI), forcer un pool plus petit en ajoutant `?connection_limit=5` dans le `DATABASE_URL` construit par `jest-smoke-setup.ts`. Conservateur mais robuste.
5. **Bumper le temps imparti à `boss.stop`.** Si le pg-boss du worker n'a pas le temps de finir ses jobs en `afterAll`, on voit des warnings `Boss.#monitor` et des flakies de timing. Passer le `timeout` de `bootSmokeApp.close` (helpers.ts) de 1 s à 5-10 s. Lent mais propre.
6. **Dernier recours : Testcontainers (1 docker par spec).** Vrai isolement matériel (extensions Postgres custom, version pinnée par spec, etc.). Coût : ~3-5 s d'overhead init par container, complexité docker compose dans la CI. À envisager seulement si un cas concret le justifie (tests qui touchent `ALTER SYSTEM`, extensions, ou versions Postgres différentes).

Signaux pour décider :

| Symptôme | Action |
|---|---|
| Suite > 3 min, ratio plus-long/moyenne > 3 | (1) split fichier |
| Suite > 3 min, fichiers équilibrés, cores libres | (2) monter `maxWorkers` |
| `sorry, too many clients already` | (3) bump `max_connections` |
| Flakies sous charge concurrente (`waitFor timed out`) | (4) réduire pool ou (5) bumper `boss.stop` timeout |
| Besoin d'isoler version/extensions Postgres par spec | (6) Testcontainers |

Ne pas anticiper : appliquer le levier minimum qui résout le symptôme observé. Chaque levier ajoute un peu de complexité (variables d'env, doc, comportement runtime).

## Snippets SQL utiles (debug)

> Préfixe à utiliser dans toutes les commandes :
> ```bash
> docker exec battleforthecrown-postgres psql -U postgres -d battleforthecrown -c "..."
> ```
> Ou ouvrir un shell SQL interactif :
> ```bash
> docker exec -it battleforthecrown-postgres psql -U postgres -d battleforthecrown
> ```

### Vérifier les utilisateurs et mondes

```sql
SELECT id, email, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 10;

SELECT id, name, status, "gridWidth", "gridHeight" FROM "World";

SELECT * FROM "WorldMembership" WHERE "userId" = '<user-id>';
```

### Inspecter un village

```sql
-- Position et propriétaire
SELECT id, "userId", x, y, "isBarbarian", tier, "worldId"
FROM "Village" WHERE id = '<village-id>';

-- Bâtiments
SELECT type, level, "startTime", "endTime"
FROM "Building" WHERE "villageId" = '<village-id>'
ORDER BY type;

-- Ressources
SELECT wood, stone, iron, "maxPerType", "lastUpdateTs"
FROM "ResourceStock" WHERE "villageId" = '<village-id>';

-- Population
SELECT used, max FROM "Population" WHERE "villageId" = '<village-id>';

-- Inventaire troupes
SELECT "unitType", quantity FROM "UnitInventory" WHERE "villageId" = '<village-id>';
```

### Inspecter le système d'événements (Outbox)

```sql
-- Events non encore dispatchés (devrait être ~vide en régime stable)
SELECT id, kind, "aggregateId", "createdAt"
FROM "EventOutbox"
WHERE "dispatchedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 20;

-- Backlog : events plus vieux que 5 secondes encore non dispatchés (anomalie)
SELECT count(*) FROM "EventOutbox"
WHERE "dispatchedAt" IS NULL
  AND "createdAt" < now() - interval '5 seconds';
```

### Inspecter les expéditions et combats

```sql
SELECT id, status, "villageId", "targetX", "targetY", "arrivalAt", "returnAt"
FROM "Expedition"
WHERE status IN ('EN_ROUTE', 'RETURNING')
ORDER BY "arrivalAt";

SELECT id, "isVictory", loot, "createdAt", "isRead"
FROM "CombatReport"
WHERE "userId" = '<user-id>'
ORDER BY "createdAt" DESC LIMIT 10;
```

### Inspecter les jobs pg-boss

pg-boss vit dans un schéma à part :

```sql
\dn  -- liste les schémas, doit voir "pgboss"

-- Jobs en attente
SELECT name, state, "startAfter", retrycount
FROM pgboss.job
WHERE state IN ('created', 'retry', 'active')
ORDER BY "createdOn" DESC LIMIT 30;

-- Jobs en erreur
SELECT name, state, output, "completedOn"
FROM pgboss.archive
WHERE state = 'failed'
ORDER BY "completedOn" DESC LIMIT 20;
```

### Crowns (monnaie premium)

```sql
SELECT "userId", "worldId", balance, "lastUpdateTs"
FROM "CrownBalance"
WHERE "userId" = '<user-id>';
```

## Garbage collection des DBs éphémères

Les runs smokes et agents créent des DBs `battleforthecrown_*` (clones smoke `_w1…_wN`, hashes, runs). Sans nettoyage, elles s'accumulent dans Postgres.

Un GC local tourne **toutes les heures** via launchd et drop les DBs éphémères dont :
- le nom matche `battleforthecrown_*` (la DB canonique `battleforthecrown` est protégée par nom),
- le répertoire `base/<oid>` n'a pas été modifié depuis ≥ 24 h (proxy d'inactivité — WAL/checkpoints touchent le dossier en continu sur une DB active),
- aucune connexion active dans `pg_stat_activity`.

**Script** : [`battleforthecrown-backend/scripts/db-gc.sh`](../../battleforthecrown-backend/scripts/db-gc.sh).
**Schedule** : `~/Library/LaunchAgents/com.bftc.db-gc.plist` (`StartInterval=3600`, `RunAtLoad=true`).
**Logs** : `/tmp/bftc-db-gc.log`.

```bash
# Run manuel (threshold par défaut = 24 h)
battleforthecrown-backend/scripts/db-gc.sh

# Forcer un threshold différent (debug / cleanup ponctuel)
BFTC_DB_GC_HOURS=0 battleforthecrown-backend/scripts/db-gc.sh

# Re/charger l'agent launchd
launchctl unload ~/Library/LaunchAgents/com.bftc.db-gc.plist
launchctl load ~/Library/LaunchAgents/com.bftc.db-gc.plist
```

## Reset complet (nuclear)

> ⚠️ **Détruit toutes les données.** Confirmer avec le user avant.

```bash
# Tuer le backend d'abord (sinon connexions ouvertes)
# Puis :
cd battleforthecrown-backend
docker compose down -v   # -v = supprime aussi le volume
docker compose up -d
yarn workspace battleforthecrown-backend prisma migrate deploy
docker exec -i battleforthecrown-postgres \
  psql -U postgres -d battleforthecrown \
  < battleforthecrown-backend/prisma/seed-default-world-config.sql
```

## Reset partiel (garde le schéma, vide les données)

> Plus rapide qu'un nuclear, utile pour repartir sur un état joueur clean.

```sql
TRUNCATE TABLE
  "Expedition", "CombatReport", "ScoutReport",
  "UnitTraining", "UnitInventory",
  "Building", "Population", "ResourceStock",
  "Village",
  "VillageStrategyConfig",
  "EventOutbox",
  "ZoneCapacity", "ChunkSpawnState", "WorldSeedState",
  "CrownBalance",
  "WorldMembership", "World",
  "Session", "User"
RESTART IDENTITY CASCADE;

-- Re-seed la config monde par défaut après TRUNCATE
\i /tmp/seed-default-world-config.sql
-- (copier le fichier dans le container avant : docker cp ...)
```

## Inspecter le schéma actuel

```bash
# Liste de tous les modèles avec leurs colonnes
docker exec battleforthecrown-postgres \
  psql -U postgres -d battleforthecrown \
  -c '\d+ "Village"'   # remplacer Village par n'importe quelle table

# Source canonique : battleforthecrown-backend/prisma/schema.prisma
```

## Connexion depuis un client SQL externe

Pour DBeaver / TablePlus / DataGrip :

| Champ | Valeur |
|-------|--------|
| Host | `localhost` |
| Port | `5432` |
| Database | `battleforthecrown` |
| User | `postgres` |
| Password | `postgres` |

## Troubleshooting

| Symptôme | Cause probable | Fix |
|----------|----------------|-----|
| `prisma migrate deploy` plante avec « migration already applied » | DB partiellement bootstrapée | `docker compose down -v` puis recommencer |
| Backend crashe avec `P1001 Can't reach database` | Container down ou pas encore healthy | `docker compose ps`, attendre `healthy` |
| `start:dev` stoppe avec `[dev-migration-check] Database migrations are not ready` | Migrations Prisma pending sur la DB dev | `yarn workspace battleforthecrown-backend prisma migrate deploy` |
| Backend crashe avec `Schema "pgboss" does not exist` | Premier démarrage, pg-boss pas encore initialisé | Attendre 2-3s, le backend crée le schéma au boot |
| Aucun event WS reçu après upgrade | OutboxWorker bloqué, ou EventOutbox.dispatchedAt resté null | `SELECT count(*) FROM "EventOutbox" WHERE "dispatchedAt" IS NULL` — si > 0 et croissant, restart le backend |
| Port 5432 déjà utilisé | Une autre instance Postgres tourne en local | `lsof -i :5432`, kill l'autre, ou changer le port dans `docker-compose.yml` ET dans `.env` |
