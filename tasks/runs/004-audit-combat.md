# Run #004 — audit-combat

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

- [ ] Tableau d'écarts spec ↔ code couvrant : (a) résolution PvE barbares, (b) résolution PvP, (c) calcul du loot et capacité de transport, (d) trajet aller (vitesse unité la plus lente, distance euclidienne), (e) trajet retour (durée = aller, loot ramené, troupes ré-injectées), (f) libération de population, (g) bonus de style attaque/défense/loot, (h) renforts inter-villages, (i) rappel d'armée pendant l'aller.
- [ ] Invariant `battle.resolved` libère la population de l'attaquant ET du défenseur (PvP) **au moment de la résolution**, pas au retour. Confirmé par lecture de `combat.worker.ts` et validé explicitement.
- [ ] **`BarbarianVillageStrategy.lossesAttacker`** : écart documenté entre spec (« pertes selon le ratio puissance ») et code actuel (`{}` hardcodé, commentaire « MVP: No losses for attacker »). Ticket dédié ouvert OU décision de report explicite avec justification design.
- [ ] **Renforts inter-villages** : 100 % non implémenté → un ticket dédié unique (≥ 50 lignes estimées) listant le scope complet (action « Renforcer », modèle DB garrison, durée trajet, rappel, libération pop côté A, retrait B→A, exclusion fenêtre conquête). **Hors scope d'implémentation de ce run.**
- [ ] **Rappel d'armée pendant l'aller** : audit présence/absence de l'endpoint et du flow. Si absent, ticket dédié.
- [ ] Tous les écarts sont soit fixés en lots chirurgicaux dans ce run, soit ticketés (pour le run lui-même ou en backlog) — aucun écart laissé non-tracé.
- [ ] Tests pure-logic existants restent verts ; nouveaux tests pure-logic ajoutés uniquement si une formule pure est touchée (anti-pattern : pas de spec sur worker/service/controller).
- [ ] `yarn workspace battleforthecrown-backend test` vert.
- [ ] Section docs vérifiée : alignement entre `docs/gameplay/04-combat.md`, `docs/architecture/backend-modules.md` § Combat, et le code.
- [ ] Section `## Rapport final` remplie + commit final `<type>(<scope>): <subject>` + QA.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

Pré-décomposition indicative (8 tâches) :

- T1 — Lecture exhaustive : `combat.service.ts`, `combat.worker.ts`, `return.worker.ts`, `conquest.service.ts`. Construire le tableau d'écarts spec ↔ code (1 ligne / mécanique : raid PvE, raid PvP, loot, trajet aller, trajet retour, pop, style, renforts, rappel, conquête).
- T2 — Audit `BarbarianVillageStrategy` : confronter `lossesAttacker = {}` à la spec « pertes selon ratio puissance ». Soit fix dans le run (réutilisation formule défense passive village barbare), soit ticket explicite si « défense passive barbare » non tranchée par spec 06.
- T3 — Audit invariant population : confirmer `sumPopulationCost` + decrement `Population.used` au moment `battle.resolved` côté attaquant ET défenseur (PvP), pas dans `return.worker.ts`. Régression critique mentionnée run 001.
- T4 — Audit bonus de style : vérifier `getStrategyBonusValue` appelé pour attackBonus, defenseBonus, lootBonus côté attaquant et defenseBonus côté défenseur. Confirmer absence côté barbares (pas de style sur village barbare). Vérifier propagation `getTravelTimeForArmy`.
- T5 — Audit loot capacity : vérifier que `survivingAttacker` est utilisé pour le calcul de capacité (pas l'armée initiale) — conforme dans `player-village.strategy.ts`, à confirmer pour `BarbarianVillageStrategy` (utilise `context.attacker.units` initiaux — écart potentiel si on ajoute des pertes en T2).
- T6 — Audit `return.worker.ts` : confirmer (a) durée retour = durée aller, (b) loot ramené dans `ResourceStock`, (c) survivants ré-injectés via upsert, (d) expedition supprimée, (e) event `battle.returned` émis.
- T7 — Ticket renforts (≥ 50 lignes) : créer un ticket dédié dans `tasks/` détaillant le scope complet (modèle DB, endpoint, worker arrival, garrison, retrait, fenêtre conquête, libération pop). **Hors scope d'implémentation ce run.**
- T8 — Audit rappel armée : grep `recall` / endpoint absent → ticket dédié pour implémentation (modèle : transition `EN_ROUTE` → `RETURNING` à demi-tour, départure = position actuelle, retour = elapsed).

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

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage.)_

## Rapport final

_(Vide au démarrage.)_
