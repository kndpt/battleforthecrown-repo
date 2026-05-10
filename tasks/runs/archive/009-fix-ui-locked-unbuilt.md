# Run #009 — fix-ui-locked-unbuilt

> **Statut** : DONE
> **Démarré** : 2026-05-10
> **Terminé** : 2026-05-10

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant (clôture la dette frontend laissée ouverte par le run 002 `audit-buildings` archivé, qui avait explicitement mis le frontend hors scope).
- **Spec source** : [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md) — déblocages castle, statut « non construit ». Spec déjà tranchée, c'est le frontend qui diverge.
- **Type** : `fix`
- **Modules backend** : —
- **Modules frontend** :
  - `battleforthecrown-pixi/src/features/village/buildingLockState.ts` (NOUVEAU — helper pur partagé)
  - `battleforthecrown-pixi/src/features/village/buildingLockState.test.ts` (NOUVEAU — test unit pure-logic)
  - `battleforthecrown-pixi/src/features/village/BuildingDetailModal.tsx`
  - `battleforthecrown-pixi/src/features/village/BuildingDetailModal/BuildingHeader.tsx`
  - `battleforthecrown-pixi/src/features/village/BuildingManagementPanel.tsx` (refacto vers helper T1)
  - `battleforthecrown-pixi/src/features/village/BuildingCard.tsx`
  - `battleforthecrown-pixi/src/pixi/scenes/VillageScene.ts` (filtre `level > 0`)

## Dépendances

- Run 002 `audit-buildings` ([archive](./archive/002-audit-buildings.md)) — ✅ DONE. A confirmé `BUILDING_UNLOCK_REQUIREMENTS` (`packages/shared/src/village/buildings.ts`) comme source de vérité shared. Ce run en consomme l'output sans toucher shared/backend.

## Critère de fin (acceptance)

- [ ] Ouvrir la modale d'un bâtiment level 0 verrouillé (ex. `WATCHTOWER` avec Castle < 3) n'affiche **jamais** un bouton « Améliorer » cliquable.
- [ ] La modale d'un bâtiment verrouillé affiche un état explicite « Château niv. X requis » (icône cadenas + niveau requis + niveau actuel château) en tête de section body.
- [ ] Cliquer un bâtiment verrouillé n'envoie **plus aucune requête** `POST /village/:id/upgrade` (vérifié via Network DevTools côté agent).
- [ ] Aucun message d'erreur backend brut anglais (« Castle level X required ») ne peut s'afficher dans la modale via ce parcours.
- [ ] `CostSection` est masquée quand state = `unbuilt-locked`. `BonusSection` reste affichée en preview (« voici ce que ça produira »). Décision UX actée pré-écriture.
- [ ] Sur la scène Pixi village, les bâtiments dont `level === 0` ne sont plus rendus du tout (option A : terrain vide, aucun rendu). Décision UX actée pré-écriture.
- [ ] Le label `Niv. 0` n'apparaît plus nulle part dans les flows production (modale `BuildingHeader`, card `Badge`). Remplacé par « Non construit » ou équivalent validé pendant le refinement.
- [ ] Un helper pur `getBuildingLockState(building, castleLevel)` existe dans `battleforthecrown-pixi/src/features/village/buildingLockState.ts` et est l'unique source de classification consommée par `BuildingManagementPanel`, `BuildingDetailModal` et `VillageScene`.
- [ ] Le helper a un test unit pure-logic Vitest couvrant les 5 états (`unbuilt-locked`, `unbuilt-available`, `in-progress`, `available`, `max`) — conforme à `.claude/rules/tests.md` (helper pur, aucun mock).
- [ ] `yarn workspace battleforthecrown-pixi test` vert.
- [ ] `yarn workspace battleforthecrown-pixi build` vert (typecheck strict).
- [ ] QA user IG fournie (cf. `.claude/rules/qa.md`) : ouvrir modale d'un verrou, observer scène village sans bâtiments level 0, vérifier libellé « Non construit » partout.

## Règles à respecter

- Tests : @.claude/rules/tests.md
- QA : @.claude/rules/qa.md
- Docs : @.claude/rules/docs.md
- Git : @.claude/rules/git.md
- Conventions : @.claude/rules/conventions.md

## Décisions UX prises avant écriture (par le user au `/plan-run`)

- **Scène Pixi village — option A** : `VillageScene.reconcile()` filtre `buildings.filter(b => b.level > 0)`. Aucun rendu pour les bâtiments level 0, terrain vide. Pas de mode silhouette → `BuildingSprite.ts` non touché.
- **Modale verrouillée — `BonusSection` en preview** : la section reste visible quand `state === 'unbuilt-locked'`, comme aperçu de ce que produira le bâtiment une fois débloqué. Seule `CostSection` est masquée et le bouton « Améliorer » est remplacé par l'état désactivé « Château niv. X requis ».

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] T1 — Helper pur + tests
  - Fichiers : `battleforthecrown-pixi/src/features/village/buildingLockState.ts`, `battleforthecrown-pixi/src/features/village/buildingLockState.test.ts`.
  - Changement : exposer `getBuildingLockState(building, castleLevel)` avec les états `unbuilt-locked`, `unbuilt-available`, `in-progress`, `available`, `max`, `requiredCastleLevel` et `castleLevel`.
  - Succès observable : test Vitest pure-logic couvrant les 5 états.
- [x] T2 — Brancher le helper dans le HUD village
  - Fichiers : `BuildingManagementPanel.tsx`, `BuildingCard.tsx`, `BuildingDetailModal.tsx`, `BuildingDetailModal/BuildingHeader.tsx`.
  - Changement : remplacer la classification locale/`lockReason` par le helper ; masquer `CostSection` et le bouton upgrade quand `unbuilt-locked`; afficher l'état lock explicite en modale ; remplacer `Niv. 0` par `Non construit`.
  - Succès observable : bâtiment verrouillé cliquable en preview mais sans requête upgrade possible depuis la modale.
- [x] T3 — Brancher le helper dans la scène Pixi
  - Fichier : `battleforthecrown-pixi/src/pixi/scenes/VillageScene.ts`.
  - Changement : calculer le niveau château et filtrer les bâtiments dont l'état helper est `unbuilt-locked` ou `unbuilt-available`.
  - Succès observable : aucun bâtiment `level === 0` rendu sur la scène.

## Progress (rempli pendant le run)

- 2026-05-10 — Préflight OK : repo clean, fiche unique `009-fix-ui-locked-unbuilt.md`, statut `PLANNED`, spec/rules relues.
- 2026-05-10 — Cartographie : `code_mapper` bloqué sans retour après attente longue ; agent fermé. Cartographie locale ciblée réalisée sur les fichiers listés.
- 2026-05-10 — Refinement écrit, fiche passée `RUNNING`, `tasks/todo.md` remplacé par le plan du run 009.
- 2026-05-10 — T1/T2/T3 implémentées en dérogation lead : helper pur, tests, modale lock-aware, panel/card/header consommant le helper, scène Pixi filtrant les bâtiments non construits.
- 2026-05-10 — Build Pixi initial bloqué par dette indépendante : configs frontend d'unités sans `WARRIOR`/`RAM` après extension shared. Correction minimale ajoutée pour rendre l'acceptance build vérifiable.
- 2026-05-10 — Tests : `yarn workspace battleforthecrown-pixi test` vert (14 fichiers, 84 tests).
- 2026-05-10 — Build : `yarn workspace battleforthecrown-pixi build` vert. Warning Vite chunk > 500 kB existant/non bloquant.

## Décisions prises

- Dérogation lead : le `code_mapper` n'a pas rendu de carte et bloquait le run. Pour éviter une nouvelle attente stérile, le lead a fait une cartographie locale courte limitée aux fichiers ciblés, puis implémente les changements chirurgicaux localement en documentant chaque étape.
- Invariant de classification : `getBuildingLockState` devient la source unique côté frontend pour distinguer `unbuilt-locked`, `unbuilt-available`, `in-progress`, `available`, `max`.
- Scène Pixi : bien que la décision UX dise `level > 0`, l'implémentation passera par le helper et filtrera les deux états non construits, ce qui conserve le comportement attendu tout en respectant la source de classification unique.
- Finding de build indépendant : `battleforthecrown-pixi/src/features/army/unitConfig.ts` et `battleforthecrown-pixi/src/lib/unitConfig.ts` n'étaient plus exhaustifs sur `UnitType` (`WARRIOR`, `RAM`). Corrigé dans le même commit car `yarn workspace battleforthecrown-pixi build` est un critère de fin du run.
- Review findings : aucun finding `bloquant` ou `majeur`. Mineur traité immédiatement : quelques lignes longues issues du patch ont été reformatées.
- Docs : aucun changement nécessaire, raison : la spec `docs/gameplay/03-buildings.md` contenait déjà les paliers et décisions nécessaires ; le run corrige seulement l'implémentation frontend.

## Points d'attention identifiés au planning

- L'erreur backend EN « Castle level X required » reste émise par le backend ; on la rend juste inatteignable via ce parcours UI. Si un autre chemin la déclenche (ex. race condition castle downgrade — théorique), elle resterait en EN brut. Hors scope de ce run.
- `BadgesSection.tsx` (`battleforthecrown-pixi/src/features/ui-test/components/BadgesSection.tsx`, ligne 157) contient un exemple `<Badge>Niv. 0</Badge>` — c'est un showcase de la lib UI, à laisser tel quel sauf instruction contraire.
- Le helper `getBuildingLockState` doit retourner `castleLevel` actuel (en plus de `requiredCastleLevel`) pour permettre le rendu « Castle Y/X » dans la modale — à préciser dans la signature au refinement.

## Rapport final

### Synthèse

Frontend village aligné sur les déblocages Château : le helper pur `getBuildingLockState` centralise les états, la modale verrouillée n'expose plus d'action upgrade, les coûts sont masqués quand verrouillé, le bonus reste visible en preview, et la scène Pixi ne rend plus les bâtiments non construits.

### Fichiers touchés

- `battleforthecrown-pixi/src/features/village/buildingLockState.ts`
- `battleforthecrown-pixi/src/features/village/buildingLockState.test.ts`
- `battleforthecrown-pixi/src/features/village/BuildingDetailModal.tsx`
- `battleforthecrown-pixi/src/features/village/BuildingDetailModal/BuildingHeader.tsx`
- `battleforthecrown-pixi/src/features/village/BuildingManagementPanel.tsx`
- `battleforthecrown-pixi/src/features/village/BuildingCard.tsx`
- `battleforthecrown-pixi/src/pixi/scenes/VillageScene.ts`
- `battleforthecrown-pixi/src/features/army/unitConfig.ts`
- `battleforthecrown-pixi/src/lib/unitConfig.ts`
- `tasks/todo.md`, `tasks/lessons.md`, `tasks/README.md`

### QA automatisée

- [x] `yarn workspace battleforthecrown-pixi test` → PASS (14 fichiers, 84 tests).
- [x] `yarn workspace battleforthecrown-pixi build` → PASS.

### QA user

**Résultat attendu** : un bâtiment verrouillé est visible en preview dans la liste, mais ne peut pas lancer d'upgrade et n'apparaît pas dans la scène village.

- [ ] Ouvrir le panneau Bâtiments avec un Château sous le niveau requis d'une Tour de guet/Caserne.
- [ ] Ouvrir la fiche du bâtiment verrouillé.
- [ ] Vérifier que le message `Château niv. X requis` est visible et que le bouton upgrade est désactivé.
- [ ] Vérifier que le coût est masqué mais que le bonus reste visible en preview.
- [ ] Vérifier que les bâtiments `Non construit` ne sont pas rendus sur la scène village.

### Tickets ouverts

Aucun.

### Méta-évaluation

Le run a nécessité une dérogation lead car le `code_mapper` est resté bloqué. La dérogation est documentée et une leçon a été ajoutée pour limiter l'attente sub-agent silencieuse.
