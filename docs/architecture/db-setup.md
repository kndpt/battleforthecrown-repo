# DB setup — Postgres + Prisma

> Commandes pour bootstrap, debug et reset de la base Postgres du backend.

## Stack

- **Postgres 16-alpine** dans Docker (`battleforthecrown-postgres`).
- **Prisma 6.17** comme ORM (14 migrations dans `battleforthecrown-backend/prisma/migrations/`).
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

Tables attendues (extrait) : `User`, `World`, `Village`, `Building`, `ResourceStock`, `Population`, `UnitInventory`, `UnitTraining`, `WorldEntity`, `WorldSeedState`, `ChunkSpawnState`, `EventOutbox`, `PowerSnapshot`, `WorldMembership`, `ZoneCapacity`, `CrownBalance`, `Expedition`, `CombatReport`, `VillageStrategyConfig`.

## Lancer le backend après le bootstrap

```bash
PORT=15001 yarn workspace battleforthecrown-backend start:dev
# → backend log "Nest application successfully started" sur :15001
# → CORS pré-configurés pour http://localhost:5173 (Vite)
```

Sanity HTTP : `curl http://localhost:15001/health` → 200.

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
  "Expedition", "CombatReport",
  "UnitTraining", "UnitInventory",
  "Building", "Population", "ResourceStock",
  "Village",
  "VillageStrategyConfig",
  "EventOutbox", "PowerSnapshot",
  "ZoneCapacity", "ChunkSpawnState", "WorldSeedState",
  "WorldEntity",
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
| Backend crashe avec `Schema "pgboss" does not exist` | Premier démarrage, pg-boss pas encore initialisé | Attendre 2-3s, le backend crée le schéma au boot |
| Aucun event WS reçu après upgrade | OutboxWorker bloqué, ou EventOutbox.dispatchedAt resté null | `SELECT count(*) FROM "EventOutbox" WHERE "dispatchedAt" IS NULL` — si > 0 et croissant, restart le backend |
| Port 5432 déjà utilisé | Une autre instance Postgres tourne en local | `lsof -i :5432`, kill l'autre, ou changer le port dans `docker-compose.yml` ET dans `.env` |
