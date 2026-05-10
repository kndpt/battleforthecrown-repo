# Run #009 — fix-ui-locked-unbuilt

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Points d'attention identifiés au planning

- L'erreur backend EN « Castle level X required » reste émise par le backend ; on la rend juste inatteignable via ce parcours UI. Si un autre chemin la déclenche (ex. race condition castle downgrade — théorique), elle resterait en EN brut. Hors scope de ce run.
- `BadgesSection.tsx` (`battleforthecrown-pixi/src/features/ui-test/components/BadgesSection.tsx`, ligne 157) contient un exemple `<Badge>Niv. 0</Badge>` — c'est un showcase de la lib UI, à laisser tel quel sauf instruction contraire.
- Le helper `getBuildingLockState` doit retourner `castleLevel` actuel (en plus de `requiredCastleLevel`) pour permettre le rendu « Castle Y/X » dans la modale — à préciser dans la signature au refinement.

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, QA résiduelle qui revient à l'utilisateur, méta-évaluation si applicable.)_
