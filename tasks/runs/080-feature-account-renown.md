# Run #080 — feature-account-renown

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — nouvelle couche méta cross-monde. Démarrage assumé hors MVP (les mondes vont tourner, on veut accumuler la Renommée dès le 1er).
- **Spec source** : `docs/gameplay/25-account-renown.md` (**à créer dans ce run** — producteur de vérité, n'existe pas encore).
- **Type** : feature
- **Modules** : shared `packages/shared/src/renown/` | backend `modules/renown` + Prisma + `world-lifecycle.worker` | frontend `PlayerProfileSheet` + track cosmétique | docs gameplay + data-model

## Objectif

Niveau de compte **« Renommée »** persistant à travers les mondes. Modèle LoL : mesure de vétérance **cosmétique / identité / accès uniquement, jamais de pouvoir in-world** (respecte l'invariant wipe de [`19-world-lifecycle.md`](../../docs/gameplay/19-world-lifecycle.md) — seul le cosmétique survit au wipe).

Nom **Renommée** choisi pour éviter la collision avec **Gloire** d'Assaut / Rempart (classements, [`24`](../../docs/gameplay/24-rankings.md)).

### 4 sources de XP

1. **Construction** — event `building.completed`, XP pondérée par `POIDS_BÂTIMENT × niveau` (réutilise les poids de [`09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md)). Voie PvE-friendly.
2. **Conquête** — event `village.conquered`, base PvP ; barbare = base × `RENOWN_BARBARIAN_CONQUEST_FACTOR` (**défaut 1/3**, constante shared tunable + documentée).
3. **Combat** — dérivé des `GloryLedger.points` **déjà anti-farmés** (run 051 : `opponentMultiplier` + rendement par paire 24 h déjà appliqués). PvP only, barbares exclus. **Réutilisation, pas de recalcul.**
4. **Classement fin de monde** — bonus par palier (top 1 / top 10 / top 100 / participation) sur les 3 signaux, crédité à la transition `LOCKED→ENDED`.

**Crédit** : live (sources 1-3) via ledger idempotent par event Outbox ; batch (source 4) dans la transition ENDED.

## Dépendances

- ✅ `051-feature-rankings-glory` (DONE) — `GloryLedger` persiste déjà les points combat anti-farmés (`points` = valeur finale). Source de la XP combat.
- ✅ `061-feature-world-ended-lifecycle` (DONE) — `WorldFinalRankingSnapshot` + transition `LOCKED→ENDED` (`world-lifecycle.worker.ts`). Hook du bonus de classement.
- 📋 `067-feature-world-ended-cosmetic-permanent-rewards` (PLANNED, connexe **coordination forte**) — même hook `LOCKED→ENDED`, même surface profil, même nature account-global (`UserWorldCosmeticAward`, `GET /users/me/cosmetic-awards`). **Décision archi à trancher en étape 3 : table renown séparée vs infra account-global unifiée — ne pas dupliquer.**
- Surfaces UI connexes : `070-integrate-player-profile-sheet`, `053-feature-player-display-name`. À ne pas confondre avec `049-royal-duty-level-scaling` (proxy « niveau joueur » = château max, per-monde, distinct de la Renommée account-global).

## Points d'attention (garde-fous validés)

- ⚠️ **Incitation au multi-feed** : la XP combat devient account-globale **permanente** → réutiliser **`GloryLedger.points`** (déjà anti-farmé), **jamais les kills bruts**.
- ⚠️ **Invariant intouchable** : **zéro effet in-world** (ressources, vitesse, vision, coût Seigneur). Sinon = snowball cross-monde interdit par [`19`](../../docs/gameplay/19-world-lifecycle.md). Récompense de niveau = cosmétique + identité only.
- ⚠️ **Barbares** : XP via construction + conquête seulement, **pas** de XP combat (régen infinie = farm illimité).
- ⚠️ **No P2W** : XP = temps de jeu / faits d'armes, jamais achetable.
- **World-gating** (mondes spéciaux réservés par niveau) : **réservé futur, hors scope de ce run**.

## Critère de fin (acceptance)

- [ ] Spec `docs/gameplay/25-account-renown.md` créée (producteur de vérité) + entrée index README + entrée `data-model.md` — _automatisable : grep présence_
- [ ] `packages/shared/src/renown/` : constantes (`RENOWN_CONSTRUCTION_FACTOR`, `RENOWN_CONQUEST_BASE`, `RENOWN_BARBARIAN_CONQUEST_FACTOR=1/3`, table bonus classement) + courbe `renownLevelForXp`/`xpForLevel` + fonctions pures, couverts par specs — _automatisable : `yarn test:pixi`/unit shared_
- [ ] `User.renownXp` + `RenownLedger` (idempotence par source event/Outbox id) migrés ; un replay d'Outbox ne double pas la XP — _automatisable : smoke idempotence_
- [ ] XP créditée live sur `building.completed` (pondérée poids), `village.conquered` (PvP vs barbare ×1/3), et écriture `GloryLedger` (combat PvP, barbares = 0 XP combat) — _automatisable : smoke par source_
- [ ] Bonus de classement crédité une seule fois à `LOCKED→ENDED`, par palier, dans la tx de transition — _automatisable : smoke lifecycle_
- [ ] `GET /users/me/renown` expose niveau + XP courante + seuil prochain niveau — _automatisable : curl/smoke REST_
- [ ] `PlayerProfileSheet` affiche le niveau de Renommée + barre de progression ; feedback de level-up — _visuel/gameplay : checklist IG user_
- [ ] Aucun effet in-world introduit (grep : pas de mutation ressources/vitesse/vision liée à la Renommée) — _automatisable : revue diff + grep_
- [ ] `yarn static-check` vert ; review indépendante GO

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-prisma`, `bftc-workers-outbox`, `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`
- Specs amont : [`19-world-lifecycle.md`](../../docs/gameplay/19-world-lifecycle.md) (invariant wipe), [`24-rankings.md`](../../docs/gameplay/24-rankings.md) (Gloire = source combat + anti-farm), [`09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md) (poids bâtiments)
- Code clés : `modules/rankings/rankings.service.ts` (écriture `GloryLedger`), `workers/world-lifecycle.worker.ts` (`LOCKED→ENDED`), `prisma/schema.prisma` (`model User`, `model GloryLedger`, `model WorldFinalRankingSnapshot`)

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

1. **Spec + shared** : doc 25 (transcrit le design tranché) + README/data-model ; `shared/renown` constantes + courbe + fonctions pures + specs.
2. **Backend schema + crediting live** : `User.renownXp` + `RenownLedger` (migration additive) ; `RenownService` (consommation `building.completed` / `village.conquered` / hook `GloryLedger`) ; `GET /users/me/renown`.
3. **Backend bonus fin de monde** : crédit palier à `LOCKED→ENDED` (coordination 067 sur l'infra account-global).
4. **Frontend** : Renommée sur `PlayerProfileSheet` (niveau + barre), feedback level-up, ébauche track cosmétique.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

_(Vide au démarrage.)_

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : … (requise — back+front, crée SPEC, diff > 100 lignes, invariant durable)
- **Tests automatisés** : …
- **Tests IG user** : checklist Renommée (niveau visible sur fiche profil, level-up ressenti) — l'agent ne fait pas de QA IG
