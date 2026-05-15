# Run #028 — mobile-worldmap-minimap-ux

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — alignement UX WorldMap mobile, connexe Phase 9 Navigation multi-village et Phase 10 Rétention quotidienne MVP
- **Spec source** : [`docs/gameplay/22-village-roles-and-navigation.md`](../../docs/gameplay/22-village-roles-and-navigation.md), [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md)
- **Type** : `fix`
- **Modules backend** : `—`
- **Modules frontend** : `pixi/world`, `pixi/retention`, `pixi/design-system`

## Dépendances

- [`tasks/archive/62-interactive-minimap-sync.md`](../archive/62-interactive-minimap-sync.md) déjà livré : sync caméra + tap/drag mini-carte existants.
- [`tasks/runs/archive/027-feature-daily-cards-oyez-frontend-hud.md`](./archive/027-feature-daily-cards-oyez-frontend-hud.md) déjà livré : `DailyRetentionWidget`/`RoyalSeal` ajouté sur la WorldMap, révélant le conflit d'espace HUD.
- Liens connexes à garder en contexte : [`tasks/archive/61-active-village-map-indicator.md`](../archive/61-active-village-map-indicator.md), [`tasks/archive/65-own-vs-foreign-villages-map-distinction.md`](../archive/65-own-vs-foreign-villages-map-distinction.md), [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md).

## Critère de fin (acceptance)

- [ ] Sur viewport mobile, le `RoyalSeal`, le contrôle mini-carte et le bouton recentrer ne se chevauchent pas et ne forment pas une colonne de boutons flottants concurrents.
- [ ] La mini-carte mobile ouverte offre une surface tactile exploitable : largeur proche écran, hauteur ≥ 260 px, drag/tap utilisables au doigt.
- [ ] Tap sur la mini-carte recentre la WorldMap sur la coordonnée pointée.
- [ ] Drag sur la mini-carte recentre la WorldMap en continu sous le doigt.
- [ ] Le bouton recentrer sur village actif reste accessible en un geste depuis la WorldMap mobile.
- [ ] Desktop/tablette ne régressent pas : mini-carte compacte ou comportement équivalent reste disponible.
- [ ] Le `DailyRetentionWidget` ouvre toujours la sheet quotidienne et conserve son badge claimable.
- [ ] Aucun changement backend/shared requis.
- [ ] Tests Pixi ciblés pertinents + `yarn static-check` verts.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- Frontend HUD : skill `bftc-react-hud`

## Notes de cadrage

- Ne pas résoudre par simple déplacement arbitraire d'un bouton : le problème est la grammaire HUD mobile de la WorldMap.
- Recommandation MVP léger : mini-carte grand format en bottom sheet mobile, ouverte depuis un contrôle carte regroupé ; pas de mini-carte flottante permanente sur mobile.
- Réutiliser la base bottom sheet existante si la piste sheet est retenue ; éviter une deuxième famille visuelle.
- Préserver la sync technique livrée par le ticket 62 (`onCameraChange`, `centerOn`, tap/drag mini-carte).
- Si une piste overview touche fortement `WorldMapScene` / `pixi-viewport`, escalader avant d'élargir le scope.
- Le placement du `RoyalSeal` est partagé entre `VillageView` et `WorldMapScreen` : corriger la carte sans casser l'écran village.

## Pistes à trancher

- **A — Recommandée MVP** : sur mobile, supprimer le bouton mini-carte flottant isolé et ouvrir une mini-carte grand format dans une bottom sheet `GameBottomSheetPanel` (`~65-75dvh`, largeur quasi pleine). Garder tap/drag pour recentrer, fermer via bouton close.
- **B — Complément léger** : regrouper les contrôles carte dans une mini-toolbar unique (`map`, `compass`, éventuellement activités) sous le header ou au-dessus de la bottom nav.
- **C — Plus risquée** : mode overview temporaire plein écran, avec WorldMap très dézoomée manipulable puis retour à la vue normale après sélection.
- **D — Fallback mobile** : ne garder la mini-carte persistante que desktop/tablette ; mobile = surface d'orientation uniquement à la demande.

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] Sur mobile, le HUD carte ne s'empile plus en boutons flottants concurrents — preuve : QA browser mobile.
  - [ ] La mini-carte mobile est manipulable au doigt — preuve : QA browser tap + drag.
- **Tests automatisés** : _(Vide au démarrage.)_
- **Smokes ajoutés/modifiés** : _(Vide au démarrage.)_
- **QA fonctionnelle agent** : _(Vide au démarrage.)_
- **Tests IG à faire par le user** : _(Vide au démarrage.)_
