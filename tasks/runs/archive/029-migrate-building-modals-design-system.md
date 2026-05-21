# Run #029 — migrate-building-modals-design-system

> **Statut** : DONE
> **Démarré** : 2026-05-21
> **Terminé** : 2026-05-21

## Cible

- **Phase roadmap** : Hors roadmap — consolidation UI village
- **Spec source** : [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md), [`docs/gameplay/08-units.md`](../../docs/gameplay/08-units.md), [`docs/gameplay/10-conquest.md`](../../docs/gameplay/10-conquest.md), [`docs/gameplay/12-village-styles.md`](../../docs/gameplay/12-village-styles.md)
- **Type** : refacto
- **Modules backend** : —
- **Modules frontend** : `pixi/features/village`, `pixi/features/design-system/components`, `pixi/features/army`

## Dépendances

- Le run [`028 — Bonus de vitesse d'entraînement de la Caserne`](./archive/028-barracks-training-speed-bonus.md) est terminé et doit être consommé : la modale Caserne doit afficher le helper/constante shared de vitesse d'entraînement existant, sans recoder la feature.
- Bâtiments déjà migrés à préserver : `WOOD`, `STONE`, `IRON`, `QUARTER` via `ResourceBuildingDetailModal`.
- Bâtiments actifs encore legacy à migrer : `CASTLE`, `WAREHOUSE`, `BARRACKS`, `WATCHTOWER`, `COUNCIL_HALL`, `THRONE_HALL`.
- Bâtiments désactivés MVP à ignorer : `WALL`, `HIDEOUT`.
- Arbitrages produit validés :
  - `BARRACKS` : afficher les unités débloquées par niveau et le bonus de vitesse d'entraînement.
  - `CASTLE` : afficher le bonus de vitesse construction et les prochains bâtiments débloqués.
  - `WAREHOUSE` : afficher uniquement le stockage du niveau actuel et du prochain niveau, pas le stock courant.
  - `WATCHTOWER` : afficher le rayon de vision du village, un message informatif sur les rayons multi-villages et un placeholder visuel libellé `image simulation des rayons qui se touchent`.
  - `COUNCIL_HALL` : ouvrir directement la même modale que le bouton `Voie du village`, au lieu d'une modale bâtiment classique.
  - `THRONE_HALL` : migrer la logique Noble et revoir entièrement le design pour l'aligner avec la nouvelle DA.

## Critère de fin (acceptance)

- [ ] `CASTLE`, `WAREHOUSE`, `BARRACKS`, `WATCHTOWER` et `THRONE_HALL` ne rendent plus le corps legacy de `BuildingDetailModal`; ils utilisent `BuildingModal` ou une variante design-system cohérente.
- [ ] `COUNCIL_HALL` ouvre le flux/modale existant de `Voie du village` depuis la carte bâtiment et depuis tout caller équivalent, sans dupliquer la logique de choix de style.
- [ ] `BARRACKS` affiche les unités débloquées par niveau et le bonus de vitesse d'entraînement issu du run 028.
- [ ] `CASTLE` affiche à la fois la vitesse de construction actuelle/prochaine et les bâtiments débloqués par le prochain niveau.
- [ ] `WAREHOUSE` affiche uniquement la capacité de stockage actuelle et prochaine, sans jauge de stock courant.
- [ ] `WATCHTOWER` affiche le rayon local actuel/prochain, un court message sur l'union multi-village, et le placeholder `image simulation des rayons qui se touchent`.
- [ ] `THRONE_HALL` conserve le recrutement Noble complet : coûts, couronnes, population, cap 1 Noble, progression, annulation, erreurs, états indisponibles.
- [ ] Les états `unbuilt-locked`, `unbuilt-available`, `in-progress`, `available`, `max`, file pleine, upgrade et cancel restent fonctionnellement identiques.
- [ ] `WALL` et `HIDEOUT` restent ignorés tant qu'ils sont désactivés MVP.
- [ ] Tests ciblés ajoutés ou mis à jour pour la matrice de contenu et les états critiques ; QA visuelle mobile/desktop effectuée sur Caserne, Château, Tour de guet, Salle du Trône et Salle du Conseil.
- [ ] `rtk yarn static-check` est vert.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- Cartographie legacy : `BuildingDetailModal` conserve la logique business, les bâtiments ressources restent routés vers `ResourceBuildingDetailModal`, les autres bâtiments actifs passent par une nouvelle adaptation design-system.
- Contenu pur : extraire les comparaisons Château/Caserne/Entrepôt/Tour dans `buildingModalContent.ts`, testées sans DOM.
- UI spécialisée : créer `SpecializedBuildingDetailModal` pour `CASTLE`, `WAREHOUSE`, `BARRACKS`, `WATCHTOWER`, `THRONE_HALL`.
- Salle du Conseil : rendre `VillageStyleControl` contrôlable et router le clic bâtiment construit vers la modale `Voie du village` existante.
- Vérification : tests ciblés, type-check, static-check, build Pixi ; QA navigateur reportée car l'outil Browser n'expose pas de runtime pilotable dans cette session.

## Progress (rempli pendant le run)

- Préflight effectué dans un worktree dédié `codex/run-029-building-modals` pour ne pas toucher le checkout principal sale.
- Cartographie des sources partagées et UI effectuée : bonus Caserne repris depuis le run 028, capacités Entrepôt depuis `getWarehouseStorageLimit`, vision depuis `WATCHTOWER_VISION_LEVELS`, unlocks Château depuis `BUILDING_UNLOCK_REQUIREMENTS`.
- Implémentation terminée : modale design-system pour les bâtiments actifs restants, routage Salle du Conseil, tests de contenu ajoutés.
- Revue locale 5 axes effectuée ; corrections appliquées sur Salle du Conseil en construction et Entrepôt niveau max.
- Vérifications automatisées vertes après `prisma generate` dans le worktree.

## Décisions prises

- `BuildingDetailModal` reste le conteneur business pour éviter de déplacer les mutations/queries dans le design-system.
- Le contenu métier non visuel est extrait en helpers purs afin de tester les matrices bâtiment sans snapshot DOM.
- `COUNCIL_HALL` construit n'affiche pas de modale bâtiment : il ouvre directement `VillageStyleModal` via `VillageStyleControl` contrôlé.
- `WALL` et `HIDEOUT` sont ignorés via le filtre `BUILDING_DEFINITIONS[building].enabled` dans les unlocks Château.
- Revue indépendante sub-agent non lancée : l'outil sub-agent exige une demande explicite de délégation dans cette session. Revue locale 5 axes faite à la place.
- QA navigateur non capturée : le skill Browser est disponible mais aucun outil `node_repl/js` n'est exposé pour piloter l'in-app browser.

## Rapport final

Migration livrée côté Pixi. Les bâtiments actifs restants n'utilisent plus le corps legacy de `BuildingDetailModal` : le conteneur hydrate les données et délègue aux modales DS ressources ou spécialisée. La Caserne affiche les unités débloquées par niveau et le bonus de vitesse, le Château affiche vitesse + unlocks, l'Entrepôt affiche uniquement capacité actuelle/prochaine, la Tour affiche rayon + message + placeholder, et la Salle du Trône conserve le recrutement Seigneur dans une présentation refondue.

Fichiers touchés :
- `battleforthecrown-pixi/src/features/design-system/components/BuildingModal.tsx`
- `battleforthecrown-pixi/src/features/game/VillageView.tsx`
- `battleforthecrown-pixi/src/features/village/BuildingDetailModal.tsx`
- `battleforthecrown-pixi/src/features/village/SpecializedBuildingDetailModal.tsx`
- `battleforthecrown-pixi/src/features/village/VillageStyleControl.tsx`
- `battleforthecrown-pixi/src/features/village/buildingModalContent.ts`
- `battleforthecrown-pixi/src/features/village/buildingModalContent.test.ts`

Ticket ouvert : aucun.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Aucun bâtiment actif restant ne rend le corps legacy — `rtk grep "return \\(" battleforthecrown-pixi/src/features/village/BuildingDetailModal.tsx -n -C 2` → seulement 2 retours : ressources et spécialisée.
  - [x] Contenu Caserne — `rtk yarn workspace battleforthecrown-pixi test buildingModalContent.test.ts` → 4 tests verts, groupes unités + vitesse couverts.
  - [x] Contenu Château / Entrepôt / Tour de guet — `rtk yarn workspace battleforthecrown-pixi test buildingModalContent.test.ts` → unlocks, storage max, vision couverts.
  - [x] Flux Salle du Conseil vers `Voie du village` — `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=ws://localhost:15001 rtk yarn workspace battleforthecrown-pixi test VillageStyleControl.test.tsx` → 2 tests verts sur le flux existant ; routage contrôlé ajouté dans `VillageView`.
  - [x] États lock/construction/max/cancel/upgrade préservés — `rtk yarn workspace battleforthecrown-pixi type-check` + revue locale : actions centralisées dans `SpecializedBuildingDetailModal`, coût masqué si locked, cancel construction conservé.
  - [x] Static check — `rtk yarn static-check` → vert après `rtk yarn workspace battleforthecrown-backend prisma:generate`.
- **Review indépendante** : Non déclenchée, outil sub-agent indisponible sans demande explicite. Revue locale 5 axes effectuée ; verdict `GO` après corrections.
- **Tests automatisés** :
  - `rtk yarn workspace battleforthecrown-pixi test buildingModalContent.test.ts` → 1 fichier, 4 tests verts.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=ws://localhost:15001 rtk yarn workspace battleforthecrown-pixi test VillageStyleControl.test.tsx` → 1 fichier, 2 tests verts.
  - `rtk yarn workspace battleforthecrown-pixi type-check` → vert.
  - `rtk yarn static-check` → vert.
  - `rtk yarn workspace battleforthecrown-pixi build` → vert.
- **Smokes ajoutés/modifiés** : Aucun smoke end-to-end. Changement purement frontend, couvert par tests helper + test de flux existant + build.
- **QA fonctionnelle agent** : Non exécutée en navigateur ; le plugin Browser n'expose pas de runtime `node_repl/js` dans cette session.
- **Tests IG à faire par le user** :
  - [ ] Valider visuellement le placeholder Watchtower `image simulation des rayons qui se touchent` avant remplacement par l'image finale.
  - [ ] Valider que la nouvelle DA de la Salle du Trône colle au niveau attendu.

## Liens détectés

- Connexe : [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) — standardisation design-system des bottom sheets et panneaux.
- Connexe : [`tasks/runs/archive/009-fix-ui-locked-unbuilt.md`](./archive/009-fix-ui-locked-unbuilt.md) — états lock/unbuilt et décisions UI bâtiment à préserver.
- Connexe : [`tasks/archive/57-player-village-building-lifecycle-roster.md`](../archive/57-player-village-building-lifecycle-roster.md) — roster lifecycle utile pour ignorer `WALL` / `HIDEOUT`.
- Connexe : [`tasks/archive/40-recruit-noble-throne-hall.md`](../archive/40-recruit-noble-throne-hall.md) et [`tasks/archive/47-noble-training-visual-queue-missing.md`](../archive/47-noble-training-visual-queue-missing.md) — contraintes Noble / Salle du Trône.
- Dépendance consommée : [`tasks/runs/archive/028-barracks-training-speed-bonus.md`](./archive/028-barracks-training-speed-bonus.md) — bonus de vitesse Caserne à afficher.

## Notes de cadrage

- Ne pas recréer une seconde source de vérité pour les bonus : lire `packages/shared/src/village/buildings.ts` et les helpers shared existants.
- Ne pas mélanger stock courant et capacité Entrepôt : le stock courant reste le rôle des modales de ressources.
- La Salle du Conseil est un routage UX vers le flux de style, pas une nouvelle modale informative.
- La Salle du Trône est le plus gros risque de régression : conserver la logique métier existante, mais reprendre la présentation pour la nouvelle DA.
