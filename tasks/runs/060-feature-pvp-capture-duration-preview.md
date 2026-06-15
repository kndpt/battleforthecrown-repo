# Run #060 — feature-pvp-capture-duration-preview

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 7 — Conquête PvP (MVP léger, dette UX pré-câblée par la spec)
- **Spec source** : [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md) § Période de capture variable selon le niveau du Château (lignes ~73-93) + § Visibilité de la durée
- **Type** : `feature`
- **Modules backend** : `combat/capture-duration.ts`, `combat/scout-report.presenter.ts`, DTOs scout
- **Modules frontend** : `features/combat/AttackDetailModal.tsx`, `features/world/SelectedEntityPanel.tsx`, view rapport scout
- **Modules transverses** : `packages/shared/src/combat/` (helper pur partagé back+front), DTO `ScoutReportResponse`

## Contexte

La spec `14-pvp-conquest.md` § Période de capture tranche MVP : **« Visibilité de la durée : pré-affichée sur le panneau d'info du village ennemi et dans le rapport de scout. Aligné sur la spec barbare. »** Pour les barbares, c'est déjà le cas (`AttackDetailModal.tsx:118` consomme `getBarbarianCaptureDurationLabel(target.tier)`). Pour les villages joueurs, **rien** n'est exposé côté UI — alors que la durée varie de 1h (Château 1-2) à 4h30 (Château 9-10), info structurante pour décider d'engager un Seigneur.

Côté backend, la table `PVP_CAPTURE_DURATIONS_MS` + `getPvpCaptureDurationMs(castleLevel)` existe déjà dans [`battleforthecrown-backend/src/modules/combat/capture-duration.ts`](../../battleforthecrown-backend/src/modules/combat/capture-duration.ts) (lignes 12-34), mais elle est appelée uniquement à l'installation du Seigneur (run 047 — Rapports de capture). Aucun helper pur shared n'expose cette table aux consommateurs front, et le presenter scout `scout-report.presenter.ts` n'inclut que `wallLevel` dans `details`, jamais le `castleLevel` de la cible.

Le ticket archivé [`tasks/archive/25-capture-duration-visibility-asymmetry.md`](../../archive/25-capture-duration-visibility-asymmetry.md) (résolu 2026-05-09) confirme la décision design et explicite la dette : _« Implémentation : à intégrer dans le panneau d'info village (front + DTO `world-entities`) le jour où la conquête PvP/barbare sera câblée côté UI. »_ Le câblage est désormais en place ; l'implémentation devient possible et nécessaire.

## Dépendances

- Conquête PvP backend déjà en place (run 047 — `feature-capture-reports`).
- Conquête barbare frontend déjà en place (run 019 — preview `Fenêtre de capture` côté barbare).
- `WorldEntityDto.data.castleLevel` déjà exposé pour villages joueurs ([`packages/shared/src/world/dtos.ts:72`](../../../packages/shared/src/world/dtos.ts)), donc côté carte/panneau pas de migration de contrat REST.
- Pas de dépendance bloquante avec `056-feature-pvp-newbie-shield-48h`, `058-feature-pvp-power-third-attack-guard` ni `059-feature-threat-estimate-pre-attack` — ces runs touchent le même `SelectedEntityPanel.tsx` côté CTA attaque, mais l'ajout du badge fenêtre est orthogonal (zone d'info, pas CTA). À séquencer par ordre d'arrivée pour éviter le conflit textuel sur le composant.

## Critère de fin (acceptance)

- [ ] `packages/shared/src/combat/` expose un helper pur `getPvpCaptureDurationMs(castleLevel)` + un label formaté (ex `getPvpCaptureDurationLabel`) consommables côté front. Tests purs couvrant les 5 paliers (1-2 → 1h, 3-4 → 1h30, 5-6 → 2h15, 7-8 → 3h, 9-10 → 4h30) et le fallback (castleLevel hors borne ou `null`). _(auto : test shared)_
- [ ] La table `PVP_CAPTURE_DURATIONS_MS` du backend (`battleforthecrown-backend/src/modules/combat/capture-duration.ts`) est ré-exportée depuis le helper shared OU consomme directement le helper shared (source de vérité unique, plus de duplication). _(auto : grep + test)_
- [ ] `getCaptureDurationMs` continue d'appliquer le tempo monde (`TempoService.applyDuration`) — la conversion tempo reste backend-only ; le label frontend ne doit jamais appliquer le tempo (preview = base, pas valeur tempo-adjusted). Le label doit explicitement noter qu'il s'agit de la durée de base (cf. spec barbare : pas de tempo dans le preview). _(auto : test + grep)_
- [ ] `AttackDetailModal.tsx` affiche la section « Fenêtre de capture » pour une cible PLAYER en mode `attack` quand le `castleLevel` est connu, en utilisant le helper shared. Le label reste `Inconnue` si `castleLevel == null`. _(auto : test + visuel)_
- [ ] `SelectedEntityPanel.tsx` affiche un badge ou ligne « Fenêtre de capture » sur le panneau d'info d'un village joueur ennemi (au même endroit que la durée barbare), lecture seule, sans interférer avec les CTA d'attaque/scout/renfort. _(auto : test léger + visuel)_
- [ ] Le rapport scout d'une cible joueur expose `castleLevel` dans `details` (DTO `ScoutReportResponse`), persisté par `presentScoutReport`, snapshot au moment du scout (déjà la convention). L'écran rapport scout affiche la « Fenêtre de capture » dérivée. _(auto : test presenter + smoke scout)_
- [ ] Migration ou backfill du champ scout : si la colonne `details` Prisma existante peut accueillir `castleLevel` sans migration (Json), pas de changement de schéma. Sinon, migration additive non destructive. _(auto : prisma validate + smoke)_
- [ ] Aucune divergence avec la durée appliquée backend : un combat PvP conclu confirme la même durée que le preview frontend pour le même `castleLevel` (test smoke ou assertion croisée). _(auto : smoke)_
- [ ] Docs : aucune modification spec (la spec est déjà alignée). Mise à jour de `tasks/archive/25-capture-duration-visibility-asymmetry.md` pour pointer vers ce run comme livraison effective, et de `tasks/00-mvp-roadmap.md` Phase 7 critères de fin si la liste mentionne explicitement le pré-affichage PvP. _(auto : grep)_
- [ ] Aucune régression côté preview barbare (`getBarbarianCaptureDurationLabel`) — l'extraction backend → shared préserve la table et les labels existants. _(auto : test pixi `barbarianConquest.test.ts`)_

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`
- Workers/Outbox (rappel) : pas de mutation, donc pas d'Outbox concerné. Toute lecture front est dérivée du DTO existant.

## Décomposition initiale

> Draft de cartographie. À raffiner à l'étape 3 du `$bftc-run`.

- **T1 — Shared capture duration** : déplacer/exposer `PVP_CAPTURE_DURATIONS_MS` + `getPvpCaptureDurationMs(castleLevel)` + helper label `getPvpCaptureDurationLabel(castleLevel)` dans `packages/shared/src/combat/` (ou `packages/shared/src/combat/capture-duration.ts` neuf). Tests purs couvrant tous les paliers + fallback. ≤ 3 fichiers.
- **T2 — Backend ré-exporte le shared** : `battleforthecrown-backend/src/modules/combat/capture-duration.ts` importe la table depuis shared, garde `getCaptureDurationMs` (tempo-aware) inchangé en signature. Tests `capture-duration.spec.ts` adaptés. ≤ 2 fichiers.
- **T3 — Scout DTO + presenter** : étendre `ScoutReportResponse.details` (shared) pour accepter `castleLevel?: number`, mettre à jour `scout-report.presenter.ts` et tests presenter. Backend scout-runtime (combat worker / handler scout) doit persister `castleLevel` dans `details.castleLevel` lors du snapshot pour cibles joueurs. ≤ 4 fichiers.
- **T4 — Frontend AttackDetailModal preview PvP** : étendre la dérivation `captureDuration` : si `target.kind === 'PLAYER_VILLAGE'` et `castleLevel` connu, utiliser `getPvpCaptureDurationLabel(target.castleLevel)`. Maintenir le rendu existant barbare. Test composant. ≤ 2 fichiers.
- **T5 — Frontend SelectedEntityPanel preview PvP** : ajouter une ligne « Fenêtre de capture » dans la section d'info pour villages joueurs ennemis, alignée visuellement sur les autres badges (Puissance, état conquête). Lecture seule. Test léger. ≤ 2 fichiers.
- **T6 — Frontend rapport scout** : afficher `castleLevel` + label « Fenêtre de capture » dans la vue rapport scout côté Pixi (composant `ScoutReportView` ou équivalent). Test léger. ≤ 2 fichiers.
- **T7 — Docs + tasks** : mettre à jour `tasks/archive/25-capture-duration-visibility-asymmetry.md` (pointe vers ce run en livraison), check spec `14-pvp-conquest.md` § Visibilité (déjà alignée) et `13-barbarian-conquest.md` (mention preview), `tasks/00-mvp-roadmap.md` Phase 7 si besoin. ≤ 4 fichiers.

## Liens détectés

- **À faire avant** : Aucun. Les briques backend (`PVP_CAPTURE_DURATIONS_MS`, `WorldEntityDto.data.castleLevel`) sont en place.
- **À faire après** : Aucun (run autonome). Indirect : un run futur peut harmoniser le tempo barbare avec une note UI explicite si playtest le justifie.
- **Doublon potentiel** : Aucun. Pas de PR ouverte sur ce sujet (PR ouvertes routine `bftc-routine-gameplay-plan` : #86 `plan/gameplay/oyez-runtime-producer` uniquement, sujet exclu via JSON).
- **Connexe (contexte)** :
  - [`tasks/runs/archive/019-feature-barbarian-conquest-frontend-ui.md`](./archive/019-feature-barbarian-conquest-frontend-ui.md) — preview `Fenêtre de capture` barbare via `getBarbarianCaptureDurationLabel(target.tier)`, référence d'implémentation.
  - [`tasks/runs/archive/047-feature-capture-reports.md`](./archive/047-feature-capture-reports.md) — rapports de capture pendant fenêtre active ; ce run préserve l'asymétrie (preview vs état actif).
  - [`tasks/runs/056-feature-pvp-newbie-shield-48h.md`](./056-feature-pvp-newbie-shield-48h.md) — même surface `SelectedEntityPanel` côté CTA d'attaque, conflit potentiel d'édition à séquencer.
  - [`tasks/runs/058-feature-pvp-power-third-attack-guard.md`](./058-feature-pvp-power-third-attack-guard.md) — idem, CTA grisée puissance.
  - [`tasks/runs/059-feature-threat-estimate-pre-attack.md`](./059-feature-threat-estimate-pre-attack.md) — idem, section « Menace estimée ». La fenêtre de capture est complémentaire (état attaque-dur vs estimation incertitude).
- **Déjà résolu (archive)** : [`tasks/archive/25-capture-duration-visibility-asymmetry.md`](../archive/25-capture-duration-visibility-asymmetry.md) — décision design tranchée (aligner partout), doc mise à jour, **implémentation explicitement reportée** au câblage UI conquête. Ce run livre la dette.
- **Keywords scannés** : `capture-duration`, `capture-window`, `capturePreview`, `pvp-capture`, `castleLevel-capture`, `Fenêtre de capture`, `PVP_CAPTURE_DURATIONS_MS`.

## Points d'attention

- **Tempo monde** : le preview frontend doit afficher la **durée de base** (pas tempo-adjusted), aligné avec le preview barbare. Justifier : (a) le tempo monde est lisible séparément par le joueur, (b) afficher une durée tempo-adjusted demande de fetcher le `WorldConfig.tempo` côté composant et brouille la lecture comparative ; (c) la durée appliquée à l'installation reste tempo-adjusted serveur-side comme aujourd'hui. À documenter dans le code et la spec si elle n'est pas explicite.
- **Snapshot dans le scout** : la spec 14-pvp § Période de capture précise « Snapshot du niveau Château figé au moment de l'installation du Seigneur ». Pour le scout, c'est différent : c'est un snapshot au moment T du scout — l'écart est attendu et lisible (l'âge de l'intel est déjà affiché côté carnet d'intel, run 055). Ne pas mélanger les deux snapshots.
- **Source de vérité unique** : éviter de dupliquer la table de durées entre backend et shared. Le backend doit importer depuis shared. Sinon dérive garantie au prochain ajustement de la courbe.
- **Cibles barbares** : ne pas casser le preview existant. Le helper shared doit pouvoir router barbare vs joueur via deux fonctions distinctes (`getBarbarianCaptureDurationLabel(tier)` reste utilisé côté Pixi, déplacement optionnel hors scope).
- **Coexistence avec runs 056/058/059** : tous touchent `SelectedEntityPanel.tsx` côté CTA ; ce run touche la zone d'info. Si un de ces runs land avant celui-ci, prévoir un merge léger sans conflit logique.
- **Pas de migration Prisma forcée** : `ScoutReport.details` est Json, l'ajout de `castleLevel` ne nécessite pas de migration. Le `presenter` change, le smoke vérifie la lecture.
- **Review indépendante requise** : back+front simultanés + invariant durable affiché au joueur. Critères (a) et (d) du template.

## Estimation scope

`medium` — ~6-8 fichiers, scope clair, pas de découpage `$bftc-slice` nécessaire.
