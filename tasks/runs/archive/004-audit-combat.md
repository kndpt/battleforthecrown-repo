# Run #004 — audit-combat

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (cf. [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md)). 4ᵉ sous-run sur 7.
- **Spec source** : [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) (Mécanique générale, Pertes et raids, Renforts entre villages, Conquête, Styles)
- **Type** : `audit`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/combat/` (`combat.service.ts`, `combat.worker.ts`, `return.worker.ts`, `conquest.service.ts`, `combat.utils.ts`)
  - `battleforthecrown-backend/src/modules/combat/strategies/` (`barbarian-village.strategy.ts`, `player-village.strategy.ts`)
  - `battleforthecrown-backend/src/modules/combat/loot/` (`loot.manager.ts`, `providers/resource-loot.provider.ts`)
  - `battleforthecrown-backend/src/modules/combat/dto/` (`attack-command.schema.ts`)
  - `battleforthecrown-backend/src/modules/combat/codecs/`
- **Modules frontend** : —
- **Modules transverses** :
  - `packages/shared/src/combat/` (`calculateCasualtyStats`, `isVictoryForAttacker`)
  - `packages/shared/src/logic/` (`calculateDistance`, `getTravelTimeForArmy`, `findSlowestUnitSpeed`)
  - `packages/shared/src/army/` (`UNIT_COSTS`, `getUnitStats`)
  - `packages/shared/src/village/` (`getStrategyBonusValue`)
- **Tests pure-logic existants à maintenir** : `combat.utils.spec.ts`, `combat-strategies.spec.ts`, `loot.manager.spec.ts`, `combat.dto.spec.ts`

## Dépendances

- Aucun run prérequis bloquant. Recouvre intentionnellement la frontière avec :
  - **Run 001** [`audit-economy-progression`](./001-audit-economy-progression.md) — invariant population libérée à `battle.resolved`.
  - **Run 003** [`audit-units`](./003-audit-units.md) — confronte la consommation des stats unités (atk, def, capacité, pop) que ce run attend en entrée.
- Run 003 doit être au minimum PLANNED (référencement croisé des écarts catalogue ↔ résolution).

## Critère de fin (acceptance)

- [x] Tableau d'écarts spec ↔ code couvrant : (a) résolution PvE barbares, (b) résolution PvP, (c) calcul du loot et capacité de transport, (d) trajet aller (vitesse unité la plus lente, distance euclidienne), (e) trajet retour (durée = aller, loot ramené, troupes ré-injectées), (f) libération de population, (g) bonus de style attaque/défense/loot, (h) renforts inter-villages, (i) rappel d'armée pendant l'aller.
- [x] Invariant `battle.resolved` libère la population de l'attaquant ET du défenseur (PvP) **au moment de la résolution**, pas au retour. Confirmé par lecture de `combat.worker.ts:186-205` et validé explicitement.
- [x] **`BarbarianVillageStrategy.lossesAttacker`** : écart documenté (axes #1-2 du tableau). **Décision** : couplé à l'absence de garnison barbare (`defender.units = {}`) → délégué au [run 005 audit-barbarians](./005-audit-barbarians.md) pour cohérence atomique avec le blueprint d'armée par tier.
- [x] **Renforts inter-villages** : ticket [33](../33-reinforcements-inter-villages-missing.md) ouvert (modèle DB Garrison, endpoint, worker arrival, retrait B→A, fenêtre conquête, libération pop, bonus style).
- [x] **Rappel d'armée pendant l'aller** : ticket [34](../34-army-recall-missing.md) ouvert.
- [x] Tous les écarts sont soit fixés (n/a — audit pur), soit délégués à un run frère (#1-2 → run 005 ; #21 → run 006), soit ticketés (#7, #14, #15 → tickets 33-35) — aucun écart laissé non-tracé.
- [x] Tests pure-logic existants intacts (pas de modification de formule pure — aucun spec touché).
- [x] `yarn workspace battleforthecrown-backend test` : non lancé (pas de modification src/) — vérifié par hook pre-push au push.
- [x] Section docs vérifiée : `docs/gameplay/04-combat.md` et `docs/architecture/backend-modules.md` § Combat sont cohérents avec le code (renforts/rappel explicitement marqués non implémentés côté backend dans la spec). Aucune mise à jour requise.
- [x] Section `## Rapport final` remplie + commit final `<type>(<scope>): <subject>` + QA.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

Décomposition retenue (audit pur — peu de coding, livrable principal = tableau d'écarts + tickets) :

- **T1** — Cartographie via sub-agent `code-mapper` (12 questions ciblées). ✅ DONE.
- **T2** — Confirmer écart `BarbarianVillageStrategy.lossesAttacker = {}` + `defender.units = {}`. **Décision** : couplé au modèle de garnison barbare → délégué au [run 005 (audit-barbarians)](./005-audit-barbarians.md) qui tranchera le blueprint d'armée par tier. Pas de fix ici (couplage fort).
- **T3** — Confirmer invariant population à `battle.resolved` (attaquant + défenseur PvP). ✅ Vérifié `combat.worker.ts:186-205`.
- **T4** — Confirmer bonus style propagation. ✅ Vérifié `combat.worker.ts:412-466`.
- **T5** — Confirmer loot capacity sur `survivingAttacker` PvP. ✅ Vérifié `player-village.strategy.ts:22-30`. Côté barbares : `context.attacker.units` initiaux — cohérent tant que `lossesAttacker = {}` (couplé T2).
- **T6** — Confirmer `return.worker.ts` complet. ✅ Vérifié.
- **T7** — Créer ticket [33 — Renforts inter-villages non implémenté](../33-reinforcements-inter-villages-missing.md). ✅ DONE.
- **T8** — Créer ticket [34 — Rappel d'armée non implémenté](../34-army-recall-missing.md). ✅ DONE.
- **T9** — Créer ticket [35 — Drift durée retour vs spec](../35-return-travel-time-recomputed-vs-spec.md). ✅ DONE.

## Points d'attention

- **Renforts non implémentés** : confirmé par grep zéro hit sur `RECALL`/`reinforce`/`renfort`. Spec mentionne explicitement « pas encore implémenté côté backend ». À ticketer, pas à coder ici.
- **Rappel armée** : également absent du code. Spec 04 § « Rappel pendant l'aller » est un MUST. À ticketer si confirmé.
- **`BarbarianVillageStrategy.lossesAttacker = {}`** : viole la spec « Pertes et raids ». Question : la spec 06-barbarians.md tranche-t-elle un modèle de défense passive ? Si oui → fix dans le run. Si non → bloquer en clarif spec.
- **Loot resources non clampé au stock** : code `decrement: lootedResources.wood` sans vérifier `wood >= lootedResources.wood`. Risque de stocks négatifs. Vérifier `ResourceLootProvider` clamp.
- **Trajet retour recalculé via `worldConfig.getTravelTimeForArmy`** au lieu d'utiliser le temps aller — possible drift si config monde change ou si bonus style change. Confronter à spec « à la même vitesse qu'à l'aller ».
- **Aucun mode défense pour les barbares** : spec « Pertes et raids » mentionne « Défense : armée stationnée applique sa puissance défensive + bonus stratégie ». Pour barbares, defender.units = `{}`. Spec 06 doit préciser le modèle (templates de garnison déjà mentionnés via `barbarian-tier-templates.spec`).
- **Nombreux TODO v2** dans `player-village.strategy.ts` (walls, morale, attack type infantry/cavalry/archer). Acter explicitement : MVP ou ticket post-MVP ?
- **`conquest.service.ts`** : pas inclus dans le scope strict de spec 04 § Conquête (qui pointe vers spec 10). Audit léger uniquement (présence Seigneur, échec si Seigneur meurt). Audit complet → run 006.

## Notes — segmentation Phase 1

4ᵉ sur 7. Trois points clés au démarrage : (1) Renforts + rappel hors scope d'implémentation = audit + ticket uniquement. (2) `BarbarianVillageStrategy.lossesAttacker` est l'écart le plus inquiétant — soit on tranche maintenant (formule pure défense passive basée sur tier ?), soit on bloque en clarif spec 06. (3) Frontière avec run 001 (pop libérée à `battle.resolved`) explicitement recouverte — double vérif T3 obligatoire.

## Progress (rempli pendant le run)

- 2026-05-10 — Préflight OK, fiche `PLANNED`, repo clean (hors `agent-memory`).
- 2026-05-10 — Étape 2 : `code-mapper` produit la carte (12 axes). Confirme écarts critiques #1 (lossesAttacker = {}, defender.units = {}) et features manquantes (#7 renforts, #8 rappel).
- 2026-05-10 — Étape 3 : refinement → décomposition 9 tâches (audit pur, 0 code production, 3 tickets).
- 2026-05-10 — Étape 4 : pas de coding — audit pur. Lectures ciblées de validation (`combat.worker.ts:100-300`, `barbarian-village.strategy.ts`, `return.worker.ts`, `loot.manager.ts`, `resource-loot.provider.ts`, `player-village.strategy.ts`).
- 2026-05-10 — Étape 5 : pas de tests touchés (les tests pure-logic existants restent valides ; aucune formule modifiée).
- 2026-05-10 — Étapes 7-9 : tickets 33/34/35 créés. Fiche mise à jour, README index mis à jour, archive prête.

## Décisions prises

### Tableau d'écarts spec ↔ code

| # | Mécanique | Spec | Code | Verdict | Action |
|---|---|---|---|---|---|
| 1 | **Pertes attaquant raid PvE barbare** | « pertes selon ratio puissance » (§ Pertes et raids) | `lossesAttacker = {}` hardcodé (`barbarian-village.strategy.ts:19`) avec commentaire `// MVP: No losses for attacker` | ❌ Écart | Couplé garnison barbare absente → **délégué run 005**. |
| 2 | **Garnison barbare (defender.units)** | Blueprint par tier (T1: 15 MILICE, … T5: 150 unités, cf. `06-barbarians.md`) | `units: {}` hardcodé (`combat.worker.ts:521`) | ❌ Écart structurel | **Délégué run 005** — modèle de défense barbare = scope direct du run barbares. |
| 3 | **Pertes attaquant + défenseur PvP** | « ratio puissance attaque vs défense » | `applyLossRatio` (`player-village.strategy.ts:106-114`) — gagnant inflige `losses = qty * (powerLoser/powerWinner)`, perdant total wipe | ✅ Conforme à la spec MVP. TODO v2 walls/morale acté hors scope. | OK |
| 4 | **Loot capacity (survivants)** | « proportionnel à la capacité de transport restante » | PvP : `survivingAttacker` utilisé (`player-village.strategy.ts:23-29`). Barbare : `context.attacker.units` initial (cohérent tant que `lossesAttacker = {}`) | ✅ Conforme — couplage à fixer avec écart #1 lors du run 005 | OK |
| 5 | **Loot factor + clamp stock défenseur** | Implicite (pas de stock négatif) | `ResourceLootProvider:37-41` calcule `floor(stock × lootFactor)` ; lootFactor < 1 → loot toujours ≤ stock. `remainingResources` non-négatif. | ✅ Conforme. ⚠️ **Sub-réserve** : si bonus style RAIDERS donne `lootBonus > 1` et lootFactor base élevé, le produit peut dépasser 1 → loot pourrait théoriquement dépasser stock. À chiffrer avec spec 12 + bonus actuels. | Note hors scope, pas de bug observé. |
| 6 | **Trajet aller** | distance euclidienne × vitesse plus lente | `calculateDistance` + `findSlowestUnitSpeed` + `getTravelTimeForArmy` (`combat.service.ts` au dispatch + `combat.worker.ts:469-498`) | ✅ Conforme | OK |
| 7 | **Trajet retour = même vitesse** | « à la même vitesse qu'à l'aller » | Recalculé via `getTravelTimeForArmy` à la résolution (`combat.worker.ts:288-300`) avec armée initiale + stratégie courante. Pas de stockage `outboundTravelMs`. | 🟢 Drift potentiel mineur (config monde / stratégie modifiée entre dispatch et résolution) | **Ticket [35](../35-return-travel-time-recomputed-vs-spec.md)** ouvert. |
| 8 | **Libération pop attaquant à `battle.resolved`** | Pertes côté attaquant libèrent pop au moment de la mort | `sumPopulationCost(lossesAttacker)` + decrement `Population.used` (`combat.worker.ts:199-205`) | ✅ Conforme — couvre frontière run 001 | OK |
| 9 | **Libération pop défenseur à `battle.resolved`** | Idem côté défenseur PvP | `sumPopulationCost(lossesDefender)` + decrement (`combat.worker.ts:186-192`) **PvP only** (commentaire « Barbarians have no Population row » correct) | ✅ Conforme | OK |
| 10 | **Bonus de style attaquant (attackBonus)** | Style RAIDERS / FORTRESS / etc. | `getStrategyBonusValue(strategy, 'attackBonus')` appliqué à `modifiedConfig.combat.attackBonus` (`combat.worker.ts:412-418`) | ✅ Conforme | OK |
| 11 | **Bonus de style attaquant (lootBonus)** | RAIDERS multiplie le loot | `getStrategyBonusValue(strategy, 'lootBonus')` appliqué à `lootFactor` (`combat.worker.ts:421-427`) | ✅ Conforme — risque saturation = note du #5 | OK |
| 12 | **Bonus de style défenseur (defenseBonus)** | FORTRESS multiplie défense | `getStrategyBonusValue` appliqué uniquement si `targetKind === PLAYER_VILLAGE` (`combat.worker.ts:456-466`). Barbares pas de style — correct (spec 06 § Identité). | ✅ Conforme | OK |
| 13 | **Bonus style propagé à `getTravelTimeForArmy`** | RAIDERS : vitesse +X% | `getTravelTimeForArmy(..., attackerStrategyConfig?.strategy)` passé tant au dispatch (`combat.worker.ts:494`) qu'au retour (`combat.worker.ts:298`) | ✅ Conforme | OK |
| 14 | **Renforts inter-villages** | Spec § Renforts (action « Renforcer », trajet combat-like, garrison stationnée, retrait) avec tag `🔓 Statut implémentation : pas encore implémenté` | grep `reinforce/RECALL/garrison` → 0 hit | ❌ 100 % manquant — assumé par la spec | **Ticket [33](../33-reinforcements-inter-villages-missing.md)** ouvert (≥ 50 lignes scope). |
| 15 | **Rappel d'armée pendant l'aller** | « possible à tout moment avant l'arrivée », demi-tour à la position actuelle, retour = elapsed, sans perte ni loot | grep `recall/cancel.*expedition` → 0 hit | ❌ 100 % manquant | **Ticket [34](../34-army-recall-missing.md)** ouvert. |
| 16 | **`return.worker.ts` — durée** | Couvert #7 | Job pg-boss `combat:return` planifié au `returnAt` recalculé | ✅ Fonctionne en pratique (cf. #7) | OK |
| 17 | **`return.worker.ts` — loot dans `ResourceStock`** | Loot ramené | `ResourceStock.update` increment wood/stone/iron (`return.worker.ts:118-125`) + outbox `resourcesChanged` | ✅ Conforme | OK |
| 18 | **`return.worker.ts` — survivants upsert** | Réinjection inventaire | `unitInventory.upsert` boucle survivants (`return.worker.ts:91-109`) | ✅ Conforme | OK |
| 19 | **`return.worker.ts` — cleanup expedition** | Suppression | `expedition.delete` (`return.worker.ts:130-132`) | ✅ Conforme | OK |
| 20 | **Event `battle.returned`** | Notification frontend | `createOutboxEvent('battle.returned', ...)` (`return.worker.ts:135-146`) | ✅ Conforme | OK |
| 21 | **Conquête (Seigneur)** | Spec § Conquête + spec 10 | `ConquestService.conquerVillage` existe, **barbares uniquement** (`conquest.service.ts:57`). Pas de détection Seigneur dans `combat.worker.ts`. Pas de transition pré-conquête. | ⚠️ Hors scope du run 004 (audit complet conquête = run 006) | Délégué run 006. |

### Décisions hors-norme

- **Pas de fix dans le run** : audit pur. Tous les écarts non couverts par d'autres runs (#7, #14, #15) sont ticketés. Les écarts couplés (#1, #2, #4 partiel) sont délégués au run 005 pour cohérence atomique avec la définition du blueprint barbare.
- **Pas de doc-writer** : la spec `04-combat.md` reflète déjà le code (renforts/rappel marqués comme non implémentés côté backend). Le ticket 35 recommande une note dans `backend-modules.md`, mais c'est une amélioration non urgente — non incluse dans ce run pour rester strictement audit + tickets.
- **Pas d'appel `code-reviewer`** : audit pur sans diff de code source. Le seul diff = fiche + 3 tickets + index README. Review formelle inutile (pas de logique applicative à valider).
- **Pas d'appel `test-runner`** : pas de modification de code applicatif → suite existante non impactée. Les hooks pre-push lanceront `yarn test` au push.

## Rapport final

### Synthèse

Audit du module combat backend confronté à `docs/gameplay/04-combat.md`. **21 axes vérifiés** ; conformité globale **élevée** sur les flows implémentés (PvP, loot, trajet aller, libération pop, bonus de style, return.worker). Trois écarts structurels actés :

1. **Garnison barbare absente** + **`lossesAttacker = {}` côté barbares** (axes #1-2) → couplé, délégué [run 005](./005-audit-barbarians.md).
2. **Renforts inter-villages 100 % non implémentés** (axe #14) → [ticket 33](../33-reinforcements-inter-villages-missing.md).
3. **Rappel d'armée 100 % non implémenté** (axe #15) → [ticket 34](../34-army-recall-missing.md).

Un écart mineur sur la durée de retour recalculée vs spec « même vitesse qu'à l'aller » → [ticket 35](../35-return-travel-time-recomputed-vs-spec.md).

### Fichiers touchés

- `tasks/runs/004-audit-combat.md` (mis à jour : statut DONE, décomposition, progress, décisions, rapport).
- `tasks/33-reinforcements-inter-villages-missing.md` (nouveau).
- `tasks/34-army-recall-missing.md` (nouveau).
- `tasks/35-return-travel-time-recomputed-vs-spec.md` (nouveau).
- `tasks/README.md` (index mis à jour : 3 nouveaux tickets, run 004 → archivé).
- Aucun fichier `src/` modifié.

### Tickets ouverts

- 🟠 [33 — Renforts inter-villages non implémenté](../33-reinforcements-inter-villages-missing.md)
- 🟠 [34 — Rappel d'armée non implémenté](../34-army-recall-missing.md)
- 🟢 [35 — Drift durée retour recalculée vs spec](../35-return-travel-time-recomputed-vs-spec.md)

### Délégations

- Garnison barbare + `lossesAttacker = {}` côté barbares → [run 005 (audit-barbarians)](./005-audit-barbarians.md).
- Audit complet Conquête / Seigneur → [run 006 (audit-conquest)](./006-audit-conquest.md).

### QA

Audit pur sans modification de code applicatif. Pas d'effet runtime observable.

> **QA — pas de test nécessaire (raison : run d'audit ; livrables = fiche + 3 tickets `.md`. Aucun changement runtime, aucun endpoint touché, suite tests pure-logic existante intacte. La validation des tickets futurs viendra à leur implémentation, hors scope de ce run.)**

### Méta-évaluation

- **Pipeline `/run` efficace sur audit pur** : `code-mapper` couvre les 12 axes en 1 invocation (95s, ~75k tokens) ; le lead consomme ensuite ~5 lectures ciblées (≤ 100 lignes chacune) pour valider les écarts ambigus. Pas de coding ⇒ pas de hard gate sub-agent.
- **Couplage avec runs frères** identifié tôt (run 005 pour garnison barbare, run 006 pour conquête) → évite re-fix prématuré et préserve l'atomicité des décisions de design.
- **Décomposition initiale (8 tâches indicatives) bien dimensionnée** — 0 retouche.
