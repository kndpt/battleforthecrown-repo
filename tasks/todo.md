# Todo

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
