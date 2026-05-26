# Run #040 — recalibrate-base-travel-speed

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

Pistes pour le lead `$bftc-run` :
- **T1** — Shared : `travel-time.ts` (constante + docstring). Rebuild shared.
- **T2** — Backend tests : `world-config.service.spec.ts` recalibré + refacto assertions magiques.
- **T3** — Docs gameplay/spec : 08 + 23 + balance-and-tempo, formules et exemples.
- **T4** — Audit grep exemples chiffrés dans 04/10/11/13/14, patcher le cas échéant.
- **T5** — Vérif fixtures/seed (pas de double compression `tempo.travelSpeed`).
- **T6** — Smokes + static-check + QA IG.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

- Piste B (changer `REFERENCE_SPEED` de `100 → 6`) retenue à la planification — préserve table 08, ratios trivialement intacts, 1 constante shared modifiée. Source : décision user `$bftc-plan` 2026-05-26.
- Sémantique reformulée explicitement dans 08-units.md et docstring shared (pas de fallback ni alias rétro-compat).

_(Reste à compléter par le lead pendant le run.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** : à remplir.
- **Review indépendante** : `Déclenchée (raison : (a) back+front via ETA Pixi, (b) modifie SPEC.md sur 3 docs, (c) diff probable > 100 lignes, (d) invariant durable de baseline mobilité)` — verdict à reporter en étape 6.
- **Tests automatisés** : à remplir avec commandes exactes.
- **Smokes ajoutés/modifiés** : probablement aucun nouveau smoke (assertions relatives) — à confirmer.
- **QA fonctionnelle agent** : couvrir au minimum un envoi MILICE/CAV via REST + check `Expedition.travelMs` en DB.
- **Tests IG à faire par le user** : checklist 3 items (MILICE proche, ratio CAV, SEIGNEUR conquête) — voir § QA in-game ci-dessus.

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
