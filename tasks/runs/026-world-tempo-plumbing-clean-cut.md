# Run #026 — world-tempo-plumbing-clean-cut

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — chantier transverse pré-MVP (pivot tempo, cf. [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md))
- **Spec source** : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) — § 5 (`WorldConfig.tempo`), § 6 (invariants), § 8 (migration cadre)
- **Type** : feature + refacto (clean cut sans alias rétro-compat)
- **Modules backend** : `world`, `combat`, `resources`, `gameplay` (recruit-noble, recruit-troops), `crowns`, `strategy` (BarbarianRuntimeService à localiser)
- **Modules frontend** : aucun (consomme l'effectif via API/WS)

## Dépendances

- Aucun run préalable. La spec 23 est ✅ tranchée MVP.
- Postcondition : débloque le Run 027 (recalibration des valeurs absolues à `tempo.global = 1.0`).

## Critère de fin (acceptance)

- [ ] `WorldConfig.gameSpeed` et `WorldConfig.economy.productionRate` n'existent plus dans le code, ni dans les schémas Zod (`packages/shared/src/world/schemas.ts`).
- [ ] `WorldConfig.tempo` exposé avec structure `{ global: number, overrides?: {...} }` conforme à § 5.1 de la spec.
- [ ] `TempoService` (shared) expose `applyDuration(absolute, axis)` (× tempo) et `applyRate(absolute, axis)` (÷ tempo). Aucun callsite backend ne manipule l'opérateur `× / tempo` à la main.
- [ ] Test pure-logic par axe : à `tempo.global = 1.0` sans override → snapshot reproduit les valeurs équivalentes à l'ancien `gameSpeed = 1 / productionRate = 1`. À `tempo.global = 0.5` → durations × 0.5 ET rates × 2. Override sur 1 axe surcharge le global pour cet axe uniquement.
- [ ] Régen barbare branchée sur `tempo.barbarianRegen` (callsite à localiser via `code-mapper`, probablement `BarbarianRuntimeService`).
- [ ] Couronnes : `crowns.service.ts` applique `puissance × 0.05 / tempo.crownsYield` (axe débit).
- [ ] Smokes backend verts (`combat-attack`, `recruit-noble`, `combat-conquest-hook`) après migration de `smoke-world-config.ts` vers `tempo`.
- [ ] `yarn static-check` vert.
- [ ] Aucun chiffre absolu modifié dans `docs/gameplay/02/03/06/10/13/14` — la recalibration est explicitement déléguée au Run 027.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] <comportement attendu observable> — preuve : <test auto / smoke / curl / SELECT / capture>
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : tests bout-en-bout manuels exécutés par l'agent quand pertinent (`server + curl`, REST, WebSocket, worker/job, ou `SELECT` DB), avec résultat observable. Si non fait, `Non nécessaire` ou `Non exécuté` + raison précise.
- **Tests IG à faire par le user** : seulement ce qui demande une appréciation gameplay/visuelle, un vrai navigateur humain, ou un scénario trop coûteux à automatiser ; checklist observable. Sinon `Aucun test IG nécessaire`, raison.

## Points d'attention

- ⚠️ **Régen barbare** : la spec § 8.4 dit que le callsite **n'est pas identifié** à la rédaction (« probablement dans `BarbarianRuntimeService`, à confirmer en début de run »). L'étape `code-mapper` doit le localiser explicitement et le reporter dans `## Décisions prises`.
- ⚠️ **Couronnes** : vérifier qu'il n'existe pas un gate `if (production > 0)` qui masquerait un bug d'unités (cf. ticket archivé [`07`](../archive/07-crown-production-event-gate.md)).
- ⚠️ **Clean cut sans alias** : tous les `World.config` JSON en DB locale ont l'ancien schéma. Migration Prisma JSON-patch ou seed-reset selon préférence — pas de prod en jeu, on peut être brutal.
- ⚠️ **ADR-12** mentionnée par la spec (`docs/architecture/decisions.md § ADR-12`) — vérifier si rédigée ou à créer pendant l'étape 9 (`doc-writer`).
- ⚠️ **Convention sémantique** : `tempo < 1 = jeu plus rapide` est l'inverse de l'ancien `gameSpeed > 1 = jeu plus rapide`. Le `TempoService` doit appliquer l'opérateur correct **par axe** (durations × ; rates ÷). Couverture test obligatoire.
- ⚠️ **Frontend invariant** : aucun calcul propre. Si une consommation directe d'une valeur absolue est détectée côté pixi, c'est un bug pré-existant à ticketer séparément (pas dans ce run).

## Liens

- Spec : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md)
- Tickets archivés remplacés : [`05-world-config-multipliers-semantics`](../archive/05-world-config-multipliers-semantics.md), [`52-conquest-capture-time-speed-multiplier`](../archive/52-conquest-capture-time-speed-multiplier.md)
- Run suivant : [`027-world-tempo-recalibrate-mvp-constants`](./027-world-tempo-recalibrate-mvp-constants.md) (recalibration, dépend de ce run)
