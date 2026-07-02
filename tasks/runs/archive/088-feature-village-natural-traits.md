# Run #088 — village-natural-traits

> **Statut** : DONE
> **Démarré** : 2026-07-02
> **Terminé** : 2026-07-02

## Cible

- **Phase roadmap** : Hors phases 1-12 nommées. Feature transverse (éco + carte + scout). À caler par le lead au démarrage : rider la Phase 3 (Styles de village — mécanique sœur, même presenter scout/DTO) **ou** post-MVP isolé. La roadmap `00-mvp-roadmap.md` ne la liste pas → arbitrage requis étape 1 du run.
- **Spec source** : promotion de `docs/gameplay/lab/tickets/01-natural-village-traits.md` (§ Points à trancher — 4 questions). Spec canonique **créée par ce run** : `docs/gameplay/27-village-natural-traits.md`.
- **Type** : feature (promotion lab → spec + implémentation).
- **Modules** : backend (world, resources, combat) | frontend (village panel + scout report viewer) | shared (village/traits, logic/production, combat/dtos) | docs (spec 27 + data-model).

## Objectif

Donner à chaque village une identité **fixe liée à son emplacement** (trait naturel), **distincte** du style *choisi* par le joueur (`VillageStrategyConfig`). Conquérir devient « prendre un bon spot », pas juste un village de plus.

**MVP borné (vision tranchée)** :

- Trait **server-authoritative**, dérivé **déterministe** de la tile `(worldId, x, y)` + sel monde, posé à la création — villages **joueurs ET barbares** — sans aléatoire runtime.
- Périmètre = **traits de ressource uniquement** : `DENSE_FOREST` (bois), `RICH_QUARRY` (pierre), `IRON_VEIN` (fer), `PLAINS` (neutre, zéro bonus éco). Bonus = **petit % plat** sur la production passive de la ressource concernée. **Pas de scaling bâtiment** → zéro snowball.
- **Révélation** : trait de **son propre** village visible sur son panneau ; trait d'un village **ennemi** révélé uniquement par le **rapport de scout** (snapshot, pattern `castleLevel`/`wallLevel` existant). Jamais exposé sur la carte publique.
- **Hors scope MVP** (documentés en follow-up dans la spec 27) : traits vision (Colline/Watchtower), vitesse départ armée (Plaine), population (Terre fertile). Synergie visuelle avec la couche cosmétique `worldTerrain.ts` (front, seed-based, non-autoritative) = note, pas un livrable.

## Dépendances

- Aucune dépendance bloquante de code. **Deux arbitrages à trancher étape 1 du run** :
  1. **Placement roadmap** (Phase 3 vs post-MVP isolé).
  2. **Source du sel déterministe + backfill migration** : vérifier s'il existe un `worldSeed` stable en base ; sinon décider si `(worldId, x, y)` suffit comme sel ou s'il faut une colonne `seed` sur `World`. Trancher aussi le traitement des **villages existants** à la migration (calcul du trait pour l'existant vs champ lazy) — impact fair-play sur mondes ouverts.

## Critère de fin (acceptance)

- [ ] [auto] `deriveNaturalTrait(worldId, x, y, sel)` déterministe : même tile → même trait sur N appels (test unit pur `packages/shared/src/village/traits.spec.ts`).
- [ ] [auto] Un village `DENSE_FOREST` produit strictement **plus** de bois qu'un `PLAINS` de mêmes bâtiments/niveaux/strategy ; pierre/fer inchangés (test `calculateProductionRate`).
- [ ] [auto] `PLAINS` n'applique **aucun** bonus éco (production == baseline sans trait).
- [ ] [auto] Le bonus trait **ne scale pas** avec le niveau de bâtiment (facteur plat constant vérifié sur 2 niveaux).
- [ ] [auto] Tout village créé (joueur **et** barbare) a un `naturalTrait` non-null en base immédiatement après create (smoke/test service).
- [ ] [auto] **Villages pré-existants** : une **seule** stratégie de backfill/migration est retenue (décision étape 1) et un monde déjà ouvert vérifie que chaque village conserve un `naturalTrait` stable et homogène après déploiement (pas de trait incohérent entre mondes neufs et mondes ouverts).
- [ ] [auto] `world-entities` conserve pour les villages ennemis un **blip foggé avec `id` stable** (entité toujours sélectionnable avant scout) et `naturalTrait` **n'apparaît jamais** dans le payload révélé (test presenter — anti-fuite intel sans casser le rendu carte).
- [ ] [auto] Le rapport de scout d'un village ennemi porte `details.naturalTrait` après scout.
- [ ] [visuel — checklist Kelvin] Trait de **son** village affiché sur son panneau ; trait ennemi **absent** de la carte avant scout, **présent** dans le rapport scout après.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`
- Spec source lab : `docs/gameplay/lab/tickets/01-natural-village-traits.md`
- Specs connexes (référencer, **ne pas dupliquer**) : `12-village-styles.md` (styles *choisis*, distincts), `02-economy-and-progression.md` (production passive), `11-scouting.md` (révélation scout).
- Précédent d'artefact (promotion lab → spec) : `tasks/runs/archive/085-feature-private-map-markers.md` (ticket lab 10 → spec 26).

## Décomposition initiale

_(Lead étape 3 du run — tâches ≤ 5 fichiers. Le run peut être scindé back/spec vs front si le scope déborde, cf. split 063/084.)_

- **T1 — spec** : rédiger `docs/gameplay/27-village-natural-traits.md` (trancher les 4 points du ticket 01, section follow-up traits hors MVP). MAJ `docs/gameplay/README.md` (index) + `docs/gameplay/lab/tickets/01-natural-village-traits.md` (statut → promu + lien spec 27). [3 fichiers docs]
- **T2 — shared type** : `packages/shared/src/village/traits.ts` (type `VillageNaturalTrait`, table de bonus production plat, `deriveNaturalTrait` pure) + export `village/index.ts` + tests unit purs. [3 fichiers]
- **T3 — shared prod** : brancher `naturalTrait` optionnel dans `logic/production.ts` (`calculateProductionRate`, facteur ressource appliqué **après** le facteur strategy, multiplicatif plat) + tests. [2 fichiers]
- **T4 — schema** : `prisma/schema.prisma` champ `Village.naturalTrait` + migration + `prisma generate` (+ décision backfill étape 1). [2 fichiers]
- **T5 — pose** : poser `naturalTrait` aux 2 create — `src/modules/world/join-world.use-case.ts` (joueur) + `src/modules/world/barbarian-village.factory.ts` (barbare). [2 fichiers]
- **T6 — branch prod backend** : `resources.service.ts` + `world-config.service.ts` passent `naturalTrait` à `calculateProductionRate`. [2 fichiers]
- **T7 — révélation** : `world-entities-query.service.ts` (trait de son PROPRE village uniquement) + `scout-report.presenter.ts` + persistance scout details + `packages/shared/src/combat/dtos.ts` (`ScoutReportResponse.details.naturalTrait`). [4 fichiers]
- **T8 — front** : badge/label trait sur panneau de son village + viewer de rapport scout (réutiliser le rendu `wallLevel`/`castleLevel`). [≤ 5 fichiers pixi]

## Points d'attention

- **Ne pas confondre** trait (FIXE, serveur) et style `VillageStrategyConfig` (CHOISI). Les deux facteurs coexistent (multiplicatifs) dans `calculateProductionRate` — valider l'ordre/multiplicativité en review.
- **Anti-fuite intel** : `naturalTrait` ne doit JAMAIS sortir dans `PLAYER_VILLAGE`/`BARBARIAN_VILLAGE` data de `world-entities` pour autrui — seul le scout révèle. Facile à casser par mégarde → test presenter dédié.
- **Snapshot scout** : trait FIXE → un snapshot au moment du scout suffit (pas de staleness comme compo/stock).
- **worldTerrain.ts** (front, cosmétique, seed-based) ≠ trait (serveur). Ne pas s'appuyer dessus comme source de vérité.
- **Review indépendante REQUISE** : touche la formule de production passive server-authoritative (chaîne shared → 2 services) + schéma DB + vecteur de révélation d'info sensible au fair-play. Critères déclencheurs : back+front, modifie/crée une spec, > 100 lignes de diff estimées, invariant durable.

## Rapport final

Décisions clés _(git history)_ : sel = `worldId` (pas de `World.seed`) ; `deriveNaturalTrait` FNV-1a pur browser-safe ; bonus plat `×1.10` après strategy ; colonne NOT NULL sans default (pose forcée) + backfill migration `md5` ; révélation trait propre owner-scoped (`village.service.getVillages`), ennemi via scout snapshot, world-entities intouché (déviation vs T7 planner).

### Acceptance & QA

- [x] `deriveNaturalTrait` déterministe — `vitest run village/traits.spec.ts` → 5/5 (même tile → même trait sur 50 appels, sel worldId, distribution)
- [x] `DENSE_FOREST` > `PLAINS` bois, pierre/fer inchangés — `jest production-rate` → 9/9
- [x] `PLAINS` aucun bonus (== baseline) — `jest production-rate` (case PLAINS) → pass
- [x] Bonus plat, ne scale pas avec le niveau — `jest production-rate` (`ratio(2)==ratio(9)==1.1`) → pass
- [x] Tout village créé (joueur+barbare) a `naturalTrait` non-null — pose aux 2 create + colonne NOT NULL ; `test:smoke barbarians` → pass ; `SELECT count(*) FILTER (WHERE natural_trait IS NULL)` → 0/121
- [x] Backfill villages pré-existants stable/homogène — migration appliquée dev+smoke, `SELECT natural_trait, count(*) GROUP BY` → PLAINS 61 / IRON 21 / QUARRY 21 / FOREST 18, 0 NULL
- [x] world-entities : blip foggé id stable + `naturalTrait` jamais dans le payload — `jest world-entities-natural-trait-leak` → 2/2 (Zod strip) ; audit `grep naturalTrait src/` → 0 chemin cross-joueur
- [x] Rapport scout porte `details.naturalTrait` — `jest scout-report.presenter` (+2 cases) → pass ; `test:smoke scouting` → pass
- [ ] [visuel] trait propre sur son panneau / ennemi absent avant scout, présent après — **checklist Kelvin** (front `VillageHero` + `scoutReportView`)
- **Review indépendante** : Déclenchée (raison: back+front + crée spec + diff>100L + invariant durable). Verdict **GO** (0 bloquant, 0 majeur ; 2 findings mineurs fixés : threading recommandations stratégie + simplification cast ; 1 mineur laissé = guard Zod adéquat).
- **Tests automatisés** : shared 5 (traits) + production 9 + presenter 2 + anti-leak 2 + resources 1 (+forward trait) ; backend unit 554/554 ; pixi unit 892/892 ; front scoutReportView +5.
- **Smokes lancés** : `test:smoke` complet (transversal : migration Prisma + contrat shared) → **43 suites / 139 tests pass**. Ciblés d'abord : scouting/barbarians/vision 7/7.
- **Smokes ajoutés/modifiés** : Aucun nouveau ; 19 fixtures smoke mises à jour (`naturalTrait: 'PLAINS'`, NOT NULL).
- **QA fonctionnelle agent** : SQL DB (distribution + 0 null), audit exposition grep, static-check vert.
- **Tests IG à faire par le user** : voir checklist ci-dessous.

### Checklist IG (Kelvin)

1. Panneau de son village : badge trait naturel affiché (icône + label FR).
2. Scout d'un village ennemi (joueur ou barbare) : section « Trait naturel » présente dans le rapport.
3. Avant scout : le trait d'un ennemi n'apparaît nulle part sur la carte.
4. Un village Forêt dense produit visiblement plus de bois qu'une Plaine équivalente.
