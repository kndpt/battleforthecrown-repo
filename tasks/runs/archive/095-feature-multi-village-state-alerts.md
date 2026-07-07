# Run #095 — feature-multi-village-state-alerts

> **Statut** : DONE
> **Démarré** : 2026-07-07
> **Terminé** : 2026-07-07

## Cible

- **Phase roadmap** : Phase 9 — Navigation multi-village (promotion lab 06, axe « alertes d'état »).
- **Spec source** : `docs/gameplay/lab/tickets/06-multi-village-governance.md` (axe « alertes ») + `docs/gameplay/22-village-roles-and-navigation.md` §Alertes d'état.
- **Type** : feature
- **Modules** : frontend `battleforthecrown-pixi` (multi-village sheet + helper de dérivation) ; docs. **Backend : aucun.**

## Objectif

Dériver et afficher des **alertes d'état** (`kind:'warning'` uniquement) par village dans le `MultiVillageBottomSheet`, à partir des données déjà fetchées par `useMultiVillageData`, **purement présentationnel, zéro effet gameplay**. Périmètre MVP : entrepôt plein + file inactive.

## Dépendances

- Aucun prérequis bloquant. Run 031 (archive) a livré le shell (`AlertPill`, filtre `alerts`) + fan-outs data.

## Critère de fin (acceptance)

- [x] `deriveVillageStateAlert` émet `kind:'warning'` « entrepôt plein » quand ≥1 ressource atteint le cap (`maxPerType`). — _(auto)_
- [x] émet `kind:'warning'` « file inactive » quand aucune construction ni formation en cours. — _(auto)_
- [x] retourne `null` quand aucune donnée d'état disponible (pas d'alerte inventée — invariant 031). — _(auto)_
- [x] priorité déterministe et testée (entrepôt plein > file inactive). — _(auto)_
- [x] ne émet **jamais** `kind:'attack'`. — _(auto : test + grep)_
- [x] `buildMultiVillageSheetItems` peuple `village.alert`. — _(auto : test)_
- [x] filtre `alerts` n'affiche que les villages porteurs d'un warning (câblage `village.alert` existant, inchangé). — _(auto + visuel)_
- [x] `yarn static-check` vert. — _(auto)_
- [x] note MVP-léger présentationnelle dans spec 22 + statut lab 06. — _(auto : grep)_
- [ ] rendu `AlertPill` lisible sur mobile dans le sheet. — _(visuel — Kelvin)_

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Prédécesseur : `tasks/runs/archive/031-feature-multi-village-bottom-sheet-selector.md`
- Cible : `MultiVillageBottomSheet.tsx` ; dérivation : `features/layout/multiVillageSheet.ts` ; data : `useMultiVillageData.ts`.

## Décisions prises

_(git history)_

## Rapport final

Synthèse : helper pur `deriveVillageStateAlert` (entrepôt plein `n>=maxPerType` sur wood/stone/iron, prioritaire sur file inactive = queue+training définis & vides, nobles inclus), câblé dans `buildMultiVillageSheetItems`. eta `'—'` (aucune modif `AlertPill`). Invariant 031 (`null` si pas de data) + jamais `kind:'attack'` garantis structurellement et testés.

### Acceptance & QA

- [x] entrepôt plein au cap → warning — `yarn workspace battleforthecrown-pixi test run multiVillageSheet.test.ts` → 22 passed
- [x] file inactive (rien build/forme) → warning — idem (test « idle queue »)
- [x] null sans data + pendant chargement — idem (« returns null … no invented alert », « still loading »)
- [x] priorité entrepôt plein > file inactive — idem (« prioritises warehouse full »)
- [x] jamais `kind:'attack'` — `rg -n "attack" …/multiVillageSheet.ts` → seul match = commentaire d'invariant, aucune assignation + test « never emits kind attack »
- [x] `village.alert` peuplé — idem (« populates village.alert »)
- [x] static-check — `yarn static-check` → Done (0 erreur)
- **Review indépendante** : Déclenchée (raison: diff > 100 lignes + invariant durable). Verdict **GO** — CodeRabbit CLI local (`.coderabbit.yaml`) : 0 finding bloquant/majeur/mineur ; couverture des critères auto complète.
- **Tests automatisés** : `yarn workspace battleforthecrown-pixi test run src/features/layout/multiVillageSheet.test.ts` → 22 passed (12 nouveaux).
- **Smokes lancés** : Aucun — diff frontend-only, backend intact.
- **Smokes ajoutés/modifiés** : Aucun (frontend).
- **QA fonctionnelle agent** : Non nécessaire — dérivation pure couverte par unit ; rendu = QA IG.
- **Tests IG à faire par le user** :
  - [ ] Ouvrir le sélecteur multi-village sur mobile : un village entrepôt plein affiche la pastille « Entrepôt plein », un village sans file affiche « File inactive », message + tiret cohérents.
  - [ ] Filtre « Alertes » : n'affiche que les villages porteurs d'un warning.

Docs : mises à jour — `docs/gameplay/22-village-roles-and-navigation.md` (§Alertes d'état) + `docs/gameplay/lab/tickets/06-multi-village-governance.md` (statut partiellement livré).
