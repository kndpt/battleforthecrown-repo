# Run #080 — feature-account-renown

> **Statut** : DONE
> **Démarré** : 2026-06-21
> **Terminé** : 2026-06-21

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

## Rapport final

**Synthèse** : Renommée account-global livrée — spec `25`, shared `renown/` (constantes + courbe inversible + fns pures, 9 specs), `User.renownXp` + `RenownLedger` idempotent (migration additive), crédit live (construction/conquête×barbare/combat réutilisant `GloryLedger.points`) + batch classement à `LOCKED→ENDED`, `GET /users/me/renown`, bloc Renommée + barre + feedback level-up sur `PlayerProfileSheet`. Invariant respecté : zéro effet in-world. Bug d'idempotence combat (dedupKey sans `opponentUserId`) et N+1 dans la tx de transition corrigés en review.

### Acceptance & QA

- [x] Spec `25-account-renown.md` + index README + entrée `data-model.md` — `ls docs/gameplay/25-account-renown.md && grep -c "25-account-renown\|RenownLedger" docs/gameplay/README.md docs/architecture/data-model.md` → fichier présent + entrées OK
- [x] `shared/renown` constantes + courbe + fns pures couvertes — `vitest run packages/shared/src/renown` → 9/9 verts (round-trip 50 niveaux, barbare ×1/3, ranking tiers)
- [x] `User.renownXp` + `RenownLedger` idempotent, replay Outbox ne double pas — `test:smoke:run -- renown.smoke` scénario 1 (double recordOutboxEvent même eventId → XP inchangée)
- [x] XP live construction (poids×niveau) / conquête (PvP 500, barbare 167) / combat (`GloryLedger.points`, barbares 0) — smoke scénarios 1/2/3 + `combat.worker.ts:728-779` (réutilise `ledger.points`)
- [x] Bonus classement crédité une fois à `LOCKED→ENDED` dans la tx — smoke scénario 4 (re-run → inchangé) + `world-lifecycle.worker.ts:170`
- [x] `GET /users/me/renown` expose niveau + XP + seuils — `renown.controller.ts` + `getStatus` → `renownStatusForXp`
- [ ] `PlayerProfileSheet` niveau + barre + feedback level-up — `visuel` → checklist IG user ci-dessous
- [x] Aucun effet in-world — `rg "renownXp" battleforthecrown-backend/src` → seul lecteur = `getStatus` (cosmétique) ; review confirme
- [x] `yarn static-check` vert ; review indépendante GO — voir ci-dessous

- **Review indépendante** : Déclenchée (raison : back+front, crée SPEC, diff > 100 lignes, invariant durable). Cycle 1 `BLOCK` (1 majeur N+1 tx transition + 2 mineurs) → fix batch + doc → cycle 2 `VERDICT: GO`.
- **Tests automatisés** : `vitest packages/shared/src/renown` 9/9 ; `yarn workspace battleforthecrown-pixi test` 646/646 ; `yarn static-check` vert (tsc + eslint backend+pixi).
- **Smokes lancés** : `test:smoke:preflight` + `test:smoke:run -- renown.smoke` → 5/5 verts. Ciblés (diff backend non transversal : nouveau module isolé + hooks additifs). Full smoke suite couverte par CI PR.
- **Smokes ajoutés** : `test/renown.smoke.spec.ts` (5 scénarios : construction+idempotence, conquête PvP/barbare, combat dedup granulaire, bonus classement+idempotence, getStatus).
- **QA fonctionnelle agent** : crédit/idempotence exercés via smoke réel (RenownService contre Postgres smoke). Endpoint REST non curl-é à la main (couvert par getStatus + dérivation shared testée).
- **Tests IG à faire par le user** :
  - [ ] Ouvrir la fiche profil → onglet Profil : bloc « Renommée » avec niveau + barre de progression cohérente.
  - [ ] Après un gain de XP qui fait monter de niveau, rouvrir le profil → feedback « Niveau supérieur ! » visible puis acquitté.
