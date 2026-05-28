# Run #040 — recalibrate-base-travel-speed

> **Statut** : DONE
> **Démarré** : 2026-05-28 13:27 CEST
> **Terminé** : 2026-05-28 13:45 CEST

## Cible

- **Phase roadmap** : Hors roadmap — chantier transverse de baseline (recalibration mobilité, suite logique des runs [`026`](./archive/026-world-tempo-plumbing-clean-cut.md) / [`027`](./archive/027-world-tempo-recalibrate-mvp-constants.md) qui avaient explicitement laissé la mobilité hors scope).
- **Spec source** : [`docs/gameplay/08-units.md` § Mobilité](../../docs/gameplay/08-units.md) + [`docs/gameplay/23-world-tempo-and-multipliers.md` § 6](../../docs/gameplay/23-world-tempo-and-multipliers.md) + [`docs/architecture/balance-and-tempo.md`](../../docs/architecture/balance-and-tempo.md)
- **Type** : `fix` (recalibration baseline) + `spec` (clarif doc 23 + doc 08)
- **Modules backend** : `world/world-config`, smokes combat/scout/conquête/renfort qui consomment les durées de trajet
- **Modules frontend** : `pixi/lib/combatHelpers`, `pixi/features/combat/AttackDetailModal` (consomment la formule shared)

## Décision tranchée à la planification

- **Piste retenue** : **B — abaisser `REFERENCE_SPEED`**. Préserve la table 08-units.md (ratios `MILICE 10 / CAV 35 / SPY 100 / SIÈGE 3`), 1 constante shared modifiée, ratios trivialement intacts.
- **Valeur retenue** : `REFERENCE_SPEED = 6` (cible : MILICE × 8 cases ≈ **4.8 min** au tempo `1.0`, ÷16.7 vs actuel `80 min`).
- **Sémantique reformulée** : "1 tuile en 60 s à `speed = REFERENCE_SPEED`" → "1 tuile en 60 s à `speed = 6` ; à `speed = 100` (ESPION) une tuile = ~3.6 s".

## Dépendances

- ✅ Run [`026-world-tempo-plumbing-clean-cut`](./archive/026-world-tempo-plumbing-clean-cut.md) `DONE` — `WorldConfig.tempo.travelSpeed` exposé, `TempoService` branché sur le calcul de trajet.
- ✅ Run [`027-world-tempo-recalibrate-mvp-constants`](./archive/027-world-tempo-recalibrate-mvp-constants.md) `DONE` — laissait explicitement la mobilité intouchée (« le scaling se fait via `tempo.travelSpeed`, sans toucher aux ratios »). Ce run est la suite manquante.
- Aucun ticket actif bloquant.

## Critère de fin (acceptance)

### Backend / shared

- [ ] `packages/shared/src/logic/travel-time.ts` : `REFERENCE_SPEED = 6`, docstring reformulée.
- [ ] `packages/shared/src/army/unit.ts` : `UNIT_STATS.*.speed` **non modifiés** (preuve : `git diff packages/shared/src/army/unit.ts` vide hors commentaires).
- [ ] `calculateTravelTime` : à `armySpeed = REFERENCE_SPEED`, `multiplier = 1`, `distance × 60_000` ms (1 tuile/min à speed=REFERENCE_SPEED, invariant mathématique).
- [ ] Symétrie aller/retour préservée (cf. ticket archivé [`35`](../archive/35-return-travel-time-recomputed-vs-spec.md)) — la même formule s'applique aux deux trajets.
- [ ] `battleforthecrown-backend/src/modules/world/world-config.service.spec.ts` recalibré : assertions de durée divisées par le facteur de compression `100 / 6 ≈ 16.67`. Refacto les `toBe(600000)` magiques en formule lisible (ex. `Math.round(distance * 60_000 * REFERENCE_SPEED / armySpeed)`) pour éviter de retomber dans le piège.
- [ ] Smokes backend `combat-attack`, `scouting`, `conquest-finalize`, `recall-en-route`, `reinforcements` verts (assertions relatives, pas absolues — ne devraient pas demander de recalibration).

### Frontend

- [ ] `battleforthecrown-pixi/src/lib/combatHelpers.ts` : aucune modif logique requise (wrapper sur shared). Vérifier que rien n'override la constante.
- [ ] `AttackDetailModal.tsx` : ETA affiché cohérent avec la nouvelle baseline (passe par shared, aucun chiffre en dur).
- [ ] Tests Pixi verts.

### Docs / spec

- [ ] `docs/gameplay/08-units.md` § Mobilité (ligne ~28) : phrase "1 tuile par minute à speed=100" reformulée (nouvelle constante de référence, exemples chiffrés cohérents).
- [ ] `docs/architecture/balance-and-tempo.md` (ligne ~29) : entrée "Vitesse de référence trajet" alignée.
- [ ] `docs/gameplay/23-world-tempo-and-multipliers.md` § 6 : clarif que **l'invariant intouchable concerne les ratios `UNIT_STATS.speed`**, pas `REFERENCE_SPEED` (qui est une constante de calibration plomberie).
- [ ] Audit `rg` exemples chiffrés de durée trajet dans `docs/gameplay/{04-combat,10-conquest,11-scouting,13-barbarian-conquest,14-pvp-conquest}.md` — recalibrer si des chiffres absolus sont cités.
- [ ] Wall-clock invariants **NON modifiés** (§ 6.1 doc 23) : bouclier débutant 48 h, cooldown style 24 h, reset cartes 04:00, abandon 14 j.

### Vérification globale

- [ ] `yarn static-check` vert.
- [ ] `yarn workspace @battleforthecrown/shared build` vert.
- [ ] Aucun seed / fixture / migration n'override `tempo.travelSpeed` à une valeur qui ferait double compression (audit `rg "travelSpeed" battleforthecrown-backend/prisma battleforthecrown-backend/scripts battleforthecrown-backend/test/fixtures`).

### QA in-game (visuel / gameplay)

- [ ] **QA IG MILICE proche** : sur monde tempo 1.0, ouvrir `AttackDetailModal` sur un village barbare adjacent (≤ ~8 cases) avec une MILICE → ETA affiché ≤ **6 min**. Après envoi, l'expédition arrive effectivement dans ce délai (event WS `expedition.arrived`).
- [ ] **QA IG ratio CAV/INF** : envoyer CAVALIER sur la même cible → temps ≈ 3.5× plus rapide que MILICE (ratio `35 / 10` préservé).
- [ ] **QA IG SEIGNEUR** : envoi conquête (Seigneur + escorte) → durée ≈ 2× celle d'une MILICE seule (speed 5 vs 10), reste lisible narrativement.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- **T1** — Shared + commentaires frontend : `packages/shared/src/logic/travel-time.ts` passe `REFERENCE_SPEED` à 6 et les commentaires consommateurs restent alignés.
- **T2** — Backend tests : `battleforthecrown-backend/src/modules/world/world-config.service.spec.ts` calcule les attentes via formules lisibles et couvre l’invariant `distance × 60_000` à `armySpeed = REFERENCE_SPEED`.
- **T3** — Docs : `08-units.md`, `23-world-tempo-and-multipliers.md`, `balance-and-tempo.md` alignent la sémantique baseline vs ratios `UNIT_STATS.speed`.
- **T4** — Audit docs/code : grep des exemples chiffrés dans `04/10/11/13/14`, des consommateurs `REFERENCE_SPEED` et des `travelSpeed` seed/fixtures.
- **T5** — Vérifications : build shared, tests backend/pixi pertinents, smokes backend requis, `yarn static-check`, QA fonctionnelle agent si runtime disponible.

## Progress (rempli pendant le run)

- 2026-05-28 13:27 CEST — Préflight OK : fiche `PLANNED`, worktree clean, règles/specs/briefings chargés.
- 2026-05-28 13:27 CEST — Cartographie bornée : constante shared, `WorldConfigService`, estimation Pixi via shared, docs mobilité/tempo, fixtures `travelSpeed`.
- 2026-05-28 13:31 CEST — Build shared, test backend ciblé, tests Pixi, préflight smoke, smokes backend complets et static-check verts.
- 2026-05-28 13:38 CEST — QA worktree démarrée : DB temporaire `battleforthecrown_040`, backend `http://localhost:15002`, frontend `http://localhost:5174`, health OK.
- 2026-05-28 13:45 CEST — Review indépendante re-run : `VERDICT: GO`, aucun finding restant.

## Décisions prises

- Piste B (changer `REFERENCE_SPEED` de `100 → 6`) retenue à la planification — préserve table 08, ratios trivialement intacts, 1 constante shared modifiée. Source : décision user `$bftc-plan` 2026-05-26.
- Sémantique reformulée explicitement dans 08-units.md et docstring shared (pas de fallback ni alias rétro-compat).

- Backprop `SPEC.md` non faite : l'invariant est déjà porté par les docs gameplay/architecture mises à jour, pas par un bug récurrent transversal nécessitant §V/§B.

## Rapport final

Recalibration appliquée : `REFERENCE_SPEED` passe de 100 à 6 dans shared, les ratios `UNIT_STATS.speed` restent inchangés, les assertions backend sont formulées à partir de `distance × 60_000 × REFERENCE_SPEED / armySpeed`, et les docs mobilité/tempo clarifient que la baseline de trajet est distincte des ratios d'unités.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] `REFERENCE_SPEED = 6` et docstring reformulée — `rtk grep -n "REFERENCE_SPEED = 6" packages/shared/src/logic/travel-time.ts` → constante trouvée ligne 9.
  - [x] `UNIT_STATS.*.speed` non modifiés — `rtk git diff -- packages/shared/src/army/unit.ts` → diff vide.
  - [x] Invariant `armySpeed = REFERENCE_SPEED`, `tempo = 1`, `distance × 60_000` — `rtk yarn workspace battleforthecrown-backend test -- world-config.service.spec.ts` → 28 tests verts.
  - [x] Symétrie aller/retour préservée — `rtk yarn workspace battleforthecrown-backend test:smoke` → `combat-attack`, `recall-en-route`, `reinforcements` verts, retour basé sur `outboundTravelMs` figé.
  - [x] Assertions magiques recalibrées en formule lisible — `rtk yarn workspace battleforthecrown-backend test -- world-config.service.spec.ts` → 28 tests verts.
  - [x] ETA Pixi passe par shared + tempo, sans override local — `rtk grep -n "calculateTravelTime\\|TempoService.applyDuration" battleforthecrown-pixi/src/features/combat/AttackDetailModal.tsx battleforthecrown-pixi/src/lib/combatHelpers.ts` → wrapper shared + application tempo confirmés.
  - [x] Docs mobilité/tempo alignées — `rtk grep -n "REFERENCE_SPEED\\|mobilité 100\\|speed = 6" docs/gameplay/08-units.md docs/gameplay/11-scouting.md docs/gameplay/23-world-tempo-and-multipliers.md docs/architecture/balance-and-tempo.md` → ancienne sémantique remplacée.
  - [x] Audit exemples chiffrés trajet `04/10/11/13/14` — `rtk grep -n "speed=100\\|1 tuile par minute\\|distance × 100\\|≈ instantané" docs/gameplay/04-combat.md docs/gameplay/10-conquest.md docs/gameplay/11-scouting.md docs/gameplay/13-barbarian-conquest.md docs/gameplay/14-pvp-conquest.md` → aucun reste bloquant.
  - [x] Audit double compression `tempo.travelSpeed` — `rtk grep -n "travelSpeed" battleforthecrown-backend/prisma battleforthecrown-backend/scripts battleforthecrown-backend/test/fixtures` → seed à `1`, fixture smoke ultra-compressée explicite `0.001`, migrations historiques uniquement.
  - [x] Wall-clock invariants non modifiés — `rtk git diff -- docs/gameplay/23-world-tempo-and-multipliers.md` → diff limité à la ligne mobilité §6, pas §6.1.
- **Review indépendante** : Déclenchée (raison : back+front via ETA Pixi + docs gameplay/architecture + invariant durable de baseline mobilité). Premier verdict `BLOCK` uniquement parce que les preuves QA n'étaient pas encore reportées ; re-review `GO`, aucun finding restant.
- **Tests automatisés** :
  - `rtk yarn workspace @battleforthecrown/shared build` → vert.
  - `rtk yarn workspace battleforthecrown-backend test -- world-config.service.spec.ts` → 1 suite, 28 tests verts.
  - `rtk yarn workspace battleforthecrown-pixi test` → 41 fichiers, 211 tests verts. Warning jsdom canvas connu : `HTMLCanvasElement.getContext()` non implémenté.
  - `rtk yarn static-check` → vert.
- **Smokes lancés** :
  - `rtk yarn test:smoke:preflight` → OK, template `battleforthecrown_smoke` migré, 8 clones fresh prêts.
  - `rtk yarn workspace battleforthecrown-backend test:smoke` → 25 suites, 53 tests verts. Logs transitoires PgBoss/Prisma pendant arrêt worker observés, sans échec Jest.
- **Smokes ajoutés/modifiés** : Aucun, raison : les smokes existants couvrent déjà combat, scout, conquête, recall, renforts avec assertions relatives / effets DB-Outbox.
- **QA fonctionnelle agent** : Serveurs worktree démarrés depuis ce checkout avec DB temporaire clonée `battleforthecrown_040`. `curl -fsS http://localhost:15002/health` → database `up`; `curl -fsSI http://localhost:5174/` → `HTTP/1.1 200 OK`. URLs : app `http://localhost:5174/`, design system `http://localhost:5174/design-system`, backend health `http://localhost:15002/health`. Cleanup DB après QA : `docker exec battleforthecrown-postgres dropdb -U postgres --if-exists battleforthecrown_040 --force`.
- **Tests IG à faire par le user** :
  - [ ] Ouvrir `http://localhost:5174/`, monde tempo 1.0, `AttackDetailModal` sur un village barbare proche avec MILICE : ETA ≤ 6 min pour ≤ ~8 cases.
  - [ ] Même cible avec CAVALIER : temps ≈ 3,5× plus rapide que MILICE.
  - [ ] Envoi conquête avec SEIGNEUR + escorte : durée ≈ 2× celle d'une MILICE seule, lisible dans le modal puis dans l'expédition.

## Points d'attention

- ⚠️ **Conflit apparent doc 23 § 6** : "Mobilité intouchable, scaling via tempo.travelSpeed". L'invariant porte sur les **ratios** entre unités (CAV > INF > siège), pas sur la constante de baseline. Reformulation **obligatoire** dans le run pour éviter contradiction future.
- ⚠️ **Double compression possible** : si un seed/fixture pose `tempo.overrides.travelSpeed` ailleurs que via override explicite world-config, on compresse deux fois. Audit `rg` obligatoire.
- ⚠️ **Assertions magiques** : `world-config.service.spec.ts` ligne ~254 a un commentaire « 10 tiles × REFERENCE_SPEED / (REFERENCE_SPEED × 1) = 10 minutes » mais asserte `toBe(600000)` en dur. Refactorer en formule lisible pour éviter de re-tomber dans le piège lors d'une future recalibration.
- ⚠️ **Pas de migration DB** — la constante est dans shared, pas dans `WorldConfig`. Les mondes existants ressentent le changement au reboot. Pas de wipe nécessaire.
- ⚠️ **Wall-clock invariants** (§ 6.1 doc 23) : NE PAS modifier bouclier 48 h, cooldown style 24 h, reset 04:00, abandon 14 j. Faux positif possible si grep trouve `48 h` quelque part.
- ⚠️ **Vérifier `UNIT_STATS.speed` autres consommateurs** : doit être consommé uniquement par `calculateTravelTime` + `findSlowestUnitSpeed`. Si le score puissance utilise `speed` (à vérifier dans `power/units-catalog.spec.ts`), c'est une fixture exposée et non un input du calcul — confirmer en cartographie.

## Liens détectés

- **À faire avant** : Aucun (plomberie déjà en place).
- **À faire après** : Aucun direct.
- **Doublon potentiel** : Aucun ([`35-return-travel-time-recomputed-vs-spec`](../archive/35-return-travel-time-recomputed-vs-spec.md) portait sur la symétrie retour, pas la baseline ; [`52-conquest-capture-time-speed-multiplier`](../archive/52-conquest-capture-time-speed-multiplier.md) portait sur la capture, pas le trajet).
- **Connexe (contexte)** :
  - [`tasks/runs/archive/026-world-tempo-plumbing-clean-cut`](./archive/026-world-tempo-plumbing-clean-cut.md) — axe `travelSpeed` exposé.
  - [`tasks/runs/archive/027-world-tempo-recalibrate-mvp-constants`](./archive/027-world-tempo-recalibrate-mvp-constants.md) — recalibration ÷4 sans toucher mobilité.
  - [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) § 5/6/7 — spec tempo.
- **Déjà résolu (archive)** : Aucun.
- **Keywords scannés** : `travel`, `speed`, `tempo`, `movement`, `expedition`, `march`, `trajet`, `multiplier`, `mobility`, `mobilité`.

## Liens

- Spec : [`docs/gameplay/08-units.md`](../../docs/gameplay/08-units.md), [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md), [`docs/architecture/balance-and-tempo.md`](../../docs/architecture/balance-and-tempo.md)
- Code : [`packages/shared/src/logic/travel-time.ts`](../../packages/shared/src/logic/travel-time.ts)
- Runs amont (plomberie + recalibration éco) : [`026`](./archive/026-world-tempo-plumbing-clean-cut.md), [`027`](./archive/027-world-tempo-recalibrate-mvp-constants.md)
