# 41 — Période de capture : data model `PendingConquest` + worker `conquest-finalize`

**Sévérité** : 🔴 Bloquant pour la conquête (mécanique core absente)
**Statut** : 🆕 Ouvert 2026-05-10 (issue de [run 006](./runs/archive/006-audit-conquest.md))
**Spec amont** : [`docs/gameplay/10-conquest.md` § Cadre commun](../docs/gameplay/10-conquest.md#cadre-commun--joueur-ou-barbare) + [`13-barbarian-conquest.md`](../docs/gameplay/13-barbarian-conquest.md) (durées par tier) + [`14-pvp-conquest.md`](../docs/gameplay/14-pvp-conquest.md) (durées PvP)

## Symptôme

La spec 10 impose une **période de capture** : « Le Seigneur s'installe et reste immobilisé toute la fenêtre. Si non-attaqué pendant la fenêtre → conquête réussie, le village change de propriétaire. ». Aucune trace en code :

- `prisma/schema.prisma` — pas de `PendingConquest`, pas de `captureUntil`, pas de `pendingConquestId` sur `Village`.
- `ConquestService.conquerVillage` — transfère **immédiatement** la propriété + supprime Watchtower + reset ressources, sans fenêtre intermédiaire (mais **orphelin** : aucun caller, cf. ticket #42).
- Aucun worker `conquest-finalize.worker.ts`.

## État actuel

- `ConquestService` (`battleforthecrown-backend/src/modules/combat/conquest.service.ts`) — exporte `conquerVillage(...)` (orphelin) et `canConquer(...)` (orphelin). L'implémentation actuelle = transfert immédiat. Doit devenir le **finalisateur** appelé par le worker à `captureUntil`.
- `EventOutbox.type` — `village.conquered` existant. À étendre avec `village.capture-window-opened`, `village.capture-window-completed`, `village.capture-window-interrupted`.

## Scope d'implémentation (estimation > 100 lignes net)

### Modèle DB (migration Prisma)

```prisma
model PendingConquest {
  id                  String   @id @default(uuid())
  attackerVillageId   String
  attackerNobleId     String?  // référence à l'UnitInventory NOBLE source si on tracke individuellement, sinon flag
  targetVillageId     String   @unique // 1 fenêtre active à la fois par village cible
  worldId             String
  openedAt            DateTime @default(now())
  captureUntil        DateTime
  status              PendingConquestStatus @default(OPEN)
  // status : OPEN | COMPLETED | INTERRUPTED

  attackerVillage     Village  @relation("PendingConquestAttacker", fields: [attackerVillageId], references: [id])
  targetVillage       Village  @relation("PendingConquestTarget",   fields: [targetVillageId],   references: [id])
  world               World    @relation(fields: [worldId], references: [id])

  @@index([captureUntil, status])
  @@index([worldId, status])
}

enum PendingConquestStatus {
  OPEN
  COMPLETED
  INTERRUPTED
}
```

### Durées par contexte

- **Barbares (PvE)** : par tier — voir [`13-barbarian-conquest.md`](../docs/gameplay/13-barbarian-conquest.md). Le caller (worker post-combat, ticket #42) calcule `captureUntil = now + tierDurationMs`.
- **PvP** : voir [`14-pvp-conquest.md`](../docs/gameplay/14-pvp-conquest.md) (à finaliser).

Ce ticket n'embarque **pas** les valeurs concrètes ; il livre le data model et le worker. Les durées sont fournies par les callers.

### Worker `conquest-finalize.worker.ts`

- Job pg-boss `conquest:finalize`, planifié au moment de l'ouverture de la fenêtre avec `startAfter: captureUntil`.
- Au tick :
  1. Charger `PendingConquest` par id, vérifier `status === OPEN`.
  2. Si `INTERRUPTED` (un combat l'a mis dans cet état entre temps) : abort, no-op.
  3. Sinon : déléguer à `ConquestService.conquerVillage(...)` qui transfère propriété (déjà codé), reset ressources, delete Watchtower.
  4. Marquer `status = COMPLETED`.
  5. Émettre `village.capture-window-completed` (Outbox).

### Helpers d'interruption

- `ConquestService.interruptCaptureWindow(targetVillageId, reason)` — appelé par `combat.worker` (ticket #42) quand un combat hostile résolu pendant la fenêtre cause la mort du Seigneur attaquant.
- Met `status = INTERRUPTED`, émet `village.capture-window-interrupted`.
- Cancel le job pg-boss `conquest:finalize` (par `singletonKey`).

### Events Outbox à créer

- `village.capture-window-opened` (payload : `targetVillageId`, `attackerVillageId`, `captureUntil`).
- `village.capture-window-completed` (payload : `targetVillageId`, `newOwnerUserId`, conserve la sémantique de `village.conquered`).
- `village.capture-window-interrupted` (payload : `targetVillageId`, `reason`).
- Conserver `village.conquered` comme event terminal, émis dans `conquerVillage` quand appelé par le worker (compatible avec consumers existants).

### Pattern pg-boss

`singletonKey: 'conquest-finalize:<pendingConquestId>'` pour pouvoir canceler proprement à l'interruption.

## Tests

- Smoke (vraie DB + pg-boss + Outbox) : `conquest-finalize.smoke.spec.ts`. Couvre :
  - Ouverture fenêtre → tick → conquête finalisée + event WS.
  - Interruption avant tick → status=INTERRUPTED → pas de transfert.
- Pure-logic : aucune logique extractible côté worker — tout est orchestration.

## Tradeoff scope

≈ 1.5 jour dev (migration + worker + 3 events + smoke). Bloque la conquête de bout en bout. Dépend du ticket #42 (le hook qui *crée* le `PendingConquest`) et du ticket #40 (sans Seigneur recrutable, rien à conquérir). Ordre d'implémentation recommandé : #40 → #41 → #42.

## Questions à trancher au démarrage

1. `attackerNobleId` granularité : tracker l'UnitInventory NOBLE individuel (compliqué) vs simple flag « le village A a un Seigneur en garnison réservé pour cette conquête » (simple). Recommandation : flag + décrément `UnitInventory.NOBLE.quantity` au moment de l'ouverture (le Seigneur est immobilisé = retiré de la garnison).
2. `targetVillageId @unique` : on interdit 2 fenêtres simultanées sur la même cible. Conséquence : si A1 a une fenêtre ouverte et A2 attaque la cible, A2 doit interrompre (combat normal) ou être bloqué ? Recommandation : combat normal s'applique, peut interrompre.
3. Cleanup à `captureUntil` dépassé sans tick (worker down) : ajouter un sweeper ou compter sur le retry pg-boss.
4. Interaction `BarbarianBackfillWorker` : quand la cible est un village barbare, le reseed ne doit se déclencher qu'**après** `village.capture-window-completed` (pas pendant la fenêtre, sinon on respawn une cible déjà engagée). À câbler côté #42 ou ajouter un consumer ici.
