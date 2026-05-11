---
name: bftc-db
description: Utiliser pour toute opération SQL BFTC locale: lecture/écriture DB, schéma, joueurs, villages, Outbox, combats, jobs.
---

# bftc-db — Accès DB Battle for the Crown

> **Skill métier** : connaît la cartographie tables ↔ concepts gameplay. Délègue l'exécution SQL au skill technique `postgresql-cli`.

> **Garde-fous écriture** : pas de `prisma migrate reset` (interdit projet). Pour toute modif destructive (UPDATE/DELETE sur données existantes), snapshot la valeur avant — ne jamais réutiliser un seed pour restaurer.

## Connexion

DB enregistrée sous le nom `BFTC_DB_LOCAL` dans `postgresql-cli`, et `BFTC_DB_LOCAL` est exportée par `~/.zshrc` (chargée automatiquement dans les sessions Bash de Claude Code). Aucun `export` manuel à faire :

```bash
postgresql-cli database query BFTC_DB_LOCAL "<sql>" --json
```

Si l'env var manque (`Environment variable "BFTC_DB_LOCAL" is not set`) : ajouter dans `~/.zshrc` (puis recharger la session) :

```bash
export BFTC_DB_LOCAL="postgresql://postgres:postgres@localhost:5432/battleforthecrown"
```

Et si la DB n'est pas (re)connue de `postgresql-cli` :

```bash
postgresql-cli database add BFTC_DB_LOCAL BFTC_DB_LOCAL   # 2e arg = nom de l'env var
```

Si la DB ne répond pas : `docker ps --filter name=battleforthecrown-postgres` doit retourner `healthy`. Sinon `docker compose up -d` depuis `battleforthecrown-backend/`.

## Pièges SQL critiques

- **Tables en `lower_snake_case`** (Prisma `@@map`). PAS de `"User"` / `"Village"` quoté PascalCase — c'est `user` / `village`. Le `db-setup.md` dans `docs/architecture/` est sur ce point désynchronisé.
- **Colonnes en `snake_case`** : `created_at`, `user_id`, `world_id`, `last_update_ts`, `dispatched_at`, etc.
- **`user` est un mot réservé SQL** → toujours le quoter : `FROM "user"`. Aucune autre table ne nécessite de quotes.
- **Quoting Bash** : si le SQL contient des apostrophes (`'EN_ROUTE'`), utiliser `$'...'` avec échappement :
  ```bash
  SQL=$'SELECT * FROM expedition WHERE status = \'EN_ROUTE\''
  postgresql-cli database query BFTC_DB_LOCAL "$SQL" --json
  ```
- **Toujours `LIMIT`** sur tables potentiellement larges (`event_outbox`, `world_entity`, `combat_report`, `chunk_spawn_state`).

## Cartographie tables ↔ gameplay

| Concept | Table | Notes |
|---|---|---|
| Compte joueur | `"user"` | id, email, password (bcrypt), created_at |
| Session refresh | `session` | refresh_token_hash + expires_at |
| Monde | `world` | id, name, status (`PLANNED/OPEN/LOCKED/ENDED`), config JSON, started_at, ends_at |
| Adhésion à un monde | `world_membership` | (user_id, world_id) PK, role, last_login_at |
| Village joueur ou barbare | `village` | is_barbarian, tier, x/y unique par world. `user_id` NULL ⇒ barbare |
| Bâtiments | `building` | type (CASTLE/FARM/WOOD/STONE/IRON/...), level, start_time/end_time = chantier en cours |
| Stocks ressources | `resource_stock` | wood/stone/iron + max_per_type, last_update_ts (snapshot, le front interpole) |
| Population | `population` | used / max |
| Inventaire troupes | `unit_inventory` | (village_id, unit_type) PK, quantity |
| File d'entraînement | `unit_training` | total_qty, completed_qty, next_unit_eta_ts |
| Couronnes (premium) | `crown_balance` | (user_id, world_id) PK, balance, last_update_ts |
| Stratégie village | `village_strategy_config` | FORTRESS/RAIDERS/ECONOMIC/BALANCED, cooldown |
| Entités carte | `world_entity` | kind, x/y, data JSON. Volumineux — toujours filtrer par `world_id` + `kind` |
| Seed barbares | `chunk_spawn_state`, `world_seed_state`, `zone_capacity` | pour debug seeding/repop |
| Expéditions | `expedition` | status (`EN_ROUTE/RESOLVED/RETURNING`), depart_at/arrival_at/return_at, units JSON |
| Rapports combat | `combat_report` | loot, losses_attacker/defender JSON, is_read, timestamp |
| **Outbox events** | `event_outbox` | kind, payload JSON, dispatched_at NULL = pas encore émis WS |
| pg-boss jobs | `pgboss.job` / `pgboss.archive` | schéma séparé `pgboss`. state `created/active/completed/failed` |

## Recettes fréquentes

### Identifier un joueur et son contexte

```sql
-- Par email
SELECT id, email, created_at FROM "user" WHERE email = '<email>';

-- Mondes auxquels il participe
SELECT wm.world_id, w.name, w.status, wm.role, wm.last_login_at
FROM world_membership wm JOIN world w ON w.id = wm.world_id
WHERE wm.user_id = '<user_id>';

-- Tous ses villages avec ressources & population
SELECT v.id, v.name, v.x, v.y, v.tier,
       rs.wood, rs.stone, rs.iron, rs.max_per_type,
       p.used, p.max
FROM village v
LEFT JOIN resource_stock rs ON rs.village_id = v.id
LEFT JOIN population p ON p.village_id = v.id
WHERE v.user_id = '<user_id>';
```

### Inspecter un village

```sql
-- Bâtiments + chantier en cours
SELECT type, level, start_time, end_time
FROM building WHERE village_id = '<village_id>' ORDER BY type;

-- Troupes + entraînements
SELECT unit_type, quantity FROM unit_inventory WHERE village_id = '<village_id>';
SELECT unit_type, total_qty, completed_qty, next_unit_eta_ts
FROM unit_training WHERE village_id = '<village_id>';
```

### Outbox & temps réel

```sql
-- Backlog : events non dispatchés (anomalie si > 0 et croissant)
SELECT count(*) FROM event_outbox WHERE dispatched_at IS NULL;

-- Derniers events sortis
SELECT id, kind, aggregate_id, created_at, dispatched_at
FROM event_outbox ORDER BY created_at DESC LIMIT 20;

-- Events d'un agrégat précis (village_id, expedition_id, ...)
SELECT kind, payload, created_at
FROM event_outbox WHERE aggregate_id = '<id>'
ORDER BY created_at DESC LIMIT 50;
```

### Expéditions et combats

```sql
-- Expéditions actives
SELECT id, status, attacker_village_id, target_kind, target_x, target_y,
       arrival_at, return_at
FROM expedition
WHERE status IN ('EN_ROUTE', 'RETURNING')
ORDER BY arrival_at;

-- Derniers rapports d'un joueur
SELECT id, target_kind, target_x, target_y, loot, timestamp, is_read
FROM combat_report
WHERE attacker_user_id = '<user_id>' OR defender_user_id = '<user_id>'
ORDER BY timestamp DESC LIMIT 10;
```

### pg-boss (workers)

```sql
-- Jobs en attente / actifs / failed
SELECT name, state, retrycount, startafter, createdon
FROM pgboss.job
WHERE state IN ('created','active','retry','failed')
ORDER BY createdon DESC LIMIT 30;

-- Jobs failed récents (archive)
SELECT name, state, output, completedon
FROM pgboss.archive WHERE state = 'failed'
ORDER BY completedon DESC LIMIT 20;
```

## Inspection de schéma à la volée

Pour redécouvrir tables / colonnes / FK sans relire ce skill :

```bash
postgresql-cli database tables BFTC_DB_LOCAL --json
postgresql-cli database describe BFTC_DB_LOCAL village --json
postgresql-cli database schema BFTC_DB_LOCAL --json   # lourd, préfère describe
```

Source de vérité applicative : `battleforthecrown-backend/prisma/schema.prisma`.

## Workflow type pour une analyse

1. Le user décrit ce qu'il observe en jeu (ex : « je n'ai pas reçu mon event de fin d'upgrade »).
2. Identifier l'utilisateur (email → id), le village concerné (user_id, x/y).
3. Vérifier l'état métier (ex : `building.end_time`, `event_outbox.dispatched_at`).
4. Si écart d'état → corréler avec `pgboss.job` / `pgboss.archive`.
5. Reporter les findings de façon factuelle (ids, timestamps, payload) — pas de spéculation tant que la DB n'a pas confirmé.

## Sortie

`postgresql-cli` retourne :

```json
{ "ok": true, "data": [...], "meta": { "total": N } }
```

En cas d'erreur, lire `error.message` + `error.suggestion`. Si `Environment variable "BFTC_DB_LOCAL" is not set` → la session Bash n'a pas chargé `~/.zshrc` ; voir la section Connexion pour réenregistrer la DB / vérifier l'export.
