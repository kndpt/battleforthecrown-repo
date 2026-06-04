# Todo

## 2026-06-04 — PR #46 commentaires review capture

- [x] Relire les threads encore ouverts sur #46 et #49.
- [x] Corriger le fallback implicite de niveau de Château sur capture PvP.
- [x] Ajouter une régression pure sur le niveau de Château manquant.
- [x] Relancer les vérifications ciblées capture et static-check.
- [x] Commit, push et résoudre les threads GitHub.

### Review

- Thread #46 valide : `getCaptureDurationMs` ne retombe plus sur Château 1 quand un village joueur n'a pas de bâtiment `CASTLE` chargé ; le helper échoue explicitement.
- Thread #46 Armée : faux positif à répondre, car `UNIT_COSTS.time` et `getEffectiveUnitTrainingDurationSeconds` manipulent des secondes.
- Thread #49 ressources : obsolète sur le head courant.
- Vérification : `rtk yarn workspace battleforthecrown-backend test -- capture-duration` — 1 suite / 4 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` — passé après démarrage du Postgres Docker local.
- Vérification : `rtk yarn workspace battleforthecrown-backend test:smoke:run -- combat-conquest-hook.smoke.spec.ts` — 1 suite / 6 tests passés.
- Vérification : `rtk yarn static-check` — passé.
- Vérification : `rtk git diff --check` — passé.

## 2026-06-03 — Fix smoke capture tempo

- [x] Remplacer la constante T1 dupliquée par la courbe canonique.
- [x] Relancer le smoke conquest ciblé.
- [x] Relancer l'hygiène finale.

### Review

- Correction : `combat-conquest-hook.smoke.spec.ts` importe `BARBARIAN_CAPTURE_DURATIONS_MS.T1` depuis `capture-duration.ts` au lieu de dupliquer l'ancienne durée T1 barbare.
- Vérification : `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-backend test:smoke:run -- combat-conquest-hook.smoke.spec.ts` — 1 suite / 6 tests passés.
- Vérification : `rtk yarn static-check` — passé.
- Vérification : `rtk git diff --check` — passé.

## 2026-06-03 — Audit impact docs patch local

- [x] Cartographier le diff local par domaine.
- [x] Comparer les changements aux docs gameplay/architecture actives.
- [x] Corriger uniquement l'écart réel détecté.
- [x] Lancer les vérifications ciblées.

### Review

- Docs gameplay : pas de mise à jour nécessaire ; les specs capture barbare/PvP étaient déjà alignées sur le tempo compressé.
- Correction hors doc : `capture-duration.ts` et son test utilisent maintenant la courbe barbare de `docs/gameplay/13-barbarian-conquest.md` / `23-world-tempo-and-multipliers.md`.
- Docs techniques : `docs/architecture/backend-modules.md` et `docs/architecture/balance-and-tempo.md` pointent vers le nouveau helper `combat/capture-duration.ts`.
- Vérification : `rtk yarn workspace battleforthecrown-backend test -- capture-duration` — 1 suite / 3 tests passés.
- Vérification : `rtk yarn static-check` — passé.
- Vérification : `rtk git diff --check` — passé.

## 2026-06-03 — Carte capture nom cible

- [x] Retirer le badge carré gauche des cartes capture.
- [x] Repositionner l'info tier/château en compact sans réduire le titre.
- [x] Vérifier le composant capture ciblé et documenter la QA.

### Review

- Le gros badge carré `PVP / Ch. N` n'est plus rendu à gauche du titre de carte capture.
- L'info tier/château reste visible en pastille compacte dans la ligne meta, avec un label accessible.
- Le nom du village ciblé récupère toute la largeur de la ligne titre avant le statut.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test -- KingdomActivitiesPanel` — 1 suite / 1 test passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi eslint src/features/design-system/components/KingdomActivitiesPanel.tsx src/features/design-system/components/KingdomActivitiesPanel.test.tsx` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn static-check` — passé.
- Vérification : `rtk git diff --check` — passé.
- QA IG restante : ouvrir `Captures` et vérifier que le nom du village ciblé est lisible sans badge carré à gauche.

## 2026-06-03 — Assets rapports de combat

- [x] Confirmer que `/assets/loot-rapport.png` correspond à l’asset demandé.
- [x] Remplacer l’asset hero du rapport de combat victoire.
- [x] Confirmer que `/assets/no-loot-rapport.png` correspond à l’asset demandé.
- [x] Remplacer l’asset hero du rapport de combat défaite.
- [x] Lancer la vérification Pixi ciblée et documenter la QA.

### Review

- Correction : les rapports de combat victorieux utilisent `/assets/loot-rapport.png` dans le cartouche hero, avec une taille dédiée à cet asset.
- Correction : les rapports de combat perdus utilisent `/assets/no-loot-rapport.png` dans le cartouche hero, avec la même taille dédiée.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test -- combatReportView` — 1 suite / 4 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi eslint src/features/design-system/components/CombatReportModal.tsx` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- QA IG restante : ouvrir un rapport de combat victorieux et un rapport perdu ; vérifier que le cartouche en haut à gauche affiche le bon asset et garde le badge d’identifiant lisible.

## 2026-06-03 — Asset Seigneur canonique

- [x] Brancher la troupe `NOBLE` sur `/assets/army/noble.png` au lieu de l'emoji couronne.
- [x] Réutiliser ce même asset pour le marqueur animé de capture sur la carte monde.
- [x] Adapter les tests ciblés et lancer les vérifications Pixi.

### Review

- `NOBLE` utilise désormais `/assets/army/noble.png` dans `unitConfig`; l'emoji fallback Seigneur est vide et n'est plus rendu.
- La Salle du Trône et l'activité `Seigneur` de la sheet multi-villages utilisent le même PNG au lieu d'un emoji/glyphe local.
- Le marqueur Pixi `world.capture.crown` pointe vers `/assets/army/noble.png`, donc la couronne animée de capture utilise le nouvel asset.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel manifest` — 2 suites / 9 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi lint:check --quiet` — passé.
- Vérification : `rtk yarn static-check` — passé.
- Vérification : `rtk git diff --check` — passé.
- QA IG restante : vérifier une carte Seigneur dans Armée, la Salle du Trône et un village en capture sur la carte monde.

## 2026-06-03 — Capture monde pourcentage et durée

- [x] Localiser le rendu du pourcentage et la source de `0.27904`.
- [x] Tracer la durée de capture depuis le worker backend jusqu’au DTO Activités.
- [x] Corriger le formatage UI si le pourcentage est un ratio brut.
- [x] Décider si `17h57` est un bug de calcul ou une règle de balance à revoir.
- [x] Faire remonter `captureWindow` sur les villages joueurs du feed monde.
- [x] Conserver l'état de capture quand un village à moi remplace l'entité monde.
- [x] Ajouter une animation + un marqueur visuel au-dessus des villages en capture.
- [x] Afficher une section capture dans le panel de village sans révéler les troupes.
- [x] Lancer les vérifications ciblées et documenter la QA.

### Review

- Le pourcentage est calculé en base 100 dans `kingdomActivitiesViewModel`, puis affiché brut dans `CaptureWindowCard`.
- La capture locale dure 18h parce que la cible est un village joueur Château 10, tempo `captureWindow = 1`, et le code PvP actuel applique le palier `9+ => 18h`.
- La doc gameplay active PvP spécifie pourtant `9-10 => 4h30`; le code est désaligné.
- Correction : les durées PvP sont alignées sur la doc `14-pvp-conquest` (`1h`, `1h30`, `2h15`, `3h`, `4h30`).
- Correction : le badge capture joueur expose `PVP` + `Ch. N` au lieu de retomber sur `T1`.
- Correction : `/world/:id/entities` expose désormais `captureWindow` sur les villages joueurs, pas seulement sur les barbares.
- Correction : `buildMapEntities` conserve `captureWindow` quand `myVillages` remplace l'entité monde.
- Correction : les villages en capture ont un halo renforcé + une couronne animée au-dessus de l'asset.
- Correction : le panel du village affiche une section `Capture` avec village source, temps écoulé, temps restant et progression, sans afficher les troupes.
- Donnée locale réparée : `pending_conquest cmpygad00008rvd3j4nmggvcf` et son job `conquest:finalize` passent de 18h à 4h30 (`capture_until/start_after = 2026-06-03T23:49:35.760Z`).
- Vérification : `rtk yarn workspace battleforthecrown-pixi test -- buildMapEntities SelectedEntityPanel` — 2 suites / 15 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-backend test -- capture-duration` — 1 suite / 3 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test -- kingdomActivitiesViewModel KingdomActivitiesPanel` — 2 suites / 5 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-backend test -- capture-duration.spec.ts` — 1 suite / 3 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test -- profileViewModel` — 1 suite / 6 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-backend type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-backend test:smoke:preflight` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-backend test:smoke:run -- combat-conquest-hook.smoke.spec.ts` — 1 suite / 6 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-backend test:smoke:run -- kingdom-activities-snapshots.smoke.spec.ts combat-conquest-hook.smoke.spec.ts` — 2 suites / 7 tests passés ; log pg-boss de teardown non bloquant.
- Vérification : `rtk yarn static-check` — passé.
- Vérification : `rtk git diff --check` — passé.
- QA IG restante : rafraîchir `/game/world`, vérifier que le village joueur en capture affiche une couronne animée, puis cliquer le village et vérifier la section `Capture` complète sans ligne de troupes. Ouvrir aussi `Captures` pour vérifier le pourcentage entier, le badge `PVP / Ch. 10`, et un temps restant basé sur une fenêtre totale de 4h30.

## 2026-06-03 — Bug Seigneur invisible dans Armée

- [x] Tracer le contrat Armée et confirmer où `NOBLE` est exclu.
- [x] Corriger le view-model pour afficher les Seigneurs présents au village dans l’onglet Armée.
- [x] Garder le Seigneur hors liste Caserne/recrutement.
- [x] Ajouter une régression ciblée sur un Seigneur présent au village.
- [x] Lancer les vérifications Pixi pertinentes et documenter la QA.

### Review

- Le view-model Armée construit les lignes depuis tous les `UNIT_TYPES`, donc `NOBLE` apparaît dans `Village` avec quantité, puissance et détail unité.
- `barracksTroops` reste filtré sur `BARRACKS_UNIT_TYPES`, donc le Seigneur ne devient pas recrutable par la Caserne.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel` — 1 suite / 4 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn static-check` — passé.
- Vérification : `rtk git diff --check` — passé.
- QA IG restante : vérifier `/game/army` onglet Armée avec un village possédant un Seigneur ; la section `Village` doit afficher une ligne `Seigneur` avec `Moi ×1`, puissance et détail au clic sur l’icône.

## 2026-06-02 — Run 046 devoir royal FOMO légère

- [x] Préflight : branche propre `run/046-refactor-royal-duty-light-fomo`, fiche run, règles repo, specs source, briefings backend/pixi, politique PR.
- [x] Cartographier doc gameplay, `RetentionService`, smoke daily-retention, contrats shared et HUD daily.
- [x] Acter dans la doc `1 carte / jour`, 3 tâches naturelles, reset/expiration 04h00 et grâce bornée.
- [x] Adapter backend/shared : statut `EXPIRED`, expiration des anciennes cartes, génération courante sans backlog, claim unique avec grâce.
- [x] Adapter frontend : retirer backlog/rattrapage visible, afficher `Expire à 04h00`, garder le sceau royal en topbar.
- [x] Mettre à jour tests unitaires/Vitest et smoke daily-retention.
- [x] Lancer preflight smoke, smoke ciblé, tests ciblés, `static-check` et review 5 axes.
- [x] Archiver le run et mettre à jour `tasks/README.md`.

### Review

- Le lifecycle retention ne garde qu'une carte `ACTIVE` pour le jour courant ; les anciennes `ACTIVE` et les `CLAIMABLE` hors grâce passent `EXPIRED`.
- La fenêtre de grâce accepte uniquement les clés quotidiennes courante et précédente.
- La correction DST évite le faux reset par soustraction fixe de 4h UTC.
- Le HUD n'affiche plus de pile/rattrapage et annonce `Expire à 04h00`.
- Vérifications : unit retention, Vitest daily/header/layout, smokes retention/onboarding, grep wording, `static-check`.

## 2026-06-02 — PR #36 commentaires review

- [x] Lister les threads et commentaires hors diff.
- [x] Corriger la progression daily basée sur la date de création outbox.
- [x] Supprimer les projections vers des tâches daily retirées.
- [x] Corriger les liens cassés de la fiche run archivée.
- [x] Remplacer le create+catch `P2002` transactionnel par un `upsert`.
- [x] Relancer les vérifications ciblées.
- [x] Relancer les vérifications après `upsert`.
- [ ] Push le follow-up et résoudre les statuts GitHub.

### Review

- `RetentionService` progresse la carte du `EventOutbox.createdAt` avant d'expirer les cartes stale au jour courant de dispatch.
- Les projections scout/renfort/garnison ne ciblent plus des types retirés de `TASK_TEMPLATES`.
- `ensureDailyCardInTransaction` utilise un `upsert` atomique au lieu d'avaler `P2002` dans un `tx`.
- Les liens de la fiche run archivée pointent vers des fichiers existants.
- Vérifications : unit retention, smoke daily-retention, `static-check`.

## 2026-06-02 — PR #35 commentaires review

- [x] Lire les threads review et séparer actionnable / optionnel / déjà OK.
- [x] Corriger les retours actionnables : types de retour backend, `pushRefundToast`, validation Zod.
- [x] Lancer checks ciblés et `static-check`.
- [ ] Pousser le follow-up, vérifier CI/CodeRabbit, puis merger.

### Review

- Deux use-cases backend déclarent maintenant explicitement leurs types de retour publics.
- `pushRefundToast` déclare `: void`.
- Les réponses cancel construction/training passent par des schemas Zod avant d'être utilisées par les mutations.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test cancelResponses.test.ts refundToast.test.ts ToastStack.test.tsx` — 3 suites / 10 tests passés.
- Vérification : `rtk yarn static-check` — passé.
- Smoke local non relancé : le diff backend est type-only ; les smokes complets restent couverts par la CI PR.

## 2026-06-02 — Fix icônes toast runtime

- [x] Diagnostiquer les assets cassés des toasts runtime.
- [x] Remplacer les chemins inexistants par des assets `public/assets` réels.
- [x] Ajouter une vérification ciblée sur les chemins d'icônes.
- [x] Lancer les checks Pixi ciblés.
- [x] Commit et push le follow-up PR.

### Review

- `ToastStack` utilise maintenant des assets runtime existants pour les quatre tons : ressources, rapport, main or, main rouge.
- La map d'icônes vit dans `toastIcons.ts` pour rester compatible Fast Refresh.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test ToastStack.test.tsx` — 1 suite / 5 tests passés.
- Vérification : `rtk yarn static-check` — passé.
- Vérification assets : `rtk proxy curl -fsSI` sur les 4 chemins d'icônes — HTTP 200.

## 2026-06-02 — Run 045 toast remboursement annulation

- [x] Préflight : fiche run, règles repo, specs source, briefings backend/pixi, politique PR.
- [x] Cartographier les use-cases backend cancel construction/training, les mutations frontend et `ToastStack`.
- [x] Exposer et typer les payloads refund `{wood, stone, iron, population, crowns?}`.
- [x] Câbler un toast unique de remboursement sur succès mutation, valeurs `> 0` uniquement.
- [x] Adapter `ToastStack`/`ToastPreview` pour rendre les lignes via `ResourceIcon`.
- [x] Ajouter les tests ciblés backend/frontend selon `bftc-tests-policy`.
- [ ] Lancer vérifications, smokes ciblés, static-check et review 5 axes.
- [ ] Archiver le run, mettre à jour `tasks/README.md`, commit, push et PR ready.

## 2026-06-01 — Animation bottom nav depuis Village

- [x] Diagnostiquer pourquoi les onglets hors village deviennent actifs sans transition depuis `/game`.
- [x] Appliquer le replay d'animation au montage de la bottom nav du shell hors village.
- [x] Vérifier et pousser sur la branche PR.

### Review

- `GameShellLayout` passe maintenant `animateActiveOnMount` à la bottom nav hors village, comme `VillageView` le faisait déjà pour l'item `Village`.
- Les transitions gardent le comportement normal entre vues hors village, mais rejouent l'entrée active quand on sort de `/game`.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test GameShellLayout.test.tsx GameHeader.test.tsx` — 2 suites / 16 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi lint` — passé avec 3 warnings préexistants hors scope dans Armée/Onboarding.
- Vérification : `rtk yarn workspace battleforthecrown-pixi build` — passé.
- Vérification : `rtk git diff --check` — passé.
- QA IG restante : depuis `/game`, cliquer Armée, Messages puis Monde et vérifier que le sceau de l'item cible s'anime au lieu d'apparaître directement actif.

## 2026-06-01 — Niveau profil fixe

- [x] Remplacer le niveau profil affiché en haut par `1`.
- [x] Remplacer le niveau profil dans la bottom sheet profil par `1`.
- [x] Vérifier et pousser sur la branche PR.

### Review

- Ajout de `PLAYER_PROFILE_LEVEL = 1` comme valeur provisoire unique tant que la feature de progression joueur n'existe pas.
- Le badge profil haut de `/game`, le badge profil du header partagé et les données de bottom sheet profil utilisent maintenant cette valeur.
- Les niveaux de village/château restent inchangés dans les métadonnées village et la liste multi-villages.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test GameHeader.test.tsx GameShellLayout.test.tsx` — 2 suites / 16 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi lint` — passé avec 3 warnings préexistants hors scope dans Armée/Onboarding.
- Vérification : `rtk yarn workspace battleforthecrown-pixi build` — passé.
- Vérification : `rtk git diff --check` — passé.

## 2026-06-01 — Animation bottom nav vers Village

- [x] Diagnostiquer pourquoi l'item `Village` devient actif sans transition.
- [x] Rejouer l'animation active quand la bottom nav est montée directement sur `/game`.
- [x] Vérifier le changement et pousser sur la branche PR.

### Review

- La bottom nav accepte maintenant `animateActiveOnMount`, qui rend l'état actif après une frame pour laisser la transition CSS du sceau se jouer.
- `VillageView` active ce mode pour l'item `Village`, car cette nav est remontée depuis zéro quand on revient sur `/game`.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test GameShellLayout.test.tsx GameHeader.test.tsx` — 2 suites / 16 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi lint` — passé avec 3 warnings préexistants hors scope dans Armée/Onboarding.
- Vérification : `rtk yarn workspace battleforthecrown-pixi build` — passé.
- Vérification : `rtk git diff --check` — passé.
- QA IG restante : depuis Armée/Messages/Monde, cliquer `Village` et vérifier que le sceau sélectionné s'anime au lieu d'apparaître directement actif.

## 2026-06-01 — PR #34 commentaires review topbar

- [x] Lister les threads et commentaires encore ouverts sur la PR #34.
- [x] Vérifier que les anciens threads tests sont déjà couverts par le code courant.
- [x] Traiter le commentaire CodeRabbit sur la duplication `GameHeader` / `VillageView`.
- [x] Lancer les vérifications ciblées avant résolution/push.

### Review

- Threads `categorizeVillageBuildings`, `DailyRetentionWidget` et `QueueBottomSheet` : déjà couverts par les tests existants.
- Commentaire hors diff `GameHeader` : traité en extrayant les helpers partagés dans `features/layout/headerHelpers.ts` et les constantes profil dans `features/layout/profileSheetData.ts`.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test VillageViewData.test.ts DailyRetentionWidget.test.tsx QueueBottomSheet.test.ts GameHeader.test.tsx GameShellLayout.test.tsx` — 5 suites / 26 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi lint` — passé avec 3 warnings préexistants hors scope dans Armée/Onboarding.
- Vérification : `rtk yarn workspace battleforthecrown-pixi build` — passé.
- Vérification : `rtk git diff --check` — passé.

## 2026-06-01 — Topbar modulable Army

- [x] Cartographier le hero `/game`, le header legacy et `ArmyScreen`.
- [x] Remplacer la topbar legacy de `/game/army` par une topbar modulable inspirée de la vue village.
- [x] Afficher compte/profil, puissance royaume, couronnes, switch village et ressources dans le nouvel ordre.
- [x] Appliquer la modularité par route : Armée avec village+ressources, Monde avec village seul, Messages sans village ni ressources.
- [x] Ajouter une animation de recomposition à l'arrivée depuis la vue village.
- [x] Garder le contenu Armée inchangé.
- [x] Lancer les vérifications ciblées et documenter la QA.

### Review

- La topbar legacy de `/game/army` est remplacée par un header runtime en trois blocs modulables : compte, village, ressources.
- `/game/army` affiche compte + switch village + ressources ; `/game/world` affiche compte + switch village ; `/game/messages` affiche uniquement le compte.
- Le contenu métier de l'écran Armée n'est pas modifié.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test GameHeader.test.tsx GameShellLayout.test.tsx` — 2 suites / 16 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi lint` — passé avec 3 warnings préexistants hors scope dans Armée/Onboarding.
- Vérification : `rtk yarn workspace battleforthecrown-pixi build` — passé.
- Vérification : `rtk git diff --check` — passé.
- QA IG restante : vérifier `/game/army`, `/game/world` et `/game/messages` pour confirmer la composition visible de la topbar par route.

## 2026-06-01 — PR #34 commentaires review

- [x] Analyser les commentaires CodeRabbit de la PR #34 et séparer actionnable / non pertinent.
- [x] Ajouter les tests ciblés pour `categorizeVillageBuildings`.
- [x] Extraire et tester les helpers purs de `VillageViewSections`.
- [x] Ajouter les tests de régression DailyRetentionWidget / QueueBottomSheet.
- [x] Lancer les vérifications ciblées et pousser le follow-up sur la branche PR.

### Analyse

- `VillageViewData.ts` : pertinent. `categorizeVillageBuildings` transforme des données et applique une règle de lock ; ajout d'un test pur.
- `VillageViewSections.tsx` tests complets : partiellement pertinent. Le commentaire demande trop large pour de la présentation, mais les helpers de temps/nombre/progression/ratio sont de la logique pure à tester.
- `VillageViewSections.tsx` duplication progression queue : pertinent. Extraction d'un helper partagé.
- `DailyRetentionWidget.tsx` état contrôlé/non contrôlé : pertinent. Le nouveau contrat mérite une régression React ciblée.
- `QueueBottomSheet.tsx` fallback d'icône : pertinent. Ajout d'un test pur sur la règle.

### Review

- Ajout de tests purs pour la catégorisation bâtiments, les helpers de formatage/progression/ratios, l'affordability, et le fallback d'icône de queue.
- Ajout de tests React ciblés pour le contrat controlled/uncontrolled de `DailyRetentionWidget`.
- Extraction des helpers hors fichiers `.tsx` pour respecter `react-refresh/only-export-components`.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test VillageViewData.test.ts VillageViewSections.test.ts QueueBottomSheet.test.ts DailyRetentionWidget.test.tsx` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi lint` — passé avec 3 warnings préexistants Armée/Onboarding.
- Vérification : `rtk yarn workspace battleforthecrown-pixi build` — passé.
- Vérification : `rtk git diff --check` — passé.

## 2026-06-01 — Refacto vue village bâtiments

- [x] Remplacer la migration design incomplète par une vue village runtime cohérente avec les écrans Armée/Messages.
- [x] Supprimer le contrat obsolète `panel=buildings` et le code de bottom sheet bâtiments associé.
- [x] Conserver les interactions existantes : modales bâtiment, queue, profil, pouvoir, rétention, multi-village et style de village.
- [x] Aligner les tailles visuelles des composants/textes avec le reste de l'app.
- [x] Masquer le bouton `Améliorer` quand les ressources ou la population disponible ne permettent pas le prochain niveau.
- [x] Recaler le hero : nom de village légèrement réduit, asset plus contenu et mieux isolé verticalement.
- [x] Ajouter le swipe horizontal gauche/droite sur le hero pour changer de village.
- [x] Animer séparément l'asset et les informations village au changement de village.
- [x] Animer les jauges et valeurs de ressources quand le village actif change.
- [x] Compacter le statut capitale pour garder les métadonnées village sur une seule ligne.
- [x] Sortir `Village + nom` de la ligne des flèches pour donner plus de largeur au nom.
- [x] Remonter l'identité village sans déplacer l'asset ni les flèches gauche/droite.
- [x] Intégrer le hero au scroll principal avec un parallax multi-couches piloté par `scrollTop`.
- [x] Animer le hero au scroll sans modifier sa hauteur de layout.
- [x] Rendre la barre de ressources sticky quand elle atteint le haut du scroll.
- [x] Déplacer l'icône capitale sur le label `Village` pour libérer la ligne de métadonnées.
- [x] Simplifier la barre sticky ressources en 3 colonnes séparées par des dividers pleine hauteur.
- [x] Donner à la barre ressources sticky un fond glass semi-transparent avec blur.
- [x] Rendre l'animation de changement de village directionnelle avec un blur court.
- [x] Corriger l'affichage puissance : total royaume dans le top HUD, puissance village dans les métadonnées.
- [x] Masquer le style village tant que la Salle du Conseil n'est pas construite.
- [x] Corriger le saut de scroll au retour vers le haut après activation de la barre ressources sticky.
- [x] Lancer les vérifications ciblées et documenter la review.

### Review

- Suppression du flux `?panel=buildings` : plus de `BuildingManagementPanel`, `GameShellLayoutContext` ni helper de search param.
- Les cartes bâtiments restent cliquables pour ouvrir la modale détail ; le CTA vert `Améliorer` n'apparaît que si le coût du niveau suivant est payable.
- Le hero garde le shell village, mais l'asset est recentré dans une zone verticale dédiée et le titre village passe à une taille moins dominante.
- Le hero accepte maintenant un swipe gauche/droite pour changer de village ; l'asset et les informations se réaniment avec timings distincts.
- La barre de ressources rejoue une animation de remplissage et une micro-animation de valeur à chaque changement de village.
- Le statut `Capitale` est rendu en badge icône accessible pour éviter de forcer les coordonnées sur une seconde ligne.
- Le bloc identité (`Village` + nom) est maintenant full-width au-dessus des flèches, qui restent disponibles en bas sans réduire la largeur du nom.
- Les espacements du hero sont resserrés : l'identité remonte dans sa propre piste, la ligne de métadonnées est centrée verticalement avec les flèches, et l'asset reste à sa position.
- Le hero n'est plus hors du scroll : il sort avec le contenu et applique un parallax multi-couches piloté par le scroll (fond, glow, HUD, asset, identité).
- Le hero garde désormais une hauteur de layout stable de 368px ; l'effet scroll reste porté par les couches internes pour éviter le saut de scroll au retour vers le haut.
- L'ancrage de scroll est désactivé sur le conteneur scrollable et sur la scène hero pour éviter un recalage navigateur pendant le désancrage de la barre ressources sticky.
- La barre de ressources reste dans le flux au départ, puis devient sticky en haut pour garder les stocks visibles pendant la navigation dans les bâtiments.
- L'icône capitale est déplacée près du libellé `Village`, et la barre ressources affiche uniquement Bois/Pierre/Fer en colonnes denses sans cartes internes.
- La barre ressources sticky utilise maintenant un fond semi-transparent `backdrop-blur` pour laisser deviner le contenu dessous tout en gardant les valeurs lisibles.
- Le changement de village conserve la direction du switch : entrée depuis la gauche ou la droite avec blur rapide sur l'asset et les infos.
- Le top HUD affiche désormais la puissance totale du royaume, tandis que la ligne du village remplace la position par la puissance du village actif.
- Le badge de style village n'apparaît plus avant construction de la Salle du Conseil.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- Vérification : `rtk yarn workspace battleforthecrown-pixi lint` — passé avec 3 warnings préexistants hors scope dans Armée/Onboarding.
- Vérification : `rtk yarn workspace battleforthecrown-pixi build` — passé.
- Vérification : `rtk git diff --check` — passé.
- QA IG restante : vérifier sur `/game` que le hero respire mieux, que les bâtiments non payables affichent `Manque ressources`, et que les modales/sheets s'ouvrent comme avant.

## 2026-05-31 — Recalibration production ressources / pillage

- [x] Cartographier la source de vérité de production passive et ses consommateurs.
- [x] Réduire la courbe de production horaire pour que Château L10 demande ~35 h de production passive sur la ressource limitante.
- [x] Mettre à jour les tests et docs d'équilibrage production/coût.
- [x] Lancer tests ciblés, simulateur et static-check, puis documenter la review.

### Review

- Source corrigée : `RESOURCE_PRODUCTION_PER_HOUR` dans `packages/shared/src/resources/production.ts`, consommée backend par `WorldConfigService.getProductionRate`, `ResourcesService`, le frontend et `build-simulator.js`.
- Calibration : courbe passive `60 -> 1350/h`; Château L10 demande `46980 / 1350 = 34,8 h` sur la pierre en passif pur.
- Garde-fou : `buildings.spec.ts` vérifie que la production L10 garde Château L10 autour de 35 h de production passive sur la ressource limitante.
- Docs : `02`, `03`, `23` et ADR-17 alignent passif pur (~35-36 j), conquête active avec pillage (cible J+5-J+7) et ancienne cible construction pure (~7-8 j).
- Vérification : `rtk yarn workspace battleforthecrown-backend test -- buildings.spec.ts world-config.service.spec.ts` — 2 suites / 57 tests passés.
- Vérification : `rtk yarn static-check` — passé.
- Simulation passive mobile : `node scripts/build-simulator.js` — full L10 ~35,8 j, conquête éligible ~J+8,4, production finale 1350/h.
- Simulation passive tryhard : `node scripts/build-simulator.js --tryhard` — full L10 ~35,6 j, conquête éligible ~J+8,1.

## 2026-05-31 — Recalibration coûts bâtiments / entrepôt

- [x] Cartographier la source de vérité des coûts, de l'entrepôt et leurs consommateurs backend/Pixi.
- [x] Recalibrer les coûts ressources des bâtiments sur une fraction significative du max d'entrepôt atteignable.
- [x] Ajouter un invariant automatisé pour empêcher une courbe trop basse ou impossible à stocker.
- [x] Lancer les vérifications ciblées et documenter la review.

### Review

- Source corrigée : `BUILDING_DEFINITIONS` dans `packages/shared/src/village/buildings.ts`, consommée backend par `WorldConfigService.getCost` et frontend par les modales/cartes bâtiment.
- Calibration : coûts des bâtiments actifs rebasés sur une fraction stockable mais non négligeable de la capacité d'Entrepôt du palier ; `HIDEOUT` et `WALL` restent hors scope car désactivés MVP.
- Garde-fou : `buildings.spec.ts` vérifie que chaque bâtiment actif a un coût max significatif face à l'Entrepôt de référence et reste stockable.
- Vérification : `rtk yarn workspace battleforthecrown-backend test -- buildings.spec.ts world-config.service.spec.ts` — 2 suites / 56 tests passés.
- Vérification : `rtk yarn static-check` — passé.
- Simulation : `node scripts/build-simulator.js` — max village ~7,5 jours, idle ressources ~6h01.

## 2026-05-31 — PR 29 review follow-up

- [x] Trier les commentaires PR : 3 pertinents, 2 stale à ignorer.
- [x] Sourcer le bouclier débutant depuis `GET /worlds/public`.
- [x] Valider avec Zod la puissance royaume publique consommée par `useWorldCardModels`.
- [x] Gérer l'erreur memberships sur la page détail.
- [x] Lancer tests ciblés, commit et push.

## 2026-05-31 — Run 042 page détail royaume

- [x] Finaliser le préflight : branche `run/042-feature-world-detail-page`, règles, specs, briefings, politique PR.
- [x] Appliquer `bftc-design-system-migration` sur le composant détail world générique, sans phone shell ni fixtures dans le composant.
- [x] Cartographier le contrat public world actuel, décider `PublicWorld` suffisant ou DTO détail dédié.
- [x] Brancher `/worlds/:worldId`, bouton `Détails`, retour liste et absence de mutation join.
- [x] Afficher seulement les données sourcées : identity, status/lifecycle, tempoProfile, joinedCount, tier/sigil/theme, dimensions si contractées, stats personnelles conditionnelles.
- [x] Ajouter/adapter les tests ciblés Pixi/backend selon `bftc-tests-policy`.
- [x] Corriger review indépendante BLOCK : lifecycle phase days contractés, QA navigateur et preuves finales.
- [x] Stopper la re-review à la demande explicite du user après validation QA navigateur.
- [x] Vérifier type-check/tests/static-check, QA navigateur et impact docs.
- [x] Archiver la run, mettre à jour `tasks/README.md`, commit, push et PR ready.

### Review en cours

- Review indépendante initiale : `BLOCK`.
- Finding majeur confirmé : ne pas figer `inscriptionMainDays=7` / `inscriptionLateDays=3` dans la page détail ; exposer ou dériver proprement depuis le contrat public.
- Résolution : `PublicWorld.lifecycle` expose maintenant `inscriptionMainDays` / `inscriptionLateDays`, et la page détail consomme ces valeurs contractées.
- Dérogation validée : re-review stoppée sur demande user explicite, QA navigateur faite par le user et OK.

## 2026-05-31 — Run 043 layout shell jeu

- [x] Préflight : fiche run, règles repo, `SPEC.md`, briefing Pixi, contexte mémoire et ADR ciblées.
- [x] Créer un worktree dédié car le worktree principal est bloqué par un cherry-pick en cours.
- [x] Charger les skills frontend/tests/QA nécessaires.
- [x] Cartographier routes `/game/*`, shell actuel, chrome dupliqué, toasts, unread reports et tests existants.
- [x] Implémenter un layout jeu route-level séparé d’`AuthenticatedShell`.
- [x] Centraliser `GameHeader`, `BottomNavigationBar`, `ToastStack` et le badge Messages.
- [x] Implémenter le contrat URL borné `panel=buildings`.
- [x] Ajouter/adapter les tests ciblés layout/nav/panel/onboarding.
- [x] Lancer type-check, tests ciblés, `static-check` et QA navigateur desktop/mobile.
- [x] Faire review 5 axes + review indépendante obligatoire, corriger les findings.
- [x] Décider docs/SPEC, archiver la run, mettre `tasks/README.md` à jour, commit, push et PR ready.

## 2026-05-31 — Libellé construction bâtiment non construit

- [x] Identifier le composant de détail bâtiment concerné.
- [x] Corriger le libellé d'action niveau 0.
- [x] Ajouter une vérification ciblée.
- [x] Lancer tests ciblés et commit.

### Review

- Correction appliquée à `SpecializedBuildingDetailModal` pour la Caserne et aux bâtiments ressources pour garder le comportement cohérent.
- Vérification : `rtk yarn workspace battleforthecrown-pixi test ResourceBuildingDetailModal.test.tsx SpecializedBuildingDetailModal.test.tsx` — 2 files / 3 tests passés.
- Vérification : `rtk yarn workspace battleforthecrown-pixi type-check` — passé.
- QA IG restante : ouvrir une Caserne niv. 0 disponible et vérifier que le bandeau de coût et le bouton vert affichent `Construire`.

## 2026-05-31 — Politique smokes ciblés localement

- [x] Cartographier les consignes smokes dans skills, docs et agents.
- [x] Adapter `bftc-run`, `bftc-qa` et `bftc-tests-policy` à la stratégie local ciblé / CI exhaustive.
- [x] Nettoyer les docs `local-ci` et `smoke-tests`.
- [x] Aligner les agents `.codex` et `.claude` test-runner/test-writer.
- [x] Vérifier l'absence de contradictions et la validité du diff.

## 2026-05-31 — Politique PR run vs ticket

- [x] Documenter dans `bftc-run` : run → PR obligatoire sauf dérogation au démarrage ; ticket → PR seulement sur demande.
- [x] Aligner `tasks/runs/README.md` et `tasks/README.md`.
- [x] Vérifier l'absence de contradictions push/PR.
- [x] Remplacer les branches PR par `run/*` / `task/*` et les titres par `run(<id>): ...` / `task(<id>): ...`.
- [x] Garder CodeRabbit actif sur toutes les PR ouvertes tout en filtrant les commentaires low-level.
- [x] Ajouter la famille maintenance `maint/*` avec titres `maint(<scope>): ...` pour les skills autonomes.

## 2026-05-31 — Ticket 75 transition entrée monde

- [x] Charger le ticket, règles repo, `SPEC.md`, briefing Pixi et skill React HUD.
- [x] Cartographier `GameEntryTransition`, son montage shell et les tests existants.
- [x] Corriger le déclenchement overlay/audio pour distinguer vraie entrée jeu et navigation intra-jeu.
- [x] Ajouter/adapter les tests ciblés avec `bftc-tests-policy`.
- [x] Lancer tests ciblés, test pixi pertinent et `yarn static-check`.
- [x] Faire review 5 axes, décider docs/SPEC, archiver le ticket et commit final.

## 2026-05-29 — Skills maintenance autonome BFTC

- [x] Lire les patterns existants de skills BFTC et les règles docs/git.
- [x] Créer `bftc-daily-diff-maintenance` avec suivi par curseur Git, arrêt si PR existante, et PR unique.
- [x] Créer `bftc-debt-gardener` pour corriger une zone de dette générale bornée.
- [x] Ajouter les fichiers de suivi durables nécessaires hors `tasks/`.
- [x] Valider la structure des skills et documenter l'impact docs.

## 2026-05-29 — Cards bâtiments mobile

- [x] Revenir au layout dense 3 colonnes des cards bâtiments.
- [x] Grossir uniquement les informations internes sans agrandir les cards.
- [x] Passer chaque type de bâtiment en rail horizontal avec 2,5 cards visibles.
- [x] Ajouter le temps de construction avec l'asset horloge.
- [x] Aligner les villageois à gauche et le temps à droite.
- [x] Retirer la croix du tray et fermer via clic hors card.
- [x] Uniformiser la hauteur de card quel que soit le statut.
- [x] Déplacer le timer en overlay bas-droite de l'asset et retirer les indicateurs haut-droite.
- [x] Rendre les cards verrouillées en fond rayé avec l'asset cadenas.
- [x] Recaler les cards verrouillées : cadenas centré, badge requis rouge en bas-centre, sans opacité globale.
- [x] Réduire l'espace nom/ressources et redonner de l'espace vertical aux assets.
- [x] Nettoyer les styles de card pour retirer les lignes claires et shadows superposées.
- [x] Garder le padding bas pour éviter le recouvrement par le tray.
- [x] Vérifier type-check Pixi et impact docs.

## 2026-05-28 — Ajustement bottom sheet bâtiments

- [x] Confirmer que `GameBottomSheetPanel` est utilisé dans la vue.
- [x] Réduire et centrer la carte centrale de bâtiment.
- [x] Vérifier le type-check Pixi ciblé.
- [x] Documenter le résultat et l'impact docs.

## 2026-05-28 — Run 041 gestes mobile et bottom sheets

- [x] Charger la fiche run, règles repo, `SPEC.md`, briefing Pixi et skills frontend/tests.
- [x] Lire les sources ADR/mobile/UI bottom sheet et les tickets/runs connexes.
- [x] Cartographier `BottomSheet`, `GameBottomSheetPanel`, CSS racine, auth et drag Armée.
- [x] Appliquer le verrou mobile minimal au viewport sans casser les écrans auth.
- [x] Renforcer `BottomSheet` : swipe zone haute, non-interception des contrôles, capture/reset robuste.
- [x] Renforcer le body scrollable partagé des sheets.
- [x] Ajouter filet Vitest ciblé et docs UI mobile.
- [x] Ajouter filet Vitest de non-régression sur le drag tactile Armée après review indépendante.
- [x] Corriger l’index `tasks/README.md` pour le ticket 51 déjà archivé.
- [x] Lancer type-check/tests/static-check, review indépendante, QA, archive et commit.

## 2026-05-28 — Ticket 74 drag tactile recrutement Armée

- [x] Charger le ticket, règles repo, `SPEC.md`, briefing Pixi et skills frontend/tests/QA.
- [x] Cartographier le DnD Armée existant (`ArmyViewDesign`, `ArmyScreen`) et la source run 039.
- [x] Remplacer le DnD HTML5 par Pointer Events ciblés sur les tuiles déverrouillées.
- [x] Préserver tap simple, scroll vertical, tuiles verrouillées et comportement souris.
- [x] Vérifier type-check/tests/static-check et faire la review 5 axes.
- [x] Archiver le ticket, mettre à jour `tasks/README.md` et commit final.

## 2026-05-28 — Run 040 recalibration vitesse trajet

- [x] Charger la fiche run, règles repo, specs source, briefings backend/pixi et skill tests.
- [x] Cartographier `travel-time.ts`, `WorldConfigService`, l’ETA Pixi et les docs mobilité/tempo.
- [x] Recalibrer `REFERENCE_SPEED` à 6 et reformuler les commentaires liés.
- [x] Recalibrer les assertions backend en formules lisibles.
- [x] Aligner les docs 08/23/balance et auditer les exemples chiffrés de trajet.
- [x] Vérifier fixtures/seeds pour éviter une double compression.
- [x] Lancer build shared, tests backend/pixi, smokes requis et static-check.
- [x] Faire review, archiver la run, mettre à jour `tasks/README.md` et commit final.

## 2026-05-27 — Run 039 design-system vue armée

- [x] Charger la fiche run, règles repo, specs source et skills frontend/tests/QA.
- [x] Cartographier `ArmyScreen`, `UnitCard`, hooks armée et `ArmyViewDesign`.
- [x] Adapter les DTO runtime vers le design-system sans fixtures preview.
- [x] Brancher drag/drop réel et recrutement via mutation existante.
- [x] Ajouter les tests ciblés du view-model.
- [x] Lancer type-check/tests/static-check et QA visuelle.
- [x] Archiver la run et commit final.

## 2026-05-27 — Ajustement Armée stationnée ailleurs

- [x] Relire le modèle de garnison et le rendu actuel Armée/Caserne.
- [x] Grouper `Stationnées ailleurs` par village de destination.
- [x] Adapter les tests ciblés du view-model.
- [x] Vérifier type-check, test ciblé et rendu navigateur.
- [x] Transformer `Village` en lignes par type avec split moi/alliés et actions alignées au contrat garnison.

## 2026-05-27 — Dev DB inaccessible depuis `yarn dev`

- [x] Confirmer que le backend cible `postgresql://postgres:postgres@localhost:5432/battleforthecrown`.
- [x] Comparer l'état réel du conteneur Postgres avec le mapping attendu `5432:5432`.
- [x] Restaurer l'accès host au port 5432 sans reset de volume.
- [x] Appliquer/valider les migrations puis relancer `yarn dev`.
- [x] Documenter le diagnostic et la vérification.

## 2026-05-26 — Rattrapage onboarding sur faits déjà réalisés

- [x] Remplacer la validation purement séquentielle par une réconciliation ordonnée depuis les faits serveur.
- [x] Couvrir le cas où les étapes ont été réalisées avant que le tutoriel les demande.
- [x] Mettre à jour la spec gameplay onboarding.
- [x] Relancer les checks ciblés.

## 2026-05-26 — Bug validation milice onboarding

- [x] Vérifier l'inventaire serveur du village actif.
- [x] Identifier l'event `unit.trained` final resté pending dans l'outbox.
- [x] Appliquer la migration enum manquante sur la DB du worktree `battleforthecrown_7e47`.
- [x] Vérifier que l'outbox rejoue l'event et que l'étape passe à `UPGRADE_CASTLE_LEVEL_3`.

## 2026-05-26 — Étape Château 3 avant Tour de guet

- [x] Ajouter la nouvelle étape shared/Prisma et migration enum.
- [x] Adapter projection backend et smoke onboarding.
- [x] Aligner guidance frontend, preview et tests.
- [x] Lancer generate/checks/smoke ciblé et QA navigateur.

## 2026-05-26 — Badge quantité asset onboarding

- [x] Ajouter la prop de badge asset dans `OnboardingFab`.
- [x] Brancher `x5` uniquement sur l'étape `TRAIN_TROOPS`.
- [x] Adapter les tests ciblés.
- [x] Relancer checks et vérifier rapidement.

## 2026-05-26 — Animation passage étape onboarding

- [x] Inspecter le composant FAB/guidance et les tests existants.
- [x] Ajouter une animation courte déclenchée par changement d'étape.
- [x] Adapter le test frontend ciblé si utile.
- [ ] Relancer tests/checks et vérifier dans le navigateur.

## 2026-05-26 — Onboarding step 3 militia

- [x] Tracer la définition des étapes onboarding et la validation runtime.
- [x] Modifier l'étape 3 pour former 5 `MILITIA` et valider à `>= 5` formées.
- [x] Adapter les tests backend/front ciblés.
- [x] Relancer checks ciblés, smokes pertinents et QA navigateur.

## 2026-05-26 — Sync locale main

- [x] Diagnostiquer `HEAD`, `origin/main` et la branche locale `main`.
- [x] Mettre de côté les changements UI non commités.
- [x] Rebaser le `HEAD` détaché sur la branche locale `main`.
- [x] Réappliquer les changements UI et résoudre les conflits.
- [x] Relancer les vérifications ciblées.

## 2026-05-26 — Top menu visuel

- [x] Localiser les styles du top menu et confirmer le scope visuel.
- [x] Appliquer le fond brun/degrade et les deux boutons bois/bronze sans toucher au reste du header.
- [x] Verifier par tests cibles et serveur local.
- [x] Documenter le resultat et l'impact docs.

## Review

- Skills maintenance autonome : création de `bftc-daily-diff-maintenance` pour traiter les commits `main` non revus via curseur SHA et PR unique, avec arrêt si une PR existante est ouverte.
- Skills maintenance autonome : création de `bftc-debt-gardener` pour sélectionner une dette existante bornée, la corriger, vérifier et proposer une PR draft.
- Suivi durable : ajout de `.agents/maintenance/daily-diff-ledger.md` et `.agents/maintenance/debt-gardener-backlog.md`, hors `tasks/`.
- Vérification skills maintenance : validation YAML/frontmatter via Ruby ; le validateur officiel `quick_validate.py` est bloqué localement par l'absence du module Python `yaml`.

- Cards bâtiments mobile : chaque section de bâtiments devient un rail horizontal, avec largeur de card calculée pour afficher environ 2,5 cards ; coûts, libellés et temps de construction sont plus lisibles.
- Interaction tray bâtiments : suppression de la croix ; un clic dans le contenant hors card ferme le tray, les cards stoppent la propagation.
- Stabilité visuelle cards : hauteur minimale partagée pour éviter que les états `Max`/en cours/sans coût changent la taille de la card.
- Statuts cards bâtiments : suppression des flèches/cadenas haut-droite ; le temps est désormais en bas-droite de l'image et les verrouillés utilisent un fond rayé + `lock.png`.
- Ajustement final cards : zone asset augmentée, ressources rapprochées du nom ; verrouillées avec cadenas centré et niveau requis rouge en bas-centre.
- Nettoyage visuel cards : styles centralisés, suppression des outer/inset shadows sur les cards et retrait du drop-shadow des assets de card.
- Vérification cards bâtiments mobile : `rtk yarn workspace battleforthecrown-pixi type-check`.
- Ajustement bottom sheet bâtiments : `GameBottomSheetPanel` confirmé dans le rendu de `BuildingManagementPanel`; hero card centrée et limitée à `310px` sur mobile, avec image/typos réduites.
- Vérification ajustement bottom sheet bâtiments : `rtk yarn workspace battleforthecrown-pixi type-check`; QA worktree selon `docs/architecture/worktree-dev.md` avec DB `battleforthecrown_bottomsheet`, backend `http://localhost:15002/health`, frontend `http://localhost:5175/`; mesure navigateur mobile 390px : carte `left=40`, `width=310`, `right=350`.
- 2026-05-28 Run 041 gestes mobile/bottom sheets : verrou global `html/body/#root`, scroll auth explicite, régions `data-bottom-sheet-drag-region`/`data-bottom-sheet-scrollable` et non-interception des contrôles dans `BottomSheet`.
- Review run 041 : premier verdict indépendant `BLOCK` sur absence de preuve Armée ; ajout `ArmyViewDesign.test.tsx` pour drag tactile immédiat + scroll vertical ; re-review indépendante `GO`.
- Vérification run 041 : `rtk yarn workspace battleforthecrown-pixi test BottomSheet.test.tsx`, `rtk yarn workspace battleforthecrown-pixi test ArmyViewDesign.test.tsx BottomSheet.test.tsx`, `rtk yarn workspace battleforthecrown-pixi test`, `rtk yarn workspace battleforthecrown-pixi type-check`, `rtk yarn static-check`.
- QA worktree run 041 : DB temporaire `battleforthecrown_2e33`, backend `http://localhost:15002/health`, frontend `http://localhost:5174/`, `/design-system` et `/auth/login` HTTP 200 ; tests tactiles réels laissés au user.
- 2026-05-28 Ticket 74 drag tactile Armée : HTML5 DnD remplacé par Pointer Events avec seuil 8 px, ghost visuel, hit-test au `pointerup` et scroll vertical tactile préservé via pan manuel conditionné.
- Review ticket 74 : premier verdict indépendant `BLOCK` sur capture du scroll tactile, correction appliquée (`scrollBy` + garde direction scrollable), re-review indépendante `GO`.
- Vérification ticket 74 : `rtk yarn workspace battleforthecrown-pixi type-check`, `rtk yarn workspace battleforthecrown-pixi test`, `rtk yarn static-check`.
- 2026-05-27 Run 039 armée : correction de scope après feedback user, shell runtime `/game/army` conservé (`GameHeader` + `BottomNavigationBar`), seule la zone contenu Army consomme le design-system.
- Review run 039 : findings bloquants résolus, drag actif uniquement sur vrai `dragstart`, actions `Renvoyer`/`Rappeler` conservées via bottom sheet garnison, popup recrutement en mode `embedded` sans double top.
- Vérification run 039 : `rtk yarn workspace battleforthecrown-pixi type-check`, `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel`, `rtk yarn workspace battleforthecrown-pixi test`, `rtk yarn static-check`.
- Ajustement Armée stationnée ailleurs : les renforts sortants sont groupés par village de destination, avec ligne compacte par village, badges d'unités chevauchés, total de troupes et puissance estimée.
- Ajustement visuel Armée : espacement augmenté avant `Stationnées ailleurs` et sous-titre remplacé par `Depuis : —` tant que le contrat garnison ne fournit pas d'heure réelle.
- Ajustement Armée village : la section `Village` passe en lignes par type de troupe avec détail `Moi` / `Alliés`; le clic ouvre les lignes entrantes renvoyables uniquement quand des alliés sont présents.
- Ajustement Armée résumés : les compteurs de section `Village` et `Stationnées ailleurs` affichent désormais la puissance totale avec l'asset puissance.
- Ajustement Armée interaction : les lignes sans alliés ne déclenchent plus la modale détail ; seul l'asset de gauche ouvre le détail troupe.
- Ajustement Armée répartition : retour à deux badges explicites `Moi` / `Alliés`, colorés et de largeur stable ; suppression de la barre de ratio jugée moins lisible.
- Ajustement Armée bottom nav : suppression du `pb-24` interne au profit d'une marge externe basée sur `--bftc-bottom-nav-height`, pour éviter la bande visible entre contenu et navigation.
- Ajustement Garnison : la bottom sheet adopte le style Armée, affiche village + joueur quand disponible et ajoute le bouton design `position.png` sans navigation carte.
- Vérification ajustement Armée : `rtk yarn workspace battleforthecrown-pixi type-check`, `rtk yarn workspace battleforthecrown-pixi test -- armyViewModel`, inspection navigateur `/game/army` onglet `Armée`, ouverture de la garnison `Ruined Fort` et ouverture de `Écuyer alliés` depuis la section `Village`.
- 2026-05-27 Dev DB : root cause = le conteneur `battleforthecrown-postgres` était healthy mais sans port host publié (`docker port` vide, `pg_isready localhost:5432` en échec), alors que Compose attend `5432:5432`.
- Correction : `docker compose up -d --force-recreate postgres` depuis `battleforthecrown-backend/`, sans reset Prisma et sans suppression du volume `battleforthecrown-backend_postgres_data`.
- Vérification : `pg_isready -h localhost -p 5432 -U postgres -d battleforthecrown`, `yarn workspace battleforthecrown-backend prisma migrate deploy`, `yarn dev`, `curl http://localhost:15001/health`, `curl -I http://localhost:5173/`.
- Changements limites au fond du top menu et aux boutons precedent/suivant du village.
- Ajustement apres review visuelle : ombre des boutons adoucie.
- Ajustement UX : suppression de la ligne secondaire du header village ; la capitale remplace le label `Village` par `Capitale` et le bloc titre est centre verticalement.
- Bottom navigation : fond et bordure haute alignes sur le top menu.
- Village view : suppression du fond gradient parchment du wrapper parent, vraie source de la bande visible autour du bottom nav.
- Verification : `yarn workspace battleforthecrown-pixi test GameHeader.test.tsx`, `yarn workspace battleforthecrown-pixi type-check`, `yarn workspace battleforthecrown-pixi lint:check --quiet`.
- Serveur local lance : `http://127.0.0.1:5173/`.
- Browser in-app indisponible dans cette session (`iab` absent), donc pas de capture automatique.
- Docs : aucun changement necessaire.
