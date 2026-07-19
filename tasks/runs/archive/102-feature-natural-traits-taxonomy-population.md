# Run #102 — natural-traits-taxonomy-population

> **Statut** : DONE
> **Démarré** : 2026-07-19
> **Terminé** : 2026-07-19

## Cible

- **Phase roadmap** : Hors phase numérotée — follow-up post-MVP de la spec 27 (livrée hors roadmap par run 088). Apparenté « ajouts mineurs MVP » (ajout isolé sans impact sur les boucles principales). À acter au démarrage.
- **Spec source** : [`docs/gameplay/27-village-natural-traits.md`](../../docs/gameplay/27-village-natural-traits.md) § **Hors scope MVP (follow-up)** (lignes 79-89).
- **Type** : feature.
- **Modules** : shared (`village/traits.ts`) | backend (population + migration Prisma) | frontend (badge/modale trait) | docs (spec 27).

## Objectif

Livrer les **traits naturels non-productifs** documentés mais **explicitement exclus** par le run 088 (cf. `tasks/runs/archive/088-feature-village-natural-traits.md` ligne 23). Le blocage historique (« ces trois demandent de brancher des systèmes hors production passive ») est **levé** : les systèmes sœurs existent tous désormais (vision `WATCHTOWER_VISION_LEVELS`, mobilité `armySpeedBonus` dans `calculateTravelTime`, population `applyPopulationBonus`/Quartier).

**Vision tranchée (recommandation forte du run-planner) : découper en 3 runs verticaux.** Ce run 102 pose la **fondation taxonomie v2** (redistribution des buckets + nouveaux traits enum + migration) et branche le **vertical le plus propre : Terre fertile → bonus population Quartier** (shared + backend + **badge front léger** réutilisant le socle run 093 — **aucun nouveau rendu Pixi/canvas**, contrairement au vertical Colline). Les deux autres effets sont déportés sur des runs successeurs :

- **Colline → bonus rayon vision Watchtower** (shared `vision.ts` + `vision.service.ts` + rendu disques Pixi).
- **Plaine → départ d'armée plus rapide** (shared `travel-time.ts` + callers `combat.service.ts`/workers, balance calée sur la distribution posée ici).

**Motif du découpage** : la redistribution des buckets `deriveNaturalTrait` est le **seul point partagé** par les 3 traits ; la poser une fois avec l'effet le plus propre évite une **double migration** de l'enum Postgres.

## Piste bloquante à trancher au démarrage (invariant zéro-snowball)

Le trait `PLAINS` actuel est **neutre** et représente **~55 %** des tiles (`deriveNaturalTrait` : buckets 15/15/15/55). La spec envisage `Plaine → army-speed`, mais donner un bonus à 55 % des villages **casse l'invariant « identité plate, zéro snowball »**. La **distribution v2 complète doit être décidée maintenant** (même si les effets Colline/Plaine sont branchés plus tard), sinon la taxonomie devra rebouger → double migration.

Deux axes de décision refinement :

1. **Distribution v2** : quels buckets pour `HILL` (Colline) et `FERTILE_SOIL` (Terre fertile), et la part de `PLAINS` (ne peut rester à 55 % si `PLAINS` porte l'army-speed). Somme = 100 %.
2. **Stratégie migration** : (a) distribution v2 sur **nouveaux villages uniquement** (les existants gardent leur trait → zéro `HILL`/`FERTILE_SOIL` sur mondes ouverts) **vs** (b) **re-dérivation backfill** de tous les villages (rompt la promesse « trait fixe » pour l'existant — un `PLAINS` peut devenir `HILL`).

## Dépendances

- **Aucun prérequis manquant.** Systèmes sœurs tous livrés (run 088 : colonne `Village.naturalTrait` NOT NULL + migration backfill + dérivation aux 2 create ; run 093 : `NaturalTraitBadge`/`NaturalTraitModal` réutilisables ; vision/mobilité/population branchables).

## Critère de fin (acceptance)

- [ ] [auto] `deriveNaturalTrait` renvoie chaque nouveau trait à la **fréquence cible** (±tolérance) sur un large échantillon, et reste **stable** (même `(worldId, x, y)` → même trait sur N appels). (unit `traits.spec.ts`)
- [ ] [auto] La somme des parts de la distribution v2 == 100 % et `PLAINS` n'excède pas le seuil anti-snowball tranché en refinement. (unit / grep)
- [ ] [auto] `applyPopulationBonus` applique le facteur `FERTILE_SOIL` **multiplicativement** avec le `populationBonus` du style, **plat et indépendant du niveau** de bâtiment. (unit)
- [ ] [auto] Sur un fixture de **deux villages distincts** — l'un `FERTILE_SOIL`, l'autre `PLAINS`, avec bâtiments/niveaux/strategy **identiques** — la population max du village `FERTILE_SOIL` dépasse celle du village `PLAINS` d'exactement le facteur trait, via l'endpoint population. (smoke)
- [ ] [auto] Les traits **non-`FERTILE_SOIL`** ne modifient pas la population max (régression neutre). (unit / smoke)
- [ ] [auto] `naturalTrait` n'apparaît **toujours jamais** dans les payloads carte publique `PLAYER_VILLAGE`/`BARBARIAN_VILLAGE` (guard anti-fuite existant vert). (test guard)
- [ ] [auto] Migration up passe ; **aucun** village avec `naturalTrait` NULL après backfill (selon décision a/b). (SQL / `prisma migrate deploy`)
- [ ] [visuel — checklist Kelvin] Badge + modale affichent correctement label / icône / texte du bonus pour les nouveaux traits.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-pixi-scene` (follow-up vision)
- Spec source : `docs/gameplay/27-village-natural-traits.md` § Hors scope MVP (follow-up)
- Prérequis **livré** (non-doublon) : `tasks/runs/archive/088-feature-village-natural-traits.md` (traits de ressource + PLAINS neutre + colonne + migration backfill)
- Socle UI réutilisable : `tasks/runs/archive/093-feature-natural-trait-badge-modal.md` (`NaturalTraitBadge`/`NaturalTraitModal`, `NATURAL_TRAIT_DISPLAY`)
- Infra vision (pour le run successeur Colline) : `tasks/archive/{45-watchtower-finite-vision,58-multi-village-vision-disks-missing,19-conquered-village-vision-gap}.md`
- Specs connexes (référencer, **ne pas dupliquer**) : `12-village-styles.md` (styles *choisis*, distincts), `02-economy-and-progression.md` § Population, `03-buildings.md` § Quartier.

## Décomposition initiale

_(Lead étape 3 du run — tâches ≤ 5 fichiers. Peut être scindé si le scope déborde.)_

- **T1 — taxonomie v2 (shared)** : trancher + implémenter la distribution v2 dans `deriveNaturalTrait` (nouveaux buckets `HILL`/`FERTILE_SOIL`, part `PLAINS` réduite). Étendre `VillageNaturalTrait`, `VILLAGE_NATURAL_TRAITS`, `NATURAL_TRAIT_DISPLAY` (label + icône). [`packages/shared/src/village/traits.ts`, ≤2 fichiers]
- **T2 — table bonus population (shared)** : ajouter `NATURAL_TRAIT_POPULATION_BONUS` (`FERTILE_SOIL = ×1.x`, autres neutres) dans `traits.ts`. [shared]
- **T3 — branchement population (backend)** : étendre `applyPopulationBonus(baseMax, strategyBonus, naturalTrait?)` (`population-capacity.ts`) + propager `naturalTrait` dans les **4 callers** : `population.service.ts:36`, `gameplay/upgrade-building.use-case.ts:118`, `recruit-noble.use-case.ts:122`, `recruit-troops.use-case.ts:160`. Une seule fonction étendue (éviter la composition ad-hoc → arrondi divergent). [backend, 5 fichiers]
- **T4 — migration Prisma** : élargir l'enum Postgres `VillageNaturalTrait` (`ALTER TYPE ADD VALUE`, cf. `bftc-prisma`) + stratégie backfill selon décision a/b. [backend/prisma]
- **T5 — front badge** : exposer les nouveaux traits (label/icône + texte bonus Terre fertile) via `NATURAL_TRAIT_DISPLAY` dans `NaturalTraitBadge`/`NaturalTraitModal` (socle run 093). [pixi]
- **T6 — docs** : promouvoir `docs/gameplay/27-village-natural-traits.md` (section follow-up → livrée pour Terre fertile), acter la distribution v2 + garde zéro-snowball population. MAJ `docs/architecture/data-model.md` si l'enum est documenté.
- **T7 — tests** : unit `deriveNaturalTrait` (distribution homogène + stabilité), unit `applyPopulationBonus` (trait × strategy, plat), smoke population capacity avec `FERTILE_SOIL`.

## Points d'attention

- **Redistribution buckets vs « trait fixe »** : la re-dérivation des villages existants (option b) rompt l'invariant « trait fixe » (un `PLAINS` peut devenir `HILL`). Décision refinement non spécifiée par la doc.
- **PLAINS ≠ porteur d'army-speed à 55 %** : la part de `PLAINS` **doit** être décidée dans ce run même si l'effet army-speed est branché plus tard, sinon double migration.
- **`applyPopulationBonus` a 4 callers** : garder la garde `> 0` et le `Math.floor` cohérents partout — préférer **une seule** fonction étendue.
- **Enum Postgres élargi** : `ALTER TYPE ADD VALUE` n'est pas transactionnel avec certaines opérations Prisma → vérifier la stratégie migration (`bftc-prisma`).
- **Scope** : ce run bundle fondation taxonomie + **un** effet (population). Si le scope déborde `medium`, sortir la migration/backfill en T dédié ou scinder « taxonomie-only ».

## Review indépendante

**REVIEW_INDÉPENDANT_REQUIS : oui.** Les 4 critères déclencheurs sont réunis : (a) back+front+shared, (b) modifie la SPEC 27 (distribution + promotion follow-up), (c) > 100 lignes probables (5+ callers + migration + shared + front), (d) invariant durable (distribution des traits + garde zéro-snowball).

## Décisions prises

_(git history)_ — Synthèse des choix tranchés en autonomie (run non-interactif) :

1. **Distribution v2** : 15 % chacun pour DENSE_FOREST / RICH_QUARRY / IRON_VEIN / FERTILE_SOIL / HILL + 25 % PLAINS (somme 100 %). Buckets ressource `0-44` **inchangés vs v1** (stabilité backward), seule l'ancienne part PLAINS re-scindée. PLAINS 55 %→25 % (< plafond anti-snowball **30 %** acté, anticipe l'army-speed futur).
2. **Migration** : option **(a) nouveaux villages uniquement** (`ALTER TYPE ADD VALUE` seul, zéro backfill/re-dérivation) — préserve l'invariant « trait fixe » de la spec 27. Option (b) backfill rejetée.
3. **Facteur FERTILE_SOIL** : ×1.10 population (symétrique aux +10 % ressource), appliqué multiplicativement au facteur strategy, **un seul `Math.floor`** final.
4. **HILL** : posé dans l'enum + la distribution mais **inerte** ce run ; effet vision Watchtower déporté à un run successeur (évite une double migration de l'enum Postgres).
5. **Coding lead direct** (dérogation) : changements chirurgicaux entièrement spécifiés (1 signature + 4 callers tightly-coupled), cartographie complète préalable → plus sûr qu'un fan-out d'implementers.

## Rapport final

Taxonomie v2 des traits naturels posée en une passe (enum + distribution + migration additive) ; seul le vertical Terre fertile → +10 % population est branché (shared `NATURAL_TRAIT_POPULATION_BONUS` + `applyPopulationBonus` + 4 callers + badge/modale front). HILL/Plaine restent des effets différés. Placeholders assets `hill.webp`/`fertile-soil.webp` (art final = follow-up).

### Acceptance & QA

**Critères d'acceptance vérifiés** :
- [x] `deriveNaturalTrait` fréquence cible ±tolérance + stabilité — `yarn workspace battleforthecrown-pixi test -- --run traits` → 7/7 (déterminisme x50, salt worldId, distribution 200×200 ±0.02).
- [x] Somme parts v2 == 100 % + PLAINS ≤ seuil anti-snowball — `traits.spec.ts` sum≈1 + PLAINS 25 % ≤ 30 % → vert.
- [x] `applyPopulationBonus` FERTILE_SOIL multiplicatif, plat, floor unique — `yarn workspace battleforthecrown-backend test -- population-capacity` → 6/6 (250×1.1×1.1=302.5→302).
- [x] Smoke 2 villages FERTILE_SOIL vs PLAINS via `/population` — `test:smoke:run -- natural-trait-population` → 1/1 (fertileMax=275=floor(250×1.1) > plainsMax=250).
- [x] Traits non-FERTILE_SOIL neutres (régression) — smoke HILL==250 + unit boucle traits neutres → vert.
- [x] `naturalTrait` jamais dans payloads carte publique — `test -- world-entities-natural-trait-leak` → 2/2 (guard existant vert).
- [x] Migration up, aucun NULL — `prisma migrate deploy` (DB principale + smoke) → appliquée ; `ALTER TYPE ADD VALUE` additif, colonne déjà NOT NULL.
- [ ] **[visuel — checklist Kelvin]** Badge + modale FERTILE_SOIL/HILL : label + texte bonus ("+10 % Population" / "Aucun bonus") corrects ; **icônes = placeholders** (plains.webp copié) → swap art `hill.webp`/`fertile-soil.webp` requis.

**Review indépendante** : Déclenchée (raison : back+front+shared, modifie SPEC 27, diff >100 lignes, invariant durable). Verdict **GO** — CodeRabbit CLI local 0 bloquant/majeur, 1 mineur (tolérance test) résolu ; couverture critères OK.

**Tests automatisés** : `yarn test:backend` 614/614 ; `yarn test:pixi` 1166/1166 ; `yarn static-check` vert.

**Smokes lancés** : Ciblés — `test:smoke:preflight` OK + `test:smoke:run -- natural-trait-population` 1/1 + `test -- world-entities-natural-trait-leak` 2/2. Diff backend = pure logic population + migration additive → périmètre ciblé suffisant ; full smoke couvert par CI PR.

**Smokes ajoutés/modifiés** : `test/natural-trait-population.smoke.spec.ts` (FERTILE_SOIL vs PLAINS via endpoint /population, régression HILL neutre).

**QA fonctionnelle agent** : endpoint `GET /population` exercé bout-en-bout dans le smoke (register → join → set trait → assert max).

**Tests IG à faire par le user** : rendu badge/modale des nouveaux traits (icône placeholder + label + texte bonus population) sur les 3 surfaces (panneau village propre, rapport scout, panneau carte scouté). Art final `hill.webp`/`fertile-soil.webp` à fournir (follow-up).
