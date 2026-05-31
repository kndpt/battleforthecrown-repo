# Smoke tests — orchestration & I/O

Source unique de la stratégie : skill [`bftc-tests-policy`](../../.agents/skills/bftc-tests-policy/SKILL.md).
Ce document décrit la mise en œuvre concrète : où ils vivent, comment les lancer, comment en ajouter un.

## Où

```
battleforthecrown-backend/test/
├── *.smoke.spec.ts           # 1 fichier par domaine/flow orchestration
├── helpers.ts                # bootSmokeApp, truncateAll, registerUser, joinWorld, waitFor, outboxDispatched
├── smoke-test-db.ts          # clones DB par worker Jest
├── jest-smoke.json           # config Jest dédiée (testRegex smoke.spec.ts$)
├── jest-smoke-setup.ts       # env vars (DATABASE_URL smoke, JWT secrets de test)
└── fixtures/smoke-world-config.ts   # WorldConfig avec tempo ultra-petit (timing compressé pour tests rapides)
```

## Comment lancer

```bash
yarn workspace battleforthecrown-backend test:smoke
```

Pré-requis : la base `battleforthecrown_smoke` doit exister + migrations appliquées (cf. [`db-setup.md`](./db-setup.md)). La commande lance d'abord `scripts/smoke-preflight.sh` pour vérifier Docker, la DB smoke et `prisma migrate status`. Un seul boot AppModule, ~100s pour la suite complète locale actuelle.

Pour un run agent local, préférer un périmètre ciblé :

```bash
yarn workspace battleforthecrown-backend test:smoke:preflight
yarn workspace battleforthecrown-backend test:smoke:run -- combat-attack.smoke.spec.ts
```

La CI GitHub lance la suite complète sur PR vers `main`; le ciblage local sert à prouver rapidement le risque du diff sans dupliquer systématiquement le job CI.

## Flows couverts

| Smoke file | Flow principal |
|---|---|
| `auth.smoke.spec.ts` | JWT auth + refresh |
| `worlds-public.smoke.spec.ts`, `world-membership.smoke.spec.ts` | royaumes publics, join, session monde |
| `construction.smoke.spec.ts` | construction bâtiment + `building.completed` |
| `village-labels.smoke.spec.ts`, `village-strategy.smoke.spec.ts` | endpoints village annexes |
| `production-tick.smoke.spec.ts`, `crowns.smoke.spec.ts` | ticks ressources/couronnes |
| `daily-retention.smoke.spec.ts`, `onboarding.smoke.spec.ts` | retention, onboarding |
| `army-training.smoke.spec.ts`, `army-training-read.smoke.spec.ts`, `recruit-noble.smoke.spec.ts` | formation, lecture file, Seigneur |
| `combat-attack.smoke.spec.ts`, `combat-reports-inbox.smoke.spec.ts` | attaque, retour, rapports participant-scoped |
| `scouting.smoke.spec.ts`, `vision.smoke.spec.ts` | scout, brouillard de guerre |
| `combat-conquest-hook.smoke.spec.ts`, `conquest-service.smoke.spec.ts`, `conquest-finalize.smoke.spec.ts` | fenêtre de capture, occupation, finalisation |
| `recall-en-route.smoke.spec.ts`, `reinforcements.smoke.spec.ts` | rappel et renforts |
| `realtime-socket.smoke.spec.ts` | dispatch Outbox via Socket.IO réel |
| `barbarians.smoke.spec.ts` | seeding/catchup barbares |
| `kingdom-activities-snapshots.smoke.spec.ts` | snapshots activités du royaume |

## Quand ajouter un smoke

À chaque ajout :
- d'un **worker pg-boss** (ex : nouvelle queue) ;
- d'un **event Outbox** (nouveau `kind` dans `event-types.ts`) ;
- d'un **endpoint critique** qui touche aux flows ci-dessus.

À l'inverse, **pas de smoke** pour : helpers purs, formules, validation Zod isolée — un unit test pure-logic suffit.

## Comment ajouter un smoke

1. Choisir le fichier `*.smoke.spec.ts` existant du domaine ; créer un nouveau fichier seulement pour un nouveau domaine durable.
2. Pattern : `seedSmokeWorld → registerUser → joinWorld → mutation → waitFor(state DB) → outboxDispatched(...)`.
3. Pour les flows de longue durée (combat, training), ajuster `tempo.overrides.travelSpeed` ou `tempo.overrides.unitTrainingSpeed` dans la fixture si le timing est trop lent — `construction`/`training` sont déjà clampés à 1 s minimum côté shared. Sémantique : `tempo` plus petit = flux plus court (cf. [`docs/gameplay/23-world-tempo-and-multipliers.md` § 5.1.1](../gameplay/23-world-tempo-and-multipliers.md#511-sémantique-du-multiplier--règle-unique)).
4. Pour un nouveau `kind` Outbox : retrouver l'`aggregateId` réel dans le publisher (`outbox-publisher.service.ts`) ou le worker — c'est lui qu'on filtre.

## Anti-patterns

Cf. [`bftc-tests-policy`](../../.agents/skills/bftc-tests-policy/SKILL.md). Rappel critique :

- **Jamais** mocker `PrismaService` ou `pg-boss` dans un smoke.
- **Jamais** asserter sur `mock.toHaveBeenCalledWith(...)` — on assert sur l'effet (DB row, event row dispatched).
- **Jamais** lancer les smokes sur la DB dev (`battleforthecrown`) — toujours sur `battleforthecrown_smoke`.

## Points connus

- **Production tick et barbarian seeding catchup n'écrivent pas dans l'Outbox** : choix archi (frontend interpole pour les ressources ; le catchup est invisible côté UI). Le smoke valide l'effet DB seul.
- **Crown production** gate l'event sur `production > 0`. Le smoke backdate `lastUpdateTs` d'1 jour pour forcer une production mesurable.
- **Le flow combat → conquête** demande un NOBLE recruté à la Salle du Trône. Les smokes dédiés couvrent le recrutement, l'ouverture de fenêtre après combat, la mort du Seigneur, l'interruption et la finalisation `conquest:finalize`.
