# Run #027 — world-tempo-recalibrate-mvp-constants

> **Statut** : DONE
> **Démarré** : 2026-05-17
> **Terminé** : 2026-05-17

## Cible

- **Phase roadmap** : Hors roadmap — chantier pré-MVP (recalibration tempo, suite directe du Run 026, cf. [`docs/gameplay/23-world-tempo-and-multipliers.md § 7`](../../docs/gameplay/23-world-tempo-and-multipliers.md))
- **Spec source** : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) — § 1 (compression ~4-5×), § 3 (anatomie session 60 j), § 7 (checklist de repérage)
- **Type** : spec (édition docs gameplay) + feature (constantes shared)
- **Modules backend** : `—` (pas de modification de logique)
- **Modules frontend** : `—`

## Dépendances

- ✅ **Run [`026-world-tempo-plumbing-clean-cut`](./026-world-tempo-plumbing-clean-cut.md) DONE** — sans la plomberie `tempo`, les chiffres recalibrés tomberaient dans un schéma legacy. Bloquant strict.

## Critère de fin (acceptance)

- [x] Cap « première conquête » jouable en J+5 à J+7 sur scénario scripté (cf. § 3 de la spec).
- [x] Cible « ~1 mois pour maxer un village » descendue à 10-15 j (§ 7 de la spec).
- [x] Toutes les colonnes "Temps (s)" de `03-buildings.md` recalibrées à `tempo.global = 1.0` du Standard MVP compressed.
- [x] Régénération barbare (`06-barbarians.md` § Régénération) : ressources vide → plein ~12 h 30 à 25 h ; troupes ~25 h à 50 h.
- [x] Entraînement Seigneur (`10-conquest.md`) : 8 h → 2 h.
- [x] Fenêtres de capture barbare (`13-barbarian-conquest.md`) : courbe 2/4/6/9/12 h → 30 min / 1 h / 1 h 30 / 2 h 15 / 3 h.
- [x] Fenêtres de capture PvP (`14-pvp-conquest.md`) : courbe 4/6/9/12/18 h → 1 h / 1 h 30 / 2 h 15 / 3 h / 4 h 30.
- [x] `15-onboarding.md` : cible "5 étapes en ≤ 10 min" reconfirmée.
- [x] `02-economy-and-progression.md` : Phases de progression, cibles, validation économique et couronnes recalibrées.
- [x] `07-barbarian-spawning.md` : densité de spawn / catchup vérifiée vis-à-vis de la consommation joueur compressée.
- [x] `DEFAULT_CROWNS.conversionRate` et toutes les constantes de durée dans `packages/shared/src/village/` et `packages/shared/src/army/` alignées avec les nouvelles valeurs des docs.
- [x] Audit `rg` final : aucune durée legacy tempo non recalibrée dans les docs concernées ; faux positifs restants = formules de coût, mentions historiques migration, invariants wall-clock.
- [x] Invariants wall-clock **NON modifiés** (§ 6.1) : bouclier débutant 48 h, cooldown style 24 h, reset cartes 04:00, abandon 14 j.
- [x] `yarn static-check` vert ; tests pure-logic et smokes consommant des constantes shared mis à jour.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Docs progression/économie : recalibrer `02` + source tempo `23` (couronnes, production, progression 10-15 j).
- [x] Docs bâtiments/unités : recalibrer `03` et `08`, puis aligner `packages/shared/src/village/buildings.ts`, `army/unit.ts`, `resources/production.ts`, `crowns/index.ts`.
- [x] Docs barbares/conquête : recalibrer `06`, `07`, `10`, `13`, `14`, `15`, puis aligner `world/barbarian-templates.ts`.
- [x] Tests de contrat/smokes : mettre à jour les assertions backend qui verrouillent les anciennes constantes.
- [x] Vérification : build shared, tests ciblés, smokes backend, static-check, audit `rg`.

## Progress (rempli pendant le run)

- [x] Préflight : git clean, fiche `PLANNED`, run 026 archivé `DONE`, rules, `SPEC.md`, spec 23 et `bftc-tests-policy` lus.
- [x] Cartographie : docs `02/03/06/07/08/10/13/14/15/23`, constantes shared et tests de contrat localisés.
- [x] Implémentation : durées compressées `÷4` avec arrondi au multiple de 5 s ; débits production/couronnes/régen `×4`.
- [x] Tests ciblés : catalogues unités, bâtiments et templates barbares verts.
- [x] Smokes backend : premier run a révélé l'assertion scout `wood=321` devenue `323`; assertion mise à jour, suite complète verte.
- [x] Static-check : vert après `prisma generate`.
- [x] Review finale : audit legacy + 5 axes complétés dans `tasks/todo.md`.

## Décisions prises

- Compression Standard MVP appliquée à facteur 4 exact : durées `÷4`, débits `×4`.
- Arrondi des durées non divisibles au multiple de 5 s le plus proche pour rester lisible dans les specs et constant tables.
- Couronnes : `DEFAULT_CROWNS.conversionRate` passe de `0.05` à `0.20`, ce qui ramène le Seigneur mid-game d'environ 3 jours à ~18 h.
- Régénération barbare : les ressources atteignent le plein en ~12 h 30 à 25 h selon tier ; les troupes restent plus lentes (~25 h à 50 h) pour préserver la friction militaire.
- Capture barbare T4 retenue à 2 h 15 (compression exacte de 9 h) plutôt qu'un arrondi à 2 h, pour garder la courbe sourcée.
- Aucun sub-agent : le scope est large mais purement mécanique docs/constants/tests, sans modification de formule ni architecture.

## Rapport final

Run 027 livré.

- Docs gameplay recalibrées au Standard MVP compressed : économie/progression, bâtiments, barbares, spawn, unités, conquête, onboarding et spec tempo.
- Constantes shared alignées : temps bâtiments/unités, production ressources, couronnes, régen barbare.
- Tests de contrat backend et smoke scout ajustés aux nouvelles valeurs.
- Aucun changement de logique `TempoService`, backend métier ou frontend.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Première conquête J+5/J+7 cohérente avec Château 6 + Salle du Trône + Seigneur 2 h — preuve : docs `02/03/10/13` alignées + tests constants.
  - [x] Village max cible 10-15 j — preuve : `02-economy-and-progression.md` mis à jour.
  - [x] Temps bâtiments `03` et shared compressés — preuve : `yarn workspace battleforthecrown-backend test -- units-catalog.spec.ts buildings.spec.ts barbarian-tier-templates.spec.ts` vert.
  - [x] Régénération barbare compressée — preuve : `barbarian-tier-templates.spec.ts` + `yarn workspace battleforthecrown-backend test:smoke` vert.
  - [x] Seigneur 8 h → 2 h — preuve : `units-catalog.spec.ts` vert.
  - [x] Fenêtres capture barbare/PvP compressées — preuve : docs `13/14` + smokes conquest verts.
  - [x] Wall-clock intouchables préservés — preuve : audit `rg` final, seules mentions 48 h / 14 j restent dans les invariants.
- **Tests automatisés** :
  - `yarn install` — OK, dépendances worktree rafraîchies.
  - `yarn workspace @battleforthecrown/shared build` — OK.
  - `yarn workspace battleforthecrown-backend prisma generate` — OK, requis après install.
  - `yarn workspace battleforthecrown-backend test -- units-catalog.spec.ts buildings.spec.ts barbarian-tier-templates.spec.ts` — OK, 3 suites / 59 tests.
  - `yarn test:smoke:preflight` — OK.
  - `yarn workspace battleforthecrown-backend test:smoke` — OK, 23 suites / 44 tests.
  - `yarn static-check` — OK.
- **Smokes lancés** : `yarn test:smoke:preflight` + `yarn workspace battleforthecrown-backend test:smoke`, verts.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/scouting.smoke.spec.ts` ajusté pour la nouvelle régen barbare visible dans le snapshot scout.
- **QA fonctionnelle agent** : non nécessaire au-delà des smokes réels DB/REST/worker/Outbox ; le run change des constantes et docs, pas une interaction UI.
- **Tests IG à faire par le user** : Aucun test IG nécessaire, raison : aucun fichier rendu Pixi/React ni shape API consommée par le front n'a été modifié.

## Points d'attention

- ⚠️ **Cohérence inter-docs** : si `Château 6` coûte 10 j de construction et le cap « première conquête » vise J+5, contradiction. À vérifier croisé entre `02`, `03` et le cap narratif.
- ⚠️ **Wall-clock intouchables** : bouclier débutant (48 h, [`14`](../../docs/gameplay/14-pvp-conquest.md)), cooldown style (24 h, [`12`](../../docs/gameplay/12-village-styles.md)), reset cartes 04:00 ([`05`](../../docs/gameplay/05-daily-cards-and-oyez.md)), abandon 14 j ([`18`](../../docs/gameplay/18-inactivity-and-abandonment.md)). **Ne PAS scaler** — c'est un piège récurrent. Cf. § 6.1 de la spec.
- ⚠️ **Vision Watchtower** : distance géométrique en cases, **pas un temps** → intouchable.
- ⚠️ **Mobilité unités** (`speed` par unité dans `08-units.md`) : intouchable. Le scaling se fait via `tempo.travelSpeed`, sans toucher aux ratios cavalier > infanterie > siège.
- ⚠️ **Valeurs cibles approximatives** : les valeurs proposées dans § 7 (« 30 min / 1 h / 1 h 30 / 2 h / 3 h ») sont des **hypothèses** de la spec, pas des valeurs définitives. Ce run doit poser des valeurs sourcées (compression ~4-5× du baseline existant) et les justifier dans `## Décisions prises`.
- ⚠️ **Constantes shared synchronisées** : un drift entre doc et code crée des bugs latents difficiles à débusquer. Faire le pass doc → code dans la même décomposition.
- ⚠️ **Pas de modification de logique** : ce run ne touche **aucune** formule ni `TempoService`. Si une formule semble buggée pendant la recalibration, ouvrir un ticket séparé.

## Liens

- Spec : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md)
- Run précédent (bloquant) : [`026-world-tempo-plumbing-clean-cut`](./026-world-tempo-plumbing-clean-cut.md)
- Docs gameplay impactées (checklist § 7) : [`02`](../../docs/gameplay/02-economy-and-progression.md), [`03`](../../docs/gameplay/03-buildings.md), [`06`](../../docs/gameplay/06-barbarians.md), [`07`](../../docs/gameplay/07-barbarian-spawning.md), [`10`](../../docs/gameplay/10-conquest.md), [`13`](../../docs/gameplay/13-barbarian-conquest.md), [`14`](../../docs/gameplay/14-pvp-conquest.md), [`15`](../../docs/gameplay/15-onboarding.md)
