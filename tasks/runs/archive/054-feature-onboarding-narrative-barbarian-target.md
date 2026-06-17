# Run #054 — feature-onboarding-narrative-barbarian-target

> **Statut** : DONE
> **Démarré** : 2026-06-16
> **Terminé** : 2026-06-16

## Cible

- **Phase roadmap** : Phase 8 — Onboarding
- **Spec source** : [`docs/gameplay/15-onboarding.md`](../../../docs/gameplay/15-onboarding.md) + [`docs/gameplay/07-barbarian-spawning.md`](../../../docs/gameplay/07-barbarian-spawning.md) + [`docs/gameplay/06-barbarians.md`](../../../docs/gameplay/06-barbarians.md)
- **Type** : `feature`
- **Modules backend** : `onboarding`, `world/barbarian-seeding`, `world/barbarian-village-factory`, `world/onboarding-narrative-target`, `combat`, `event`
- **Modules frontend** : `pixi/features/onboarding`

## Dépendances

- Préserver la politique globale issue du run [`007-audit-barbarian-spawning`](../archive/007-audit-barbarian-spawning.md) : les villages barbares T1-T5 globaux restent des adversaires réels.
- Nettoyer/remplacer l'invariant introduit par le run [`035-fix-early-barbarian-reachability`](../archive/035-fix-early-barbarian-reachability.md) sans casser l'onboarding livré par le run [`036-feature-scripted-onboarding-runtime`](../archive/036-feature-scripted-onboarding-runtime.md).

## Critère de fin (acceptance)

- [x] Compte frais reçoit une cible barbare narrative dédiée après Tour de guet L1, visible dans le feed serveur de carte.
- [x] Avec `ONBOARDING_TRAIN_TROOPS_TARGET = 5` milices, l'attaque contre la cible narrative complète `ATTACK_BARBARIAN`.
- [x] Villages barbares T1 globaux conservent leur défense réelle (roll 60-100 % cap T1, garnison 9-15 MILICE).
- [x] Garde-fou générique « T1 atteignable » supprimé du seeding global et des tests associés.
- [x] Seeding global continue selon `docs/gameplay/07-barbarian-spawning.md`.
- [x] `ATTACK_BARBARIAN` ne se complète pas par défaite ni par cible non conforme.
- [x] Specs gameplay alignées : cible narrative décrite, garantie T1 atteignable retirée.
- [x] Guidance frontend dirige clairement vers la cible révélée.

## Rapport final

Cible narrative onboarding : nouveau `OnboardingNarrativeTargetService` crée un village barbare T1 affaibli (`originKind = ONBOARDING_NARRATIVE`, garnison fixe 5 MILICE, loot ≈40 % cap T1) à `building.completed` WATCHTOWER L1, idempotent via `OnboardingState.narrativeTargetVillageId`. La projection ATTACK_BARBARIAN exige `targetOriginKind === 'ONBOARDING_NARRATIVE'` ; `hasVictoriousBarbarianAttack` résout la cible via `(worldId, x, y)` car `CombatReport.defenderVillageId` est null pour BARBARIAN_VILLAGE. Garde-fou seeding global `ensureReachableTierOne` + helper `findReachableBarbarianSeedPosition` supprimés.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Cible narrative visible après Watchtower L1 — `yarn workspace battleforthecrown-backend test:smoke:run -- onboarding.smoke` → cible créée+visible (`narrativeTargetVillageId` non-null, `originKind = ONBOARDING_NARRATIVE`, distance ≤ rayon Watchtower L1).
  - [x] 5 milices gagnent contre la cible narrative et complètent `ATTACK_BARBARIAN` — `yarn workspace battleforthecrown-backend test:smoke:run -- onboarding.smoke` → 4 smokes verts (helper passe `defenderVillageId = null` pour mirror prod).
  - [x] T1 globaux conservés comme adversaires réels — `rg "rollInitialBarbarianUnits" battleforthecrown-backend/src/modules/world/barbarian-village.factory.ts` → invocation inchangée pour `originKind=STANDARD`.
  - [x] Ancienne garantie T1 atteignable supprimée — `rg "ensureReachableTierOne|findReachableBarbarianSeedPosition" battleforthecrown-backend/src/ packages/shared/src/` → 0 résultat.
  - [x] Specs alignées sur cible narrative vs seeding global — `rg "ONBOARDING_NARRATIVE|cible narrative" docs/gameplay/{06,07,15}*` → 9 occurrences réparties sur les 3 fichiers.
- **Review indépendante** : `Déclenchée (raison: back+front + invariant durable + diff > 100 lignes + specs gameplay modifiées)`. Cycle 1 = `BLOCK` (1 bloquant correctness : `hasVictoriousBarbarianAttack` dépendait de `defenderVillageId` toujours null pour BARBARIAN_VILLAGE ; 2 majeurs : retry hot-loop EventOutbox, comptes pré-feature non backfillés). Cycle 2 = `GO` après fix bloquant (lookup via `(worldId, x, y)` + helper smoke passe `null` pour mirror prod) + fix retry hot-loop (try/catch local). Majeur "comptes pré-feature" = dérogation user (décision : « Aucun — nouveaux joueurs seulement »). Mineurs (retention RAID_BARBARIAN, frontend focus camera, dup `pickReachablePosition`, log silencieux) non traités MVP.
- **Tests automatisés** : `yarn workspace battleforthecrown-backend test` → 441/441 verts. `yarn workspace battleforthecrown-pixi test` → 451/451 verts.
- **Smokes lancés** : `yarn workspace battleforthecrown-backend test:smoke:run -- onboarding.smoke barbarians.smoke combat-attack.smoke combat-reports-inbox.smoke` → 12/12 verts (Ciblés ; diff touche onboarding/seeding/combat).
- **Smokes ajoutés/modifiés** : `onboarding.smoke.spec.ts` — étendu pour vérifier création cible narrative après Watchtower L1, victoire 5 MILICE qui complète ATTACK_BARBARIAN, nouveau test "ne complète pas sur STANDARD T1". `barbarians.smoke.spec.ts` — suppression du test "fresh join guarantees a visible T1 target attackable with Watchtower level 1" (invariant retiré).
- **QA fonctionnelle agent** : Non nécessaire — comportement validé via smokes onboarding bout-en-bout (création cible + dispatch Outbox + projection + reconciliation + completion).
- **Tests IG à faire par le user** :
  - Créer un compte frais → vérifier qu'après construction de la Tour de guet L1 un nouveau campement barbare apparaît dans le rayon de vision et que la guidance pointe vers « Attaque le campement révélé ».
  - Attaquer ce campement avec 5 milices → vérifier victoire visuelle + étape onboarding 6/6 marquée terminée.
  - Vérifier qu'un T1 standard alentour reste un vrai adversaire (sprite distinct ? compo 9-15 milices visible au scout).

### Synthèse

Cible narrative dédiée à l'onboarding (Village barbare T1 affaibli, `originKind=ONBOARDING_NARRATIVE`, 5 MILICE) créée idempotemment à Watchtower L1 via service Outbox-driven. ATTACK_BARBARIAN ne se complète que sur cette cible. Garantie globale T1 atteignable supprimée, T1 standard restent des vrais adversaires.
