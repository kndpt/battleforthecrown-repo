# Run #002 — audit-buildings

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

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

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, QA résiduelle qui revient à toi, méta-évaluation si applicable.)_
