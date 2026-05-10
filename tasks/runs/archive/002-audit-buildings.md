# Run #002 — audit-buildings

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (cf. [`../00-mvp-roadmap.md`](../00-mvp-roadmap.md)). 2ᵉ sous-run sur 7 (suit [`001-audit-economy-progression`](./001-audit-economy-progression.md)).
- **Spec source** : [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md) (intégralité)
  - § Vue d'ensemble (catalogue 12 bâtiments + statut MVP)
  - § Mécanique de construction (file, population, annulation, bonus Château)
  - § Mécanique de progression (niveaux 1–5 / 6–10 / >10 post-MVP)
  - § Bâtiment par bâtiment : Château, Camp de bûcherons, Carrière, Mine de fer, Entrepôt, Moulin, Caserne, Tour de guet, Rempart (désactivé MVP), Cachette (désactivée MVP), Salle du Conseil, Salle du Trône
  - Renvois : [`02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) § Paliers Château ; [`09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md) § Système de poids ; [`12-village-styles.md`](../../docs/gameplay/12-village-styles.md) (Salle du Conseil) ; [`10-conquest.md`](../../docs/gameplay/10-conquest.md) § Le Seigneur (Salle du Trône)
- **Type** : `audit`
- **Modules backend** :
  - `battleforthecrown-backend/src/modules/village/dto/upgrade-building.dto.ts`
  - `battleforthecrown-backend/src/modules/gameplay/upgrade-building.use-case.ts`
  - `battleforthecrown-backend/src/modules/world/world-config.service.ts`
  - `battleforthecrown-backend/src/modules/world/vision.service.ts` (Watchtower)
  - `battleforthecrown-backend/src/modules/world/join-world.use-case.ts` (initial buildings)
  - `battleforthecrown-backend/src/workers/construction.worker.ts` (à confirmer en cartographie)
  - `battleforthecrown-backend/prisma/schema.prisma` (modèle `Building` polymorphe sur `type: string`)
- **Modules frontend** : — (audit backend ; impacts UI éventuels → tickets de suivi)
- **Modules transverses** :
  - `packages/shared/src/village/buildings.ts` (`BUILDING_TYPES`, `BUILDING_DEFINITIONS`, `BUILDING_UNLOCK_REQUIREMENTS`, `CASTLE_CONSTRUCTION_SPEED_BONUS`, `WATCHTOWER_VISION_LEVELS`, `MAX_CONSTRUCTION_QUEUE`)
  - `packages/shared/src/power/weights.ts` (`BUILDING_POWER_WEIGHTS`, `DEFAULT_BUILDING_POWER_WEIGHT`)
  - `packages/shared/src/logic/` (`calculateBuildingCost` et helpers consommateurs)
  - `packages/shared/src/resources/` (`getWarehouseStorageLimit`, `ResourceBuildingType`)

## Dépendances

- **Run 001** [`audit-economy-progression`](./001-audit-economy-progression.md) : pas bloquant techniquement, mais § Paliers Château recouvre les deux specs. Recommandation : démarrer 002 **après** 001 pour éviter le double-touche. Si parallélisation : 002 garde la main exclusive sur `packages/shared/src/village/buildings.ts` ; 001 ne touche que helpers production/storage/farm-pop.
- **Ticket 30** [`30-power-council-hall-missing.md`](../30-power-council-hall-missing.md) : à **résoudre dans ce run**, pas en dépendance externe.
- **Run 000** (DONE, archivé) : a déjà calé les poids des 10 bâtiments existants. Ce run **consomme** ce travail, ne le refait pas. Référence : [`runs/archive/000-pilote-audit-power.md`](./archive/000-pilote-audit-power.md) § Rapport final.

## Critère de fin (acceptance)

- [ ] Tableau de confrontation spec ↔ code **exhaustif** : 1 ligne par bâtiment du catalogue spec 03 (12 lignes, aucun bâtiment omis y compris Wall et Hideout désactivés MVP). Colonnes : `Bâtiment | Présent code | Coûts/Temps OK | Unlock Château OK | Effet/Bonus par niveau OK | Statut MVP (enabled) OK | Power weight OK | Sévérité écart`.
- [ ] **Ticket 30 résolu** : Salle du Conseil créée côté shared (`BUILDING_TYPES` + `BUILDING_DEFINITIONS` niveau 1 unique + `BUILDING_UNLOCK_REQUIREMENTS:4` + `BUILDING_POWER_WEIGHTS:25`). Ticket 30 marqué résolu dans `tasks/` après ce run, ou re-segmenté en sous-tickets si la résolution dépasse 50 lignes.
- [ ] **Salle du Trône** (`THRONE_HALL`) ajoutée à l'enveloppe shared (catalogue + poids 35 + unlock Château 6). Mécanique métier (recrutement Seigneur) explicitement laissée à run 006 audit-conquest, documentée par TODO référencé.
- [ ] Pour chaque écart < 50 lignes : fix appliqué dans la même run.
- [ ] Pour chaque écart ≥ 50 lignes : ticket créé dans `tasks/` (numérotation continue).
- [ ] Mécanique de construction confrontée : file (`MAX_CONSTRUCTION_QUEUE`), bonus Château vitesse, annulation = remboursement complet ressources + population. Écarts ticketés ou fixés.
- [ ] Tests pure-logic vérifiés sur helpers shared : `getBuildingDefinition`, `getBuildingMaxLevel`, `getBuildingUnlockRequirement`, `isBuildingEnabled`, `getBuildingPowerWeight`, `CASTLE_CONSTRUCTION_SPEED_BONUS`, `WATCHTOWER_VISION_LEVELS`, `calculateBuildingCost`. Ajout uniquement si manquant. Conformes à `.claude/rules/tests.md` (pure-logic, aucun mock Prisma, aucun mock-théâtre).
- [ ] Tests pure-logic ajoutés pour Council Hall et Throne Hall : `getBuildingMaxLevel === 1`, unlock Château correct, poids = 25 / 35, `isBuildingEnabled === true`.
- [ ] `yarn workspace battleforthecrown-backend test` vert.
- [ ] `yarn workspace @battleforthecrown/shared build` vert (compilation TypeScript après ajout des 2 nouveaux types).
- [ ] `docs/gameplay/03-buildings.md` reste source unique du catalogue (pas de duplication — cf. `.claude/rules/docs.md`). Si `docs/architecture/backend-modules.md` mentionne le module village, passer par référence vers la spec, pas par recopie.
- [ ] Section `## Rapport final` remplie : tableau de confrontation final, écarts résolus, tickets ouverts (numéros), fichiers touchés, QA résiduelle.
- [ ] Commit final au format `<type>(<scope>): <subject>` (EN) avec section QA hybride (backend vérifié par l'agent + checklist user IG si surface observable touchée).

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décomposition initiale (rempli par le lead à l'étape 3)

Décomposition arrêtée par le lead après cartographie + clarifications user :

- **T1 — Catalogue Council/Throne Hall** : `packages/shared/src/village/buildings.ts` — ajouter `COUNCIL_HALL` et `THRONE_HALL` dans `BUILDING_TYPES`, `BUILDING_DEFINITIONS` (1 niveau unique chacun, coûts spec 03), `BUILDING_UNLOCK_REQUIREMENTS` (4 et 6). [implementer]
- **T2 — Poids puissance** : `packages/shared/src/power/weights.ts` — `COUNCIL_HALL: 25`, `THRONE_HALL: 35`. [lead, trivial]
- **T3 — Warehouse storage 10 niveaux** : `packages/shared/src/resources/storage.ts` — remplacer 5 niveaux 1000→1750 par 10 niveaux spec 3000→10570. [implementer]
- **T4 — Spec MAX_CONSTRUCTION_QUEUE** : `docs/gameplay/03-buildings.md` § Mécanique de construction — « 2 upgrades simultanés » → « 3 upgrades simultanés » (décision user). [lead, trivial]
- **T5 — Tests pure-logic** : créer `battleforthecrown-backend/src/modules/village/buildings.spec.ts` — Council Hall (max level 1, unlock 4, weight 25, enabled), Throne Hall (max level 1, unlock 6, weight 35, enabled), warehouse storage 10 niveaux exacts. [test-writer]
- **T6 — Review + tests + commit** : agent-skills:code-reviewer, fix findings, test-runner backend-unit + build shared, archivage fiche, commit final. [lead orchestre]

Pré-décomposition indicative (9 tâches) que le lead affinera à l'étape 3 :

- T1 — Lire spec 03 intégralement et extraire invariants vérifiables : 1 ligne par bâtiment × {présence, coûts/temps par niveau, unlock Château, effet par niveau, statut MVP, poids puissance}. Confirmer cohérence avec spec 09 § poids et spec 02 § Paliers.
- T2 — Cartographier le code : `BUILDING_TYPES`, `BUILDING_DEFINITIONS`, `BUILDING_UNLOCK_REQUIREMENTS`, `BUILDING_POWER_WEIGHTS`, `CASTLE_CONSTRUCTION_SPEED_BONUS`, `WATCHTOWER_VISION_LEVELS`, helpers `logic/`, modèle Prisma `Building`. Lister les callers (`upgrade-building.use-case`, `world-config.service`, `construction.worker`, `vision.service`, `join-world.use-case`). **Confirmer** le polymorphisme `Building.type: string` côté Prisma (pas d'enum DB → pas de migration nécessaire pour Council/Throne).
- T3 — Produire le tableau de confrontation exhaustif (12 lignes). Sortie courte ✓/✗ + sévérité par cellule, regroupée en synthèse écarts.
- T4 — Lot **bâtiments économiques** (Château, Camp de bûcherons, Carrière, Mine de fer, Entrepôt, Moulin) : fixer écarts < 50 lignes ; valider coûts/temps/effets à 100 % vs spec.
- T5 — Lot **bâtiments militaires/exploration** (Caserne, Tour de guet, Rempart désactivé, Cachette désactivée) : idem ; vérifier que les bâtiments désactivés MVP restent codés (catalogue source de vérité) mais bloqués via `isBuildingEnabled` côté guard `upgrade-building.use-case`.
- T6 — Lot **bâtiments spéciaux 1-niveau** (Salle du Conseil, Salle du Trône) — résolution du ticket 30 + enveloppe Throne Hall. Si > 50 lignes effectives, fragmenter :
  - T6a — `packages/shared/src/village/buildings.ts` : ajouter `COUNCIL_HALL` et `THRONE_HALL` dans `BUILDING_TYPES` et `BUILDING_DEFINITIONS` (1 seul niveau chacun). Coûts spec : Council 150/200/100/4pop/1000s ; Throne 1600/2400/1200/6pop/21600s. Ajouter `BUILDING_UNLOCK_REQUIREMENTS` (Council=4, Throne=6).
  - T6b — `packages/shared/src/power/weights.ts` : ajouter `COUNCIL_HALL: 25` et `THRONE_HALL: 35`.
  - T6c — `battleforthecrown-backend/src/modules/gameplay/upgrade-building.use-case.ts` : valider que la branche « bâtiment 1 niveau » refuse une 2ᵉ construction (utiliser `getBuildingMaxLevel === 1` comme guard). Ajouter validation Zod si DTO le permet.
  - T6d — Mécanique métier : créer/laisser des TODO référencés vers Phase 3 (style via Council Hall, run à venir spec 12) et Phase 5 (Seigneur via Throne Hall, run 006 audit-conquest spec 10). Ne **PAS** coder ces mécaniques ici.
  - T6e — Si UI consommatrice nécessaire (HUD bâtiment Council/Throne, bouton de build), ouvrir un ticket de suivi `frontend-buildings-council-throne-hall` plutôt que d'élargir le scope du run.
- T7 — Mécanique de construction transversale : confronter `MAX_CONSTRUCTION_QUEUE` (code = 3 vs spec « 2 par défaut »), bonus Château vitesse (table `CASTLE_CONSTRUCTION_SPEED_BONUS` vs spec § Bonus de vitesse), annulation (grep `cancel` côté backend, vérifier remboursement ressources + restitution population). Fixer ou ticketer selon taille.
- T8 — Tests pure-logic : auditer l'existant sur helpers shared, ajouter les manquants pour Council Hall et Throne Hall (max level 1, unlock, poids, enabled). Conforme à `.claude/rules/tests.md` (jamais de mock Prisma, asserter sur valeurs retournées, pas sur appels).
- T9 — `yarn workspace battleforthecrown-backend test` + build shared + section `## Rapport final` + QA hybride + commit.

## Points d'attention

- **`MAX_CONSTRUCTION_QUEUE`** : code = 3, spec 03 § Mécanique de construction = « 2 upgrades simultanés par défaut ». À trancher en clarification du lead : aligner le code sur la spec (passer à 2) ou aligner la spec sur le code (acter 3 par défaut). La spec dit « peut évoluer avec d'autres bâtiments » → est-ce que 3 anticipe une mécanique non documentée ?
- **Throne Hall — enveloppe ici, mécanique en run 006** : choix proposé en T6 (créer bâtiment + poids + unlock dans 002 ; recrutement Seigneur dans run 006 audit-conquest spec 10). À confirmer en clarification du lead. Le risque inverse (différer la création complète à 006) = laisser le poids 35 manquant côté code visible dans le tableau de confrontation sans le résoudre, ce qui contredit le critère « écart < 50 lignes = fixé dans le run ».
- **Polymorphisme `Building.type` côté Prisma** : à confirmer en T2 que c'est bien un `String` et non un enum Postgres. Si enum, ajouter Council/Throne nécessite une migration Prisma (à acter explicitement dans `Décisions prises`). Si String : pas de migration DB.
- **Power weights manquants masqués par fallback** : `DEFAULT_BUILDING_POWER_WEIGHT = 5` masque silencieusement toute entité absente côté code. Council Hall (25) et Throne Hall (35) tomberaient à 5 sans les ajouts T6b. Tester explicitement le poids exact dans T8 (pas se contenter de « > 0 »).
- **Bâtiments désactivés MVP** : Wall et Hideout sont codés mais `enabled: false`. Vérifier que le guard `isBuildingEnabled` est bien appelé côté `upgrade-building.use-case` (un bâtiment désactivé doit être inconstructible, pas seulement absent du catalogue UI). À tester en T5.
- **Overlap avec run 001 sur § Paliers Château** : la § Paliers de déblocage Château est dans la spec 02 ET 03. Convention : 001 confronte le côté économique, 002 confronte le côté catalogue/unlock. Si 001 a déjà couvert/refusé un point, l'acter dans `Décisions prises` plutôt que de re-trancher.
- **`getBuildingUnlockRequirement` non exhaustif** : le record actuel exclut `CASTLE` (cohérent : pas d'unlock pour le bâtiment racine), mais inclut `WALL` et `HIDEOUT` alors qu'ils sont `enabled: false`. Cohérence à vérifier — un bâtiment désactivé doit-il avoir une entrée d'unlock ? (Mon avis : oui, garder l'entrée, le blocage opérationnel se fait via `isBuildingEnabled`.)
- **Frontend explicitement hors scope** : tout impact UI (catalogue HUD, écran de choix de style, bouton Salle du Trône) doit faire l'objet d'un ticket de suivi, pas d'un fix dans ce run. Ne **PAS** élargir le scope sous prétexte qu'« il faudra bien que l'UI suive ».
- **Council Hall = bâtiment vecteur, pas effet** : la mécanique de choix de style (spec 12) n'est PAS dans le scope de ce run. Le run code uniquement le bâtiment ; le choix de style et son flux API/UI sont Phase 3 (run dédié à venir).
- **Risque double-tâche entre 002 et 006 sur Throne Hall** : si le lead choisit l'option « enveloppe ici, mécanique en 006 », documenter clairement dans `## Décisions prises` ce que 002 livre vs ce que 006 ajoutera, pour éviter que 006 retouche le catalogue.

## Notes — segmentation Phase 1

Phase 1 segmentée en 7 sous-runs. Ce run est le **2ᵉ**. Suite suggérée :

1. ~~**001** audit-economy-progression (spec 02)~~ — fiche écrite, 📋 PLANNED
2. **002** audit-buildings (spec 03) ← **ce run**
3. **003** audit-units (spec 08)
4. **004** audit-combat (spec 04)
5. **005** audit-barbarians (spec 06)
6. **006** audit-conquest (spec 10) — débloque Phase 5 ; reprendra la mécanique Seigneur après l'enveloppe Throne Hall posée ici.
7. **007** audit-barbarian-spawning (spec 07) — spec en chantier.

Si T6 dépasse 50 lignes effectives (probable avec tests + guard backend), suivre la fragmentation T6a-T6e plutôt que de gonfler le run au-delà de medium.

## Progress (rempli pendant le run)

- 2026-05-10 — Étape 0 : préflight OK (repo clean, fiche PLANNED, run 001 archivé, dépendances cohérentes).
- 2026-05-10 — Étape 1 : 2 clarifications user (MAX_QUEUE = 3, Throne Hall enveloppe ici).
- 2026-05-10 — Étape 2 : cartographie via code-mapper. Confirmation Council/Throne absents, MAX_QUEUE code = 3, warehouse = 5 niveaux 1000→1750.
- 2026-05-10 — Étape 3 : décomposition 5 tâches (T1-T5) + T6 review/commit. Statut → RUNNING.
- 2026-05-10 — Étape 4 : T1 (implementer, partial → STATUS partial à cause couplage build T1↔T2 légitime), T2 (lead Edit), T3 (lead Edit, 10 niveaux storage), T4 (lead Edit doc).
- 2026-05-10 — Étape 5 : T5 test-writer success, 18/18 tests verts, conforme `.claude/rules/tests.md` pure-logic.
- 2026-05-10 — Étape 6 : review `agent-skills:code-reviewer` → APPROVE WITH SUGGESTIONS. 2 majeurs traités (grep doc OK, backfill warehouse non requis), 1 mineur architecture → ticket 32 ouvert.

## Décisions prises

### Clarifications user (étape 1)

- **MAX_CONSTRUCTION_QUEUE** : aligner spec sur code (3). Justification user : le code = 3 doit être acté comme convention par défaut. Spec 03 § Mécanique de construction sera mise à jour (T4).
- **Throne Hall** : enveloppe ici (catalogue + poids 35 + unlock Château 6, niveau 1 unique). Mécanique de recrutement Seigneur (spec 10 § Le Seigneur) explicitement laissée à run 006 audit-conquest. Aucun TODO de code à poser : le bâtiment existe, la mécanique métier viendra dans 006 sans retoucher le catalogue.

### Décisions de cadrage (étape 3)

- **Pas d'ajout à `INITIAL_BUILDINGS`** (`join-world.use-case.ts:163-172`) : Council/Throne Hall créés lazy à la première construction via `upgrade-building.use-case.ts:150-158` (cohérent avec HIDEOUT/WALL également non seedés). Pas besoin de pré-seed niveau 0.
- **Polymorphisme Prisma confirmé** : `Building.type: String` (pas d'enum Postgres, cf. `prisma/schema.prisma:5`). Aucune migration DB nécessaire pour les nouveaux types.
- **Guards `upgrade-building.use-case.ts` cohérents pour bâtiments 1-niveau** : `getBuildingMaxLevel` retourne 1 → `nextLevel > maxLevel` bloque la 2ᵉ construction (ligne 88-91). `isBuildingEnabled` (61), `getBuildingUnlockRequirement` (70) déjà appelés. Aucune modif backend nécessaire.
- **DTO Zod `upgrade-building.dto.ts` auto-aligné** : `z.enum(Object.keys(BUILDING_TYPES))` → l'ajout T1 rend automatiquement Council/Throne acceptés par l'API.
- **Warehouse storage = écart majeur non couvert par run 001** : run 001 a validé que la production cap par `getStorageLimit` fonctionne, mais pas les valeurs absolues (1000 vs spec 3000, 5 niveaux vs 10). Fix dans T3 — sous le seuil 50 lignes.
- **Tests dans le workspace consommateur** : politique `tests.md` — `packages/shared/` n'a pas de runner propre. Tests ajoutés côté backend (`battleforthecrown-backend/src/modules/village/buildings.spec.ts`) qui consomme directement les helpers shared via import.

### Tableau de confrontation spec 03 ↔ code (étape 3)

| # | Bâtiment | Présent code | Coûts/Temps OK | Unlock Château | Effet/Bonus | Statut MVP | Power weight | Sévérité |
|---|---|---|---|---|---|---|---|---|
| 1 | CASTLE | ✅ | ✅ niv 1-10 | — (racine) | ✅ vitesse cum. ×0.96→×0.64 | ✅ enabled | ✅ 40 | — |
| 2 | WOOD | ✅ | ✅ niv 1-10 | ✅ 1 | ✅ table prod 50→1030/h | ✅ enabled | ✅ 15 | — |
| 3 | STONE | ✅ | ✅ niv 1-10 | ✅ 1 | ✅ idem WOOD | ✅ enabled | ✅ 15 | — |
| 4 | IRON | ✅ | ✅ niv 1-10 | ✅ 1 | ✅ idem WOOD | ✅ enabled | ✅ 15 | — |
| 5 | WAREHOUSE | ✅ catalogue | ✅ catalogue niv 1-10 | ✅ 1 | ❌ storage table = 5 niv (1000→1750) au lieu de 10 niv (3000→10570) | ✅ enabled | ✅ 20 | **majeure** → T3 |
| 6 | FARM | ✅ | ✅ niv 1-10 | ✅ 1 | ✅ pop cum. (run 001) | ✅ enabled | ✅ 25 | — |
| 7 | BARRACKS | ✅ | ✅ niv 1-10 | ✅ 2 | ✅ unlock unités (run 003) | ✅ enabled | ✅ 35 | — |
| 8 | WATCHTOWER | ✅ | ✅ niv 1-10 | ✅ 3 | ✅ vision +5/niv, niv 10 = ∞ | ✅ enabled | ✅ 30 | — |
| 9 | COUNCIL_HALL | ❌ absent | n/a | ❌ | n/a | ❌ | ❌ → fallback 5 | **majeure** → T1+T2 (résout ticket 30) |
| 10 | THRONE_HALL | ❌ absent | n/a | ❌ | n/a | ❌ | ❌ → fallback 5 | **majeure** → T1+T2 |
| 11 | WALL | ✅ | ✅ niv 1-10 | ✅ 5 | ✅ +5%/niv (table coûts présente, mécanique défense post-MVP) | ✅ disabled (correct MVP) | ✅ 38 | — |
| 12 | HIDEOUT | ✅ | ✅ niv 1-10 | ✅ 4 | ✅ table coûts présente | ✅ disabled (correct MVP) | ✅ 28 | — |

### Review findings (étape 6) — `agent-skills:code-reviewer`

**Verdict** : APPROVE WITH SUGGESTIONS. Aucun bloquant.

| # | Axe | Sévérité | Finding | Résolution |
|---|---|---|---|---|
| R1 | Correctness | majeur | Vérifier qu'aucune autre doc gameplay ne mentionne « 2 upgrades » ou « file d'attente 2 » désaligné | `grep -rn "file d'attente\|MAX_CONSTRUCTION\|upgrades simultan" docs/` → 1 seule occurrence, déjà fixée par T4. **Clos.** |
| R2 | Économie | majeur | `ResourceStock.maxPerType` figé en DB après warehouse 1000→3000, drift potentiel pour joueurs existants | **Non requis** : `resources.service.ts:153` — `maxPerType` est recalculé à chaque tick `updateProduction` via `getStorageLimit`. Self-healing au prochain tick. **Clos.** |
| R3 | Architecture | majeur | `unlockCastleLevel` (BUILDING_DEFINITIONS) ↔ `BUILDING_UNLOCK_REQUIREMENTS` : duplication, drift silencieux possible | **Hors scope run** : ticket [`32-buildings-unlock-duplication.md`](../32-buildings-unlock-duplication.md) ouvert pour refacto dédiée. |
| R4 | Architecture | mineur | `BUILDING_POWER_WEIGHTS` = 3ᵉ source de vérité par bâtiment | Couvert par même réflexion que R3 → ticket 32 (élargir le scope si refacto Piste A). |
| R5 | Readability | mineur | Style multi-ligne suggéré pour Council/Throne | **Faux positif** : le style oneline niveau 1 est cohérent avec CASTLE/WALL/HIDEOUT niveau 1 (oneline) — seuls les niveaux 2+ avec valeurs longues passent en multi-ligne. **Rejeté.** |
| R6 | Tests | mineur | `describe` racine englobant suggéré | Cosmétique, rejeté (les 4 describes top-level sont parfaitement lisibles tels quels). |
| R7 | Correctness | nit | Confirmer que `getBuildingLevelValues(t, level<1)` retourne `null` | Lecture `buildings.ts:473` → `if (level < 1) return null`. **OK.** |

### Tickets ouverts

- [`32-buildings-unlock-duplication.md`](../32-buildings-unlock-duplication.md) — Drift potentiel `unlockCastleLevel` ↔ `BUILDING_UNLOCK_REQUIREMENTS`.

### Ticket 30 — résolu

[`30-power-council-hall-missing.md`](../30-power-council-hall-missing.md) → résolu par ce run (Piste A appliquée : Council Hall implémentée comme bâtiment 1 niveau, poids 25, unlock Château 4). Marquage à porter dans le ticket en post-traitement étape 10.

**Mécanique de construction (transversale)** :

| # | Invariant spec | Code | Sévérité |
|---|---|---|---|
| M1 | File construction = 2 par défaut | `MAX_CONSTRUCTION_QUEUE = 3` | **mineure (doc)** → T4 (alignement spec sur code, décision user) |
| M2 | Bonus Château vitesse cumulatif | `CASTLE_CONSTRUCTION_SPEED_BONUS` ×0.96→×0.64 (table) | ✅ |
| M3 | Annulation = remboursement complet ressources + pop | `cancel-construction.use-case.ts:64-81` `increment` ressources + `decrement` pop.used | ✅ |
| M4 | Guards : `isBuildingEnabled` + unlock + max level appelés | `upgrade-building.use-case.ts:61, 70, 88` | ✅ |

## Rapport final

### Synthèse

Audit de conformité spec 03 ↔ code du catalogue de bâtiments. **12 bâtiments** confrontés (10 multi-niveaux + 2 single-level), **4 écarts réels** (3 majeurs + 1 doc), **4 fixes** appliqués dans le run, **1 ticket de suivi** ouvert (drift architecture).

Résolution complète du **ticket 30** (Salle du Conseil absente du modèle) via Piste A : implémentée comme bâtiment 1 niveau, poids 25, unlock Château 4. Enveloppe **Throne Hall** posée (catalogue + poids 35 + unlock Château 6) pour permettre au run 006 audit-conquest de coder la mécanique recrutement Seigneur sans retoucher le catalogue.

### Tableau de confrontation final

12/12 bâtiments alignés sur la spec après ce run. Détail dans `## Décisions prises § Tableau de confrontation` ci-dessus.

| Bâtiment | Statut | Action |
|---|---|---|
| CASTLE, WOOD, STONE, IRON, FARM, BARRACKS, WATCHTOWER, WALL, HIDEOUT | Conforme | — |
| WAREHOUSE | Storage 5 niveaux 1000→1750 | **Fix T3** : 10 niveaux 3000→10570 spec |
| COUNCIL_HALL | Absent | **Fix T1+T2** : ajouté (catalogue + poids 25 + unlock 4) |
| THRONE_HALL | Absent | **Fix T1+T2** : ajouté (catalogue + poids 35 + unlock 6) |
| File construction | Code = 3, spec = 2 | **Fix T4 (doc)** : spec alignée sur code |

### Fichiers touchés

- `packages/shared/src/village/buildings.ts` (+18 / −0) — ajout `COUNCIL_HALL` + `THRONE_HALL` dans `BUILDING_TYPES`, `BUILDING_DEFINITIONS`, `BUILDING_UNLOCK_REQUIREMENTS`.
- `packages/shared/src/power/weights.ts` (+2 / −0) — ajout `COUNCIL_HALL: 25`, `THRONE_HALL: 35`.
- `packages/shared/src/resources/storage.ts` (+10 / −5) — extension warehouse à 10 niveaux (3000 → 10570 par paliers ×1.15).
- `docs/gameplay/03-buildings.md` (+1 / −1) — § Mécanique de construction : « 2 upgrades » → « 3 upgrades » (alignement spec sur code).
- `battleforthecrown-backend/src/modules/village/buildings.spec.ts` (+131 / −0) — nouveau spec pure-logic, 18 tests (Council/Throne, warehouse, catalogue exhaustif, fallback).
- `battleforthecrown-backend/src/modules/world/world-config.service.spec.ts` (+2 / −2) — alignement assertions warehouse aux nouvelles valeurs spec (1750→5250, 1000→3000).
- `tasks/30-power-council-hall-missing.md` — marqué Résolu, déplacé vers `tasks/archive/`.
- `tasks/32-buildings-unlock-duplication.md` — nouveau ticket de suivi (refacto unlockCastleLevel ↔ BUILDING_UNLOCK_REQUIREMENTS).
- `tasks/runs/002-audit-buildings.md` — fiche complétée + archivée.
- `tasks/README.md` — réindexation (run 002 archivé, ticket 30 archivé, ticket 32 ajouté).

### Tickets ouverts

- [`32-buildings-unlock-duplication.md`](../32-buildings-unlock-duplication.md) — Drift potentiel `unlockCastleLevel` (BUILDING_DEFINITIONS) ↔ `BUILDING_UNLOCK_REQUIREMENTS`. Hors scope ce run, refacto dédiée recommandée (Piste A : dériver le second du premier).

### Tickets résolus

- [`30-power-council-hall-missing.md`](../archive/30-power-council-hall-missing.md) — Résolu via Piste A.

### Tests

`yarn workspace battleforthecrown-backend test` vert : **9 suites / 108 tests / 0 fail** (dont 18 nouveaux dans `buildings.spec.ts`, et 2 mises à jour dans `world-config.service.spec.ts`). `yarn workspace @battleforthecrown/shared build` vert.

### QA backend (vérifié par l'agent)

**Résultat attendu** : les nouveaux types Council/Throne sont acceptés par le DTO Zod, les guards refusent une 2ᵉ construction, le power weight retourné est exact, le warehouse capacity reflète les 10 niveaux spec.

- [x] Tests pure-logic : 108/108 verts (`yarn workspace battleforthecrown-backend test`).
- [x] Build TS shared : compile sans erreur (`yarn workspace @battleforthecrown/shared build`).
- [x] DTO Zod auto-aligné : `upgrade-building.dto.ts:10` itère sur `Object.keys(BUILDING_TYPES)` → COUNCIL_HALL/THRONE_HALL acceptés sans modif DTO.
- [x] Guard `getBuildingMaxLevel` retourne 1 pour Council/Throne → seconde construction bloquée par `nextLevel > maxLevel` (`upgrade-building.use-case.ts:88-91`). Vérifié par test pure-logic.
- [x] Recalcul `maxPerType` au tick : `resources.service.ts:153` passe `currentStorageLimit` (issu de `getStorageLimit` recalculé dynamiquement) → joueurs existants self-healed au prochain tick production. Pas de backfill SQL nécessaire.
- [x] Aucune autre référence doc « 2 upgrades » dans `docs/` (grep ciblé).

### QA résiduelle pour le user

**Résultat attendu** : la file de construction accepte 3 chantiers parallèles, le catalogue UI (si présent) reflète les 12 bâtiments — Council/Throne resteront non-buildables jusqu'à ce qu'une UI les expose.

- [ ] Lancer 3 upgrades de bâtiments différents en parallèle dans un même village.
- [ ] Vérifier que le 4ᵉ upgrade est refusé avec « Construction queue full (max 3) ».
- [ ] (Optionnel — la mécanique recrutement Seigneur arrive en run 006) Vérifier que la nouvelle capacité d'entrepôt niveau 1 = 3000 par ressource s'affiche correctement après création d'un nouveau village (ou attendre 1 tick production sur un village existant).

### Méta-évaluation

- **Cartographie utile** : `code-mapper` a immédiatement révélé l'écart warehouse (5 vs 10 niveaux, 1000 vs 3000) qui n'était pas explicitement listé dans la fiche initiale. Bon signal.
- **Implementer T1 STATUS partial légitime** : le couplage build T1↔T2 (BuildingType ⊂ BUILDING_POWER_WEIGHTS via PowerConfig) a été correctement détecté et signalé plutôt que franchi en silence. Pattern à conserver.
- **Review utile** : 2 majeurs réels remontés (grep doc + backfill warehouse), tous deux clos sans nouveau code. 1 finding architecture transformé en ticket de suivi (Piste A) plutôt que rushé. 0 bloquant.
- **Pas de QA in-game** : le run touche uniquement le catalogue/poids/storage côté shared+spec — aucune surface UI Pixi modifiée. La QA résiduelle au user est une vérif fonctionnelle sur file de construction (1 case) et entrepôt (catchup au prochain tick).
- **Périmètre respecté** : 0 débordement vers backend (DTO auto-aligné), 0 vers frontend, 0 migration Prisma (Building.type = String confirmé).
