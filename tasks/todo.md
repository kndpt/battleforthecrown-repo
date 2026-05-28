# Todo

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
