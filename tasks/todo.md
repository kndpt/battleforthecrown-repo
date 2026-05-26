# Todo

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

- Changements limites au fond du top menu et aux boutons precedent/suivant du village.
- Ajustement apres review visuelle : ombre des boutons adoucie.
- Ajustement UX : suppression de la ligne secondaire du header village ; la capitale remplace le label `Village` par `Capitale` et le bloc titre est centre verticalement.
- Bottom navigation : fond et bordure haute alignes sur le top menu.
- Village view : suppression du fond gradient parchment du wrapper parent, vraie source de la bande visible autour du bottom nav.
- Verification : `yarn workspace battleforthecrown-pixi test GameHeader.test.tsx`, `yarn workspace battleforthecrown-pixi type-check`, `yarn workspace battleforthecrown-pixi lint:check --quiet`.
- Serveur local lance : `http://127.0.0.1:5173/`.
- Browser in-app indisponible dans cette session (`iab` absent), donc pas de capture automatique.
- Docs : aucun changement necessaire.
