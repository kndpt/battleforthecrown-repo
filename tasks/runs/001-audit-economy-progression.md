# Run #001 — audit-economy-progression

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (cf. [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md))
- **Spec source** : [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) (intégralité)
  - § Ressources (production passive, capacité, conquête/reset)
  - § Population (par village, source Moulin, libération sur mort/destruction)
  - § Couronnes (production, dépenses, taxes)
  - § Paliers de déblocage Château (cohérence avec `03-buildings`)
  - § Formules de progression
- **Type** : `audit`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/resources/`
  - `battleforthecrown-backend/src/modules/population/`
  - `battleforthecrown-backend/src/modules/crowns/`
  - `battleforthecrown-backend/src/modules/gameplay/upgrade-building.use-case.ts`
  - `battleforthecrown-backend/src/modules/gameplay/recruit-troops.use-case.ts`
  - `battleforthecrown-backend/src/modules/combat/conquest.service.ts`
  - `battleforthecrown-backend/src/modules/world/world-config.service.ts`
- **Modules frontend** : —
- **Modules transverses** : `packages/shared/src/logic/`, `packages/shared/src/resources/`, `packages/shared/src/village/`

## Dépendances

- Aucune. Run autonome (run 000 `power` DONE et hors chemin critique).

## Critère de fin (acceptance)

- [ ] Invariants extraits de la spec 02 (un par règle vérifiable : production = f(niveau), reset conquête = ressources à 0 / pop recalculée du Moulin hérité, libération pop sur mort à `battle.resolved`, etc.).
- [ ] Tableau de confrontation spec ↔ code produit (chaque écart : citation spec + citation code + sévérité).
- [ ] Pour chaque écart < 50 lignes : fix appliqué dans la même run.
- [ ] Pour chaque écart ≥ 50 lignes : ticket créé dans `tasks/` (numérotation continue).
- [ ] Tests pure-logic vérifiés sur les formules pures (production rate, storage cap, pop max via Moulin) — ajout uniquement si manquant, conforme à `.claude/rules/tests.md` (aucun mock Prisma, aucun mock-théâtre).
- [ ] `yarn workspace battleforthecrown-backend test` passe vert.
- [ ] Doc `docs/gameplay/02-economy-and-progression.md` reste cohérente après fix ; `docs/architecture/backend-modules.md` § resources/population/crowns alignée si endpoint changé.
- [ ] Commit final au format `<type>(<scope>): <subject>` avec section QA dans le message.
- [ ] Section `## Rapport final` remplie dans cette fiche.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

Pré-décomposition indicative (8 tâches) que le lead affinera à l'étape 3 :

- T1 — Lire spec 02 intégralement et extraire invariants vérifiables (production, capacité, population par village, libération pop, reset conquête, formules).
- T2 — Cartographier `resources.service.ts`, `population.service.ts`, `crowns.service.ts`, `world-config.service.ts` ; lister entrées/sorties et callers externes.
- T3 — Confronter spec ↔ code en tableau (1 ligne par invariant) ; produire la liste des écarts avec sévérité.
- T4 — Fixer chaque écart < 50 lignes (probablement : constantes désalignées, libération pop incomplète sur certains chemins, edge cases conquête).
- T5 — Ouvrir un ticket par écart ≥ 50 lignes (formules de coûts, refonte conquête reset, etc.).
- T6 — Vérifier les tests pure-logic existants sur les formules ; ajouter ceux manquants (sans mock Prisma).
- T7 — `yarn workspace battleforthecrown-backend test` vert.
- T8 — Mettre à jour les docs si fix touche surface API/data model (vérifier non-duplication, cf. `.claude/rules/docs.md`).

## Points d'attention

- **§ Couronnes** : pas encore lue en détail au planning. Vérifier qu'il existe bien un service/cron de production de couronnes côté backend (mention spec : « revenu en couronnes dépend de la puissance cumulée »).
- **§ Population — libération à `battle.resolved`** (immédiate, pas au retour) : point de régression classique, à confronter sérieusement à `combat.worker.ts` et `return.worker.ts`.
- **§ Conquête et reset** : ressources reset à 0 / pop recalculée du Moulin hérité — vérifier `conquest.service.ts` (déjà touché par fix barbarian récent, cf. commit `e84436f`). Risque d'overlap avec audit spec 10/13.
- **§ Formules en fin de doc** : vérifier que les formules pures vivent bien dans `packages/shared/` et ne sont pas dupliquées côté backend.
- **Overlap connu avec ticket 30** (Salle du Conseil) — cet audit ne re-traite pas ce ticket, mais la § Paliers Château de spec 02 peut le mentionner.

## Notes — segmentation Phase 1

Phase 1 est globalement LARGE. Découpée en 7 sous-runs, ce run en est le 1ᵉʳ. Sous-runs à créer ensuite via `/plan-run`, dans cet ordre suggéré :

1. **001** audit-economy-progression (spec 02) ← **ce run**
2. **002** audit-buildings (spec 03) — overlap probable avec ticket 30 (Salle du Conseil)
3. **003** audit-units (spec 08) — catalogue stats/passifs/poids
4. **004** audit-combat (spec 04) — résolution, raids, renforts (renforts mentionnés « pas encore implémenté côté backend » dans la spec → probablement gros écart à ticketer)
5. **005** audit-barbarians (spec 06) — blueprint d'armée par tier, régénération
6. **006** audit-conquest (spec 10) — Seigneur, Salle du Trône, cas particuliers ; débloque Phase 5
7. **007** audit-barbarian-spawning (spec 07) — spec en chantier : décider en début de run si on finalise la spec ou si on acte le report explicitement (cf. roadmap § Cas particulier).

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, QA résiduelle qui revient à toi, méta-évaluation si applicable.)_
