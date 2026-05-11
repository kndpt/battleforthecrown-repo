# 44 — Crash armée : migration `unit_training.building` non appliquée

**Sévérité** : 🔴 Bloquant local (écran Armée en 500)
**Statut** : 🟡 À traiter
**Déclencheur** : navigation frontend vers `/game/army`

## Symptôme

En ouvrant `http://localhost:5173/game/army`, le backend retourne des 500 sur :

- `GET /army/:villageId/training`
- `GET /army/:villageId/inventory`

Erreur Prisma :

```txt
P2022: The column `unit_training.building` does not exist in the current database.
```

## Root cause prouvée

Le code backend et le Prisma Client attendent désormais un discriminant `UnitTraining.building`, mais la base locale `battleforthecrown` n'a pas appliqué les migrations qui ajoutent cette colonne.

Preuves :

- `battleforthecrown-backend/prisma/schema.prisma:208` — `model UnitTraining`.
- `battleforthecrown-backend/prisma/schema.prisma:211` — `building TrainingBuilding @default(BARRACKS)`.
- `battleforthecrown-backend/prisma/schema.prisma:222` — contrainte `@@unique([villageId, building])`.
- `battleforthecrown-backend/src/modules/army/army.service.ts:21` — `getInventory` inclut `unitTraining`, donc Prisma sélectionne toutes les colonnes scalaires attendues par le modèle.
- `battleforthecrown-backend/src/modules/army/army.service.ts:37` — le service lit `training.building === 'BARRACKS'`.
- `battleforthecrown-backend/src/modules/army/army.service.ts:77` — `getTraining` appelle directement `unitTraining.findMany`.

`prisma migrate status` sur la DB locale indique 3 migrations pending :

```txt
Following migrations have not yet been applied:
20260511120000_add_training_building
20260511140000_add_training_building_unique
20260511150000_add_pending_conquest
```

La migration responsable du champ manquant existe déjà :

```sql
CREATE TYPE "TrainingBuilding" AS ENUM ('BARRACKS', 'THRONE_HALL');

ALTER TABLE "unit_training"
  ADD COLUMN "building" "TrainingBuilding" NOT NULL DEFAULT 'BARRACKS';
```

La migration suivante ajoute l'unicité par bâtiment :

```sql
CREATE UNIQUE INDEX "unit_training_village_id_building_key"
  ON "unit_training"("village_id", "building");
```

## Pourquoi `getInventory` crashe aussi

Même si le log pointe parfois `village.findUnique`, l'échec vient de l'`include: { unitTraining: true }`. Prisma charge les trainings associés au village avec les colonnes scalaires du modèle actuel, dont `unit_training.building`. Comme la colonne est absente en DB, la requête parent échoue aussi.

## Pistes

### A — Correction immédiate locale

Appliquer les migrations pending non destructives :

```bash
yarn workspace battleforthecrown-backend prisma migrate deploy
```

Inspection du lot pending au moment de l'analyse :

- `20260511120000_add_training_building` : `CREATE TYPE`, `ADD COLUMN ... DEFAULT`.
- `20260511140000_add_training_building_unique` : `CREATE UNIQUE INDEX`.
- `20260511150000_add_pending_conquest` : `CREATE TYPE`, `CREATE TABLE`, index, foreign keys.
- Aucun `DROP`, `TRUNCATE`, `DELETE`, ni `ALTER ... DROP` détecté dans ces migrations.

### B — Garde-fou dev server

Ajouter un check de démarrage local ou de script dev qui échoue clairement si `prisma migrate status` détecte des migrations pending. Objectif : éviter un backend "Started successfully" mais fonctionnellement cassé dès qu'une route touche une colonne attendue par le Prisma Client.

### C — Filet de régression

Ajouter un smoke minimal sur `/army/:villageId/inventory` et `/army/:villageId/training` après migrations, ou vérifier que le smoke existant couvre bien ces deux endpoints avec une vraie DB migrée.

## Critères d'acceptation

- `yarn workspace battleforthecrown-backend prisma migrate status` ne liste plus de migrations pending sur la DB de dev.
- `GET /army/:villageId/inventory` retourne 200.
- `GET /army/:villageId/training` retourne 200.
- L'écran `http://localhost:5173/game/army` ne déclenche plus de `P2022`.
- Un garde-fou empêche de relancer le backend en watch contre une DB non migrée sans message explicite.

## Commandes de vérification attendues

```bash
yarn workspace battleforthecrown-backend prisma migrate status
yarn workspace battleforthecrown-backend prisma migrate deploy
yarn static-check
```

Si un smoke ciblé existe ou est ajouté :

```bash
yarn workspace battleforthecrown-backend test:smoke -- army
```
