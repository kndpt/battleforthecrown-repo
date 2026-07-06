# Run #095 — feature-multi-village-state-alerts

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 9 — Navigation multi-village (promotion lab 06, axe « alertes d'état »).
- **Spec source** : `docs/gameplay/lab/tickets/06-multi-village-governance.md` (axe « alertes ») + `docs/gameplay/22-village-roles-and-navigation.md` §Évolutions post-MVP (L78-79).
- **Type** : feature
- **Modules** : frontend `battleforthecrown-pixi` (multi-village sheet + helper de dérivation) ; docs (spec 22 + lab 06). **Backend : aucun.**

## Objectif

Le `MultiVillageBottomSheet` expose déjà la primitive `AlertPill` + le filtre `alerts`, mais **rien ne peuple `village.alert`** — le run 031 a livré le shell et a explicitement différé la dérivation (acceptance T2 « rendu MVP sans alertes inventées »). Ce run dérive et affiche des **alertes d'état** (`kind: 'warning'` uniquement) à partir des données multi-village **déjà fetchées** par `useMultiVillageData`, **purement présentationnelles, zéro effet gameplay** (garde-fou anti-snowball).

Périmètre MVP retenu :
- **Entrepôt plein** : ≥1 ressource atteint son cap (`maxPerType`).
- **File inactive** : aucune construction ni formation en cours pour le village.

Hors scope explicite :
- `kind: 'attack'` (attaque entrante) : l'alerte par village dans le **sélecteur multi-village** est un **gap ouvert distinct** du subject 086 — 086 livre la section « Attaques entrantes » du `KingdomActivities` (surface différente), il ne couvre PAS le `village.alert` du sélecteur. À tracer via le successeur différé « incoming-threats-by-village » de run 031.
- **Garnison faible** → différé (seuil « faible » non tranché + aucun fan-out garrison actuel, cf. Points d'attention).
- Presets de rôle à impact gameplay + vue consolidée riche (autres axes lab 06 — restent non planifiés).

## Dépendances

- Aucun prérequis bloquant. Run 031 (archive) a livré le shell (`AlertPill`, filtre `alerts`) + les fan-outs data (`useMultiVillageData`).

## Critère de fin (acceptance)

- [ ] `deriveVillageStateAlert` émet `kind:'warning'` « entrepôt plein » quand ≥1 ressource atteint le cap (`maxPerType`). — _(auto)_
- [ ] émet `kind:'warning'` « file inactive » quand aucune construction ni formation en cours pour le village. — _(auto)_
- [ ] retourne `null` quand aucune donnée d'état n'est disponible (pas d'alerte inventée — invariant hérité de 031). — _(auto)_
- [ ] priorité déterministe et testée quand plusieurs conditions sont vraies (`alert` singulier → 1 seule alerte). — _(auto)_
- [ ] ce chemin de dérivation n'émet **jamais** `kind:'attack'`. — _(auto : test + grep)_
- [ ] `buildMultiVillageSheetItems` peuple `village.alert` depuis la dérivation. — _(auto : test)_
- [ ] le filtre `alerts` n'affiche que les villages porteurs d'un warning dérivé. — _(auto + visuel)_
- [ ] `yarn static-check` vert (tsc --noEmit + eslint --quiet). — _(auto)_
- [ ] note MVP-léger présentationnelle ajoutée dans spec 22 + statut lab 06 mis à jour. — _(auto : grep)_
- [ ] rendu `AlertPill` lisible sur mobile dans le sheet (message + eta/tiret cohérents). — _(visuel — Kelvin)_

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-react-hud`, `bftc-tests-policy`, `bftc-qa`
- Prédécesseur : `tasks/runs/archive/031-feature-multi-village-bottom-sheet-selector.md`
- Composant cible : `battleforthecrown-pixi/src/features/design-system/components/MultiVillageBottomSheet.tsx` ; dérivation : `battleforthecrown-pixi/src/features/layout/multiVillageSheet.ts` ; data : `useMultiVillageData.ts`.

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1** — Helper pur `deriveVillageStateAlert(runtime)` → `MultiVillageAlert | null` (`kind:'warning'` forcé) : conditions entrepôt plein + file inactive, seuils constants nommés, priorité déterministe si plusieurs. ≤2 fichiers.
- **T2** — Brancher dans `buildMultiVillageSheetItems` (`multiVillageSheet.ts`) : set `alert` depuis la dérivation ; libellés FR des messages. ≤2 fichiers.
- **T3** — Tests unitaires dérivation (`multiVillageSheet.test.ts`) : chaque condition, priorité, `null` quand data absente, jamais `kind:'attack'`.
- **T4** — Docs : note MVP-léger présentationnel dans spec 22 (L78-79) + MAJ statut lab ticket 06.
- **T5** — QA / review indépendante / static-check / commit + archive.

## Points d'attention

_(À trancher à l'étape 1 du pipeline `$bftc-run`.)_

- **Sémantique `eta`** : `MultiVillageAlert.eta` est conçu pour `kind:'attack'` (temps avant impact). Pour un warning d'état, pas d'`eta` naturel → laisser tiret/vide (reco) ou dériver un « temps avant plein » (nécessite le taux de prod, hors data actuelle).
- **Seuil « entrepôt plein »** : `n ≥ max` (100 %, reco pour éviter le bruit) vs alignement sur le `nearFull` existant (0.9) de `ResourceChip`. Cf. point à trancher lab « alertes critiques vs bruit ».
- **« File inactive » — risque de bruit (à trancher)** : la condition « aucune construction ni formation en cours » est **très fréquente et souvent bénigne** (village au niveau max, village-ressource laissé sans file volontairement, queue juste terminée) → risque de **faux positif systématique / fatigue d'alerte** sur une grande partie du parc, à l'encontre de l'objectif « alertes ciblées ». Définir un garde-fou : durée d'inactivité minimale, exclure les villages dont tous les bâtiments pertinents sont au max, ou restreindre la portée. Décider aussi d'inclure ou non la formation seigneur/noble (`trainingByVillageId` contient les nobles) dans le « en cours ».
- **Priorité** (`alert` singulier) : figer l'ordre. Proposition : entrepôt plein > file inactive.
- **Garnison faible** (différé) : `useGarrisonQuery` est per-village uniquement (`GET /combat/:villageId/garrison`), aucun `garrisonQueryOptions` pour fan-out `useQueries`, seuil non tranché → follow-up dédié.
- **Backprop doc** : promouvoir une **note MVP-léger dans spec 22** (reco — scope trop petit pour une spec dédiée). Garde-fou explicite à écrire : alertes présentationnelles, zéro effet gameplay, aucune écriture serveur.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

- [ ] _(critère)_ — `<cmd>` → _(résultat)_
- **Review indépendante** : **requise** — invariant durable « ne jamais présenter de données multi-village trompeuses » hérité de 031 + première définition de seuils d'alerte + décision archi client-vs-server à figer + composant partagé (`GameHeader`/`VillageView`). Aligné sur le précédent 031.
- **Tests automatisés** : _(à remplir)_
- **Tests IG user** : rendu `AlertPill` mobile dans le sheet (Kelvin).
