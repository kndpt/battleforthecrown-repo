# Run #090 — scout-precision-by-spy-count

> **Statut** : DONE
> **Démarré** : 2026-07-05
> **Terminé** : 2026-07-05

## Cible

- **Phase roadmap** : Phase 4 — Scouting (enrichissement post-livrable de base)
- **Spec source** : [`docs/gameplay/lab/tickets/03-scouting-information-quality.md`](../../docs/gameplay/lab/tickets/03-scouting-information-quality.md) — § Piste (1/3/10 espions), § Points à trancher (4 arbitrages). Rattachement : [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md).
- **Type** : feature
- **Modules** : backend (combat worker + scout-report presenter) | frontend (scoutReportView + ScoutReportCard + ReportDetailModal) | shared (contrat `ScoutReportResponse` + module pur précision)

## Objectif

Aujourd'hui un scout révèle **toujours** la composition exacte + le stock exact, quel que soit le nombre d'ESPIONS envoyés. Le compte d'espions n'est stocké que cosmétiquement dans `details.scoutUnits`, jamais exploité pour flouter.

Objectif : la précision du rapport **scale avec le nombre d'ESPIONS** (1 → vague, 3 → fourchettes par type, 10 → précis). L'information devient une ressource stratégique : scout rapide vs scout fiable vs attaque à l'aveugle.

**Preuves de gap (vérifiées)** :
- `battleforthecrown-backend/src/modules/combat/combat.worker.ts` (~L1752-1788) : `scoutReport.create` écrit `units: encodeUnitMap(snapshot.units)` + `resources: snapshot.resources` verbatim ; `details.scoutUnits` = compte espions non exploité.
- `combat.worker.ts` (~L1790-1808) : `recordIntel(...)` persiste **aussi** le snapshot exact dans l'intel notebook (2ᵉ canal exact à traiter).
- `battleforthecrown-backend/src/modules/combat/scout-report.presenter.ts` (L80-84) : renvoie `parseUnitMap` + `parseLootResourcesWithDefaults` exacts, aucun champ précision.
- `packages/shared/src/combat/dtos.ts` (~L112-147) : `ScoutReportResponse.units: UnitMap` / `resources: LootResources` — aucun champ précision.
- `rg -i "precision|fourchette|spyCount|accuracy|scoutPrecision"` sur `battleforthecrown-backend/src/modules/combat`, `packages/shared/src/combat`, `packages/shared/src/threat` → **0 match**.

## Dépendances

- Base scout existante : runs 016/017 (archivés).
- Coordination merge sur le même DTO/card avec PR ouvertes : 055 intel-notebook, 059 threat-estimate, 081 scout-report badge, 089 (#235) inactivity badge. Pas de doublon fonctionnel.

## Critère de fin (acceptance)

Automatisables (unit/smoke) :

- [ ] Fonction pure de précision : `1 SPY → "vague"`, `3 → "fourchettes"`, `10 → "précis"` (bornes figées en T1). Spec unitaire shared verte.
- [ ] Scout à 1 espion : `ScoutReportResponse` ne renvoie **pas** la compo exacte (units) ni le stock exact (resources).
- [ ] Scout au seuil "précis" : compo + stock exacts (parité avec le comportement actuel).
- [ ] `ScoutReportResponse` porte un champ précision typé ; `schemas.ts` valide les 3 paliers ; `yarn static-check` vert.
- [ ] Presenter ne crashe sur aucun palier (rapports barbares + joueurs) ; anciens rapports sans champ précision restent lisibles (rétrocompat).

Visuels (checklist Kelvin IG, ≤5) :

- [ ] Rapport 1 espion : armée/stock en estimation vague, aucun chiffre exact.
- [ ] Rapport 3 espions : fourchettes par type d'unité lisibles.
- [ ] Rapport 10 espions : chiffres exacts comme avant.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-workers-outbox`
- **Review indépendante requise** : oui — change un contrat shared (`ScoutReportResponse`) consommé par plusieurs surfaces + PR concurrentes sur le même rapport ; décision design (irréversibilité du flou, cohérence intel notebook) à valider avant merge.

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — Décision design (gate étape 1)** : figer seuils (fixes 1/3/10 recommandé), forme d'approximation (fourchettes déterministes recommandé vs bruit RNG à seeder), portée (stock + armée + style catégoriel), stockage (flou à l'écriture vs exact + flou au présent). Consigner dans `11-scouting.md` + statut lab/03. Trancher la propagation à l'intel notebook.
- **T2 — shared** : module pur `packages/shared/src/combat/scout-precision.ts` (constantes seuils + fn pure blur unités/ressources) + specs unitaires. Pattern aligné sur `threat/constants.ts`.
- **T3 — shared** : étendre `ScoutReportResponse` (`dtos.ts` + `schemas.ts`) avec champ précision + forme des valeurs approximées ; rebuild `@battleforthecrown/shared`.
- **T4 — back** : `combat.worker.ts` — dériver la précision depuis `details.scoutUnits` au `scoutReport.create` ; appliquer le choix de stockage.
- **T5 — back** : cohérence `recordIntel`/intel notebook (propager ou non la précision) + `scout-report.presenter.ts` (exposer/appliquer le champ précision).
- **T6 — front** : `scoutReportView.ts` + `ScoutReportCard.tsx` + `ReportDetailModal.tsx` — rendu fourchettes/label incertitude selon précision.
- **T7 — front** : `scoutReportView.test.ts` (couvrir les 3 paliers).
- **T8 — docs** : `11-scouting.md` (nouvelle mécanique) + statut lab/03.

## Points d'attention

- `recordIntel` persiste le snapshot **exact** dans l'intel notebook (canal séparé du scoutReport). Si le flou n'est appliqué qu'au scoutReport, l'intel notebook (run 055) contourne la mécanique → décider en T1.
- Le style stratégique est catégoriel (pas de fourchette naturelle) : décider s'il est masqué sous un seuil ou toujours révélé.
- Bruit aléatoire ⇒ RNG à seeder pour tests déterministes ; fourchettes ⇒ déterministe (recommandé).
- Rétrocompat : rapports existants (`units`/`resources` exacts déjà en base) → presenter tolérant à l'absence de champ précision (pattern `newbieShield`/`defensiveFriends`).
- Coordination merge avec PR ouvertes 055/059/081/089 touchant le même DTO/card.
- Risque de perte d'ESPION (ticket § « post-MVP ? ») : **hors scope** proposé.

## Décisions prises

_(git history)_ — T1 design gate consigné dans `docs/gameplay/11-scouting.md` § Qualité du renseignement + `SPEC.md` V13.

## Rapport final

Précision de scout scale avec le nombre d'ESPIONS (1→VAGUE, 3→RANGED, 10→PRECISE), flou **déterministe au presenter** (DB garde l'exact), dérivé de `details.scoutUnits.SPY` → **zéro migration, rétrocompat auto**. Miroir cohérent au carnet d'intel (pattern « si révélé »). Incident corrigé au passage : `naturalTrait` (spec 27) était strippé au boundary client (absent du schema). Dette préexistante (parse top-level `units`/`resources` non gardé) flaggée en task séparée.

### Acceptance & QA

Critères d'acceptance vérifiés :
- [x] Fonction pure 1/3/10 (bornes figées) — `yarn workspace battleforthecrown-pixi test -- --run scout-precision` → 45 assertions vertes
- [x] Scout 1 espion : pas de compo/stock exacts — `yarn workspace battleforthecrown-backend test -- scout-report.presenter` → VAGUE ⇒ `units`/`resources`/`strategy` = null (28 tests)
- [x] Scout PRECISE : compo + stock exacts (parité) — presenter spec PRECISE + smoke `intel` 10 SPY
- [x] Champ précision typé + schema valide 3 paliers + static-check — `yarn static-check` → vert (tsc+eslint back+pixi)
- [x] Presenter ne crashe sur aucun palier + rétrocompat anciens rapports — presenter spec (`scoutUnits` absent/corrompu → VAGUE, champ omis, `.parse()` client OK)

Review indépendante : Déclenchée (raison : back+front + contrat shared modifié + diff>100 + invariant durable). CodeRabbit CLI local, 3 rounds — verdict final **GO** (3 findings majeurs successifs résolus : parseUnitMap non gardé, `scoutUnits` réémis brut, tests manquants).

Tests automatisés : backend `yarn workspace battleforthecrown-backend test` → 565 · pixi `yarn workspace battleforthecrown-pixi test` → 954 · (inclut shared scout-precision 45, presenter scout 28).

Smokes lancés : Ciblés (après `test:smoke:preflight`) — `test:smoke:run -- scouting intel combat-reports-inbox cross-player-reinforcement pvp-newbie-shield` → **21 verts**. Périmètre = flux scout job → scoutReport → carnet d'intel + inbox.

Smokes ajoutés/modifiés : `test/intel.smoke.spec.ts` — scouts bumpés à 10 espions (PRECISE) pour préserver l'assertion carnet exact + révélation `strategy` (tests dedup/losing-combat laissés en VAGUE, non concernés).

QA fonctionnelle agent : couverte par les smokes (bout-en-bout scout→intel) + presenter spec. Non nécessaire en curl manuel.

Tests IG à faire par le user :
- [ ] Rapport **1 espion** : armée/stock en magnitude vague (`Ampleur`/`Stock` catégoriels), aucun chiffre exact, style « Inconnu ».
- [ ] Rapport **3 espions** : fourchettes `min–max` par unité et par ressource lisibles.
- [ ] Rapport **10 espions** : chiffres exacts (parité avant/après).
- [ ] Verdict « Fiabilité » + note explicative affichés selon le palier.
- [ ] Badge « Trait naturel » d'un rapport scout (fix incident schema) s'affiche.

_(Serveurs non démarrés : run scheduled autonome, user absent — checklist IG fournie ci-dessus, cf. `.agents/rules/qa.md`.)_

Docs : mises à jour `docs/gameplay/11-scouting.md` (§ Qualité du renseignement), `docs/gameplay/lab/tickets/03-scouting-information-quality.md` (statut ✅), `SPEC.md` (invariant V13), `tasks/lessons.md`.
