# 25 — Renommée de compte (account renown)

> **Statut** : spec MVP+ tranchée (defaults paramétrables). Couche **méta cross-monde**, indépendante du cycle de vie d'un monde.
> Producteur de vérité produit. Valeurs runtime : [`@battleforthecrown/shared` → `src/renown/`](../../packages/shared/src/renown/).

## 1. Intention

**Renommée** = niveau de compte **persistant à travers les mondes**, modèle « vétérance LoL ». Mesure le temps de jeu et les faits d'armes cumulés sur **tous** les mondes auxquels un compte a participé.

- **Nom** : « Renommée » — choisi pour éviter la collision avec **Gloire** d'Assaut / Rempart (classements per-monde, [`24-rankings.md`](./24-rankings.md)).
- **Distinct** du « niveau joueur » per-monde (= château max, cf. `royal-duty`). La Renommée ne se reset jamais.

## 2. Invariant non négociable — zéro pouvoir in-world

La Renommée est **cosmétique / identité / accès** uniquement. **Jamais** d'effet in-world : ni ressources, ni vitesse, ni vision, ni coût de Seigneur, ni stat de combat.

Raison : un effet in-world rendrait la Renommée **snowball cross-monde**, ce qui viole l'invariant wipe de [`19-world-lifecycle.md`](./19-world-lifecycle.md) (seul le cosmétique survit au wipe). Un compte vétéran ne doit avoir **aucun avantage mécanique** sur un nouveau compte dans un monde donné.

- **No P2W** : la XP = temps de jeu / faits d'armes, **jamais achetable**.
- Récompenses de palier = titres, cadres, couleurs, badges, et plus tard accès à des mondes spéciaux (« world-gating », **réservé futur, hors scope**).

## 3. Sources de XP (4)

| # | Source | Déclencheur | Formule | Portée |
|---|--------|-------------|---------|--------|
| 1 | **Construction** | event `building.completed` | `getBuildingPowerWeight(type) × level × RENOWN_CONSTRUCTION_FACTOR` | PvE-friendly, tous joueurs |
| 2 | **Conquête** | event `village.conquered` | PvP : `RENOWN_CONQUEST_BASE` ; barbare : `RENOWN_CONQUEST_BASE × RENOWN_BARBARIAN_CONQUEST_FACTOR` | conquérant (`newOwnerId`) |
| 3 | **Combat** | écriture `GloryLedger` (run 051) | `GloryLedger.points × RENOWN_COMBAT_FACTOR` | scorer PvP only |
| 4 | **Classement fin de monde** | transition `LOCKED→ENDED` | bonus par palier (top 1 / 10 / 100 / participation) **par signal** | depuis `WorldFinalRankingSnapshot` |

### Garde-fous anti-farm

- **Source 3 réutilise `GloryLedger.points`**, déjà anti-farmé en run 051 (`opponentMultiplier` + rendement par paire 24 h). **Aucun recalcul**, jamais les kills bruts — sinon la XP combat devenue account-permanente inciterait au multi-feed.
- **Barbares** : XP via construction (1) + conquête (2, facteur ×1/3) seulement. **Pas de XP combat** (régen infinie = farm illimité). Naturellement garanti : `GloryLedger` n'est écrit qu'en PvP (`opponentUserId` requis).
- Source 1 plafonnée de facto par le coût croissant des bâtiments ; pas d'anti-farm dédié nécessaire.

### Mode de crédit

- **Live** (sources 1-3) : crédit idempotent au moment de l'event.
  - Sources 1-2 : consommées dans `EventOutboxService.dispatchEvent()` (même hook que retention/onboarding), idempotence par `eventOutboxId`.
  - Source 3 : créditée dans la **même transaction** que l'écriture `GloryLedger` (`CombatWorker.creditCombatGlory`), idempotence par `combatReportId+signal+scorer`.
- **Batch** (source 4) : crédité dans la **transaction** de transition `LOCKED→ENDED` (`WorldLifecycleWorker.transitionWorld`), juste après `snapshotFinalRankings`, idempotence par `worldId+signal+userId`.

## 4. Courbe de niveau

Seuil cumulé pour atteindre le niveau `L` (niveau 1 = 0 XP) :

```
xpForLevel(L) = RENOWN_LEVEL_BASE × L × (L − 1)        (L ≥ 1)
```

Avec `RENOWN_LEVEL_BASE = 250`, les premiers paliers :

| Niveau | XP cumulée | Coût du palier |
|--------|-----------|----------------|
| 1 | 0 | — |
| 2 | 500 | 500 |
| 3 | 1 500 | 1 000 |
| 4 | 3 000 | 1 500 |
| 5 | 5 000 | 2 000 |

Croissance linéaire du coût (+`RENOWN_LEVEL_BASE × 2` par niveau). Pas de cap (vétérance infinie, cosmétique).

Inverse : `renownLevelForXp(xp)` = plus grand `L` tel que `xpForLevel(L) ≤ xp`.

## 5. Constantes (defaults paramétrables)

Dans [`packages/shared/src/renown/constants.ts`](../../packages/shared/src/renown/constants.ts) :

| Constante | Défaut | Rôle |
|-----------|--------|------|
| `RENOWN_CONSTRUCTION_FACTOR` | `1` | multiplicateur XP construction |
| `RENOWN_CONQUEST_BASE` | `500` | XP base d'une conquête PvP |
| `RENOWN_BARBARIAN_CONQUEST_FACTOR` | `1/3` | facteur XP conquête barbare |
| `RENOWN_COMBAT_FACTOR` | `1` | multiplicateur XP combat (sur `GloryLedger.points`) |
| `RENOWN_LEVEL_BASE` | `250` | base de la courbe de niveau |
| `RENOWN_RANKING_BONUS` | `{ top1: 5000, top10: 2000, top100: 500, participation: 100 }` | bonus de classement par palier, **crédité par signal** |

## 6. Persistance

- `User.renownXp Int @default(0)` — total cumulé, source d'autorité du niveau (le niveau est dérivé, jamais stocké).
- `RenownLedger` — journal idempotent. Une ligne par crédit, `dedupKey @unique` :

| Champ | Type | Note |
|-------|------|------|
| `id` | cuid | |
| `userId` | FK User | |
| `source` | enum `RenownSource` | `CONSTRUCTION` \| `CONQUEST` \| `COMBAT` \| `RANKING_BONUS` |
| `xp` | Int | XP créditée (≥ 0) |
| `worldId` | String? | contexte monde (null si non pertinent) |
| `dedupKey` | String `@unique` | clé d'idempotence (voir ci-dessous) |
| `createdAt` | Timestamptz | |

**Clés d'idempotence (`dedupKey`)** :

| Source | `dedupKey` |
|--------|-----------|
| Construction | `outbox:<eventOutboxId>` |
| Conquête | `outbox:<eventOutboxId>` |
| Combat | `combat:<combatReportId>:<signal>:<scorerUserId>:<opponentUserId>` (aligné 1:1 sur la clé unique de `GloryLedger`) |
| Classement | `ranking:<worldId>:<signal>:<userId>` |

**Crédit atomique** : `tx.renownLedger.createMany({ data, skipDuplicates: true })` puis `if (count > 0) tx.user.update({ renownXp: { increment: xp } })`. `skipDuplicates` ne lève pas → un replay d'Outbox (ou une transaction combat rejouée) ne double jamais la XP et **ne pollue pas** la transaction englobante.

## 7. API

`GET /users/me/renown` (JWT) →

```json
{
  "xp": 1750,
  "level": 3,
  "currentLevelXp": 1500,
  "nextLevelXp": 3000,
  "xpIntoLevel": 250,
  "xpForNextLevel": 1500
}
```

- `currentLevelXp` = `xpForLevel(level)`, `nextLevelXp` = `xpForLevel(level + 1)`.
- `xpIntoLevel` = `xp − currentLevelXp`, `xpForNextLevel` = `nextLevelXp − currentLevelXp`.

## 8. Frontend

`PlayerProfileSheet` : niveau de Renommée + barre de progression (`xpIntoLevel / xpForNextLevel`). Feedback de level-up cosmétique. Aucune valeur n'est calculée localement de façon autoritative — le front consomme `GET /users/me/renown` et la dérivation pure de `shared/renown`.

## 9. Décisions d'architecture

- **Table `RenownLedger` dédiée, pas d'infra account-global unifiée.** Le run connexe `067` (récompenses cosmétiques permanentes, `UserWorldCosmeticAward`) **n'est pas encore implémenté** au moment de ce run. Construire une infra unifiée spéculative violerait la simplicité de scope. `067` pourra réutiliser `User`/le hook `LOCKED→ENDED` ou coexister ; les deux sont account-global et compatibles.
- **Réutilisation de `GloryLedger.points`** (et non recalcul) : single source of truth de l'anti-farm combat, cf. run 051.

## Références

- [`19-world-lifecycle.md`](./19-world-lifecycle.md) — invariant wipe (seul le cosmétique survit).
- [`24-rankings.md`](./24-rankings.md) — Gloire = source combat + anti-farm.
- [`09-power-and-rankings.md`](./09-power-and-rankings.md) — poids des bâtiments réutilisés par la source construction.
