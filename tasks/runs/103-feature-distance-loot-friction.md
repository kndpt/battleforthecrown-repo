# Run #103 — feature-distance-loot-friction

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap directe — promotion lab ticket 04. Affinité Phase 12 « Ajouts mineurs MVP » (ajout isolé sans impact sur les boucles principales). Câlage Phase 12 vs post-MVP à acter par le lead en étape 3 `$bftc-run`.
- **Spec source** : `docs/gameplay/lab/tickets/04-distance-logistics.md` (stade idée, 4 points ouverts). Ce run tranche **une seule friction MVP** : capacité de loot (pillage uniquement) réduite au-delà d'un rayon. Promotion en spec canonique recommandée (voir Décomposition T5).
- **Type** : feature
- **Modules** : backend `combat/loot` | frontend `features/combat` | shared `logic` + `world/schemas` | seed + docs

## Dépendances

- Aucune bloquante. La fondation loot capacitaire (`sumCarryCapacity` → `loot.manager.ts`) est déjà en place.
- Foundation connexe (à ne pas confondre / hors scope) : run 050 (caravane — le pillage NE passe PAS par `getCaravanResourceCapacity`), runs 040/035 (temps de trajet/retour — **non touchés**), run 052 (rapports — le malus doit rester lisible via `metadata.cappedByCapacity`).

## Critère de fin (acceptance)

- [ ] [auto — spec] `lootDistanceFactor(d ≤ R)` === `1.0` exactement (unit test shared).
- [ ] [auto — spec] `lootDistanceFactor(d ≫ R)` === `floor`, jamais `< floor`, jamais `0` (unit test shared).
- [ ] [auto — spec] Décroissance monotone stricte entre `R` et le plateau `floor` (unit test shared).
- [ ] [auto — backend] `loot.manager` : à `d > R`, capacité totale utilisée ≤ `Math.floor(sumCarryCapacity × factor)` (règle d'arrondi **unique** — `Math.floor`, alignée sur `getCaravanResourceCapacity` — partagée par helper shared, backend, front et fixtures) ; à `d ≤ R`, résultat **identique** au comportement actuel (non-régression) (`loot.manager.spec.ts`).
- [ ] [auto — grep/diff] Aucune modif du calcul temps de trajet/retour (`travel-time.ts`, `return.worker.ts` inchangés hors imports). Renfort (`reinforce`) et conquête (`noble`/`pendingConquest`) ne consomment **jamais** le facteur.
- [ ] [auto — front] `AttackDetailModal` (modal partagé) : le facteur, la capacité réduite et le badge malus sont calculés/affichés **uniquement en mode pillage/raid** ; en mode renfort et en mode conquête, **aucun** malus affiché ni calculé (tests des 2 modes).
- [ ] [auto — backend] Réconciliation serveur : le loot final canonique est produit server-side par `loot.manager` avec `metadata.cappedByCapacity` cohérent (lisible dans le rapport de combat, run 052), publié via l'event Outbox de combat existant ; le client invalide/refetch après la mutation (aucune dérive preview ↔ état canonique).
- [ ] [auto — SQL/curl] `seed-default-world-config` applique la section config ; `GET /worlds/:id/config` renvoie le bloc distance-loot.
- [ ] [auto — static] `yarn static-check` + `test:backend` + `test:pixi` verts.
- [ ] [visuel — Kelvin] Cible **de pillage** au-delà de `R` : `AttackDetailModal` affiche une capacité de loot réduite + libellé du malus, mis à jour au changement de cible/unités.
- [ ] [visuel — Kelvin] Cible **de pillage** sous `R` (et toute cible en mode renfort/conquête) : aucun malus affiché, capacité de transport identique à aujourd'hui.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`
- Points d'insertion confirmés : `loot.manager.ts:26` (`sumCarryCapacity` → `totalCapacity`), `resource-loot.provider.ts:51-60` (répartition proportionnelle), `combat-context.interface.ts:15-18` (`CombatConfig._distance`), `combat.worker.ts:1166` (`_distance: distance` via `calculateDistance`), `world/schemas.ts:108-112` (`CombatRulesSchema`), `AttackDetailModal.tsx:124/141/497`.

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T5 (EN TÊTE) — Docs/spec** : promouvoir le lab ticket 04 en spec canonique `docs/gameplay/28-distance-loot-friction.md` (la mécanique devient un invariant durable et le run backprop dessus). Acter : **pillage seul**, **distance brute** attaquant→cible, **plancher non nul**, **paramétrable WorldConfig**, tension pivot compressed-async (spec 23) comme garde-fou de calibrage. Lier depuis `04-combat.md` + ligne roadmap. Les 3 autres pistes du lab (retour, coût préparation, conquêtes/renforts) restées **hors scope**.
- **T1 — Shared** : helper pur `lootDistanceFactor(distance, cfg): number` (`packages/shared/src/logic/`) + section config sur `WorldConfigSchema` (`radius`, `slope`/`floor`) + defaults exportés + index + `*.spec.ts`. Source de vérité unique réutilisée backend ET front.
- **T2 — Backend** : appliquer le facteur dans `loot.manager.ts:26` (`Math.floor(totalCapacity × lootDistanceFactor(context.config._distance, context.config))`) ; ajuster `metadata` ; `loot.manager.spec.ts` (`d ≤ R` → ×1, `d > R` → dégressif, plancher).
- **T3 — Seed/fixtures** : `prisma/seed-default-world-config.sql` + `combat-fixtures.ts` alignés (aucune migration Prisma — config JSON).
- **T4 — Frontend** : `AttackDetailModal.tsx` affiche la capacité de loot effective post-malus + badge/malus visible avant envoi, réutilise le helper shared. **Conditionner strictement au mode pillage/raid** (le modal est partagé attaque/renfort/conquête — pas de malus fictif en renfort/conquête).

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : requise — modifie la résolution loot server-authoritative (invariant économique anti-snowball) ; risque de fuite du malus vers conquêtes/renforts/retour et de dérive front↔back si le facteur n'est pas partagé.
- **Tests automatisés** : shared (`lootDistanceFactor`) + `loot.manager.spec.ts` (non-régression `d ≤ R`) + static-check.
- **Tests IG user** : checklist Kelvin (pré-affichage malus `AttackDetailModal` au-delà / sous le rayon).
