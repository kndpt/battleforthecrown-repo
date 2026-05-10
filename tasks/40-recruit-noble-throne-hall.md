# 40 — Recrutement Seigneur à la Salle du Trône (use-case + endpoint dédié)

**Sévérité** : 🟠 Majeur (mécanique de conquête bloquée tant que NOBLE n'est pas recrutable)
**Statut** : 🆕 Ouvert 2026-05-10 (issue de [run 006](./runs/archive/006-audit-conquest.md))
**Spec amont** : [`docs/gameplay/10-conquest.md` § Le Seigneur — recrutement et règles](../docs/gameplay/10-conquest.md#le-seigneur--recrutement-et-règles)

## Symptôme

NOBLE est listé dans le catalogue d'unités shared (`UNIT_COSTS[NOBLE]`, run 003) avec coûts spec 10 (5000×3 + 5000 couronnes + 15 pop + 8h, Throne Hall L1) **mais aucun chemin de recrutement n'existe** côté backend :

- Il a été retiré du DTO Caserne par run 006 (`train-units.dto.ts`).
- `RecruitTroopsUseCase` rejette explicitement NOBLE depuis run 006 avec un message renvoyant à ce ticket.
- Aucun endpoint Throne Hall, aucun use-case dédié, aucune file Trône.

Conséquence : impossible aujourd'hui de recruter un Seigneur. Bloque toute conquête.

## État actuel

- `packages/shared/src/army/unit.ts` — NOBLE coûts alignés spec 10 (run 006).
- `packages/shared/src/army/recruitment.ts` — helper pur `canRecruitNoble({ garrisonNobleCount, hasNobleInQueue })` (run 006, T4).
- `packages/shared/src/army/types.ts` — `UnitCost.crowns?: number` posé (run 006, T1).
- `prisma/schema.prisma` — `UnitTraining` partagé Caserne/Trône, **pas** de discriminant `building` ni de file séparée. `Crown` table existe (gérée par module `crowns`).
- Pas de helper « débite couronnes en transaction » réutilisable côté `crowns/` (à confirmer en lecture du module).

## Scope d'implémentation (estimation > 50 lignes net)

### Choix d'architecture à trancher

| # | Choix | Recommandation |
|---|---|---|
| 1 | File Trône : discriminant `building: 'BARRACKS' \| 'THRONE_HALL'` sur `UnitTraining` vs nouvelle table `NobleTrainingQueue` | Discriminant — moins de duplication ; le worker `training.worker.ts` gère déjà le tick générique, il suffit d'ajouter un champ. |
| 2 | Endpoint : `POST /villages/:id/throne/recruit-noble` vs étendre `POST /army/:villageId/train` avec discriminant | Endpoint dédié — sémantique claire côté frontend, validation Zod plus simple (pas de `quantity`, fixé à 1). |
| 3 | Coûts couronnes : déduire dans la même transaction que la mutation `Crown.balance` | Oui obligatoire (pattern transactionnel). Voir `crowns.service` pour helper existant. |
| 4 | Cap 1 : appliquer `canRecruitNoble` dans le use-case avant la transaction | Oui (helper pur shared). |

### Fichiers attendus

- `battleforthecrown-backend/src/modules/gameplay/recruit-noble.use-case.ts` — nouveau use-case dédié (couronnes + cap 1 + Throne Hall L1 + transaction Outbox).
- `battleforthecrown-backend/src/modules/army/throne.controller.ts` (ou ajouter à `army.controller.ts`) — endpoint `POST /army/:villageId/throne/recruit-noble`.
- `battleforthecrown-backend/src/modules/army/dto/recruit-noble.dto.ts` — Zod schema (pas de `quantity`, fixé à 1 ; pas de `unitType`, NOBLE implicite).
- `prisma/schema.prisma` — ajout `building: TrainingBuilding` (enum `BARRACKS | THRONE_HALL`) sur `UnitTraining` ou nouvelle table `NobleTrainingQueue`. Migration.
- `battleforthecrown-backend/src/modules/gameplay/cancel-recruitment.use-case.ts` — étendre pour rembourser aussi `crowns` quand le training annulé est NOBLE.

### Validations métier

- `OwnershipService.assertVillageOwnedBy`.
- Throne Hall niveau ≥ 1 (i.e. construite). Réutiliser le pattern `requiredBarracksLevel`.
- Couronnes ≥ 5000 (table `Crown`).
- Pop disponible ≥ 15.
- Ressources ≥ 5000/5000/5000.
- `canRecruitNoble({ garrisonNobleCount, hasNobleInQueue })` ≡ `{ allowed: true }`.
- File parallèle : pas de blocage si la Caserne a un autre training actif (spec 10 § File parallèle).

### Outbox

- Émettre `training.started` (existe ?) avec `building: 'THRONE_HALL'` ou un nouvel event `noble.training.started`.
- À la fin (worker) : `training.completed` standard.

## Tests

- Smoke (vraie DB) : `recruit-noble.smoke.spec.ts` couvrant POST endpoint + transaction + Outbox event + déduction couronnes/pop/ressources.
- Pure-logic : étendre `recruitment.spec.ts` si extraction de helper supplémentaire nécessaire.

## Tradeoff scope

≈ 1-1.5 jour dev. Bloque la conquête barbare (Phase 5) — à prioriser dès qu'on attaque la phase. Découplé de #41 (data model PendingConquest) et #42 (hook combat) — peut être livré indépendamment.

## Question à trancher au démarrage

1. File Trône : discriminant `UnitTraining` vs table dédiée. Recommandation discriminant.
2. Annulation : full refund couronnes inclus ? La spec 10 dit « remboursement complet (ressources + couronnes + pop) » — donc oui.
