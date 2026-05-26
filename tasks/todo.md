# Run 038 - Quarter population scaling modal

- [x] Preflight : git clean, fiche run, regles, lecons, SPEC et docs gameplay lues.
- [x] Cartographie : `getQuarterPopulationLimit` est la source partagee consommee par backend, conquete, world-config et modale Quartier.
- [x] Corriger la courbe de population Quartier pour couvrir les niveaux 1..10 avec un delta non nul 7 -> 8.
- [x] Corriger le rendu Quartier pour afficher une capacite de logement, pas une production `/ heure` ou `/ h`.
- [x] Ajouter les regressions ciblees : helper population, construction Quartier 7 -> 8, rendu/modal sans unite horaire.
- [x] Verifier donnees existantes : correction non destructive appliquee sur 27 lignes locales, puis 0 mismatch.
- [x] Lancer les checks cibles, smokes backend requis, puis `rtk yarn static-check`.
- [x] Review 5 axes + review independante, puis archive run et commit unique.

## Review

- Correctness : courbe Quartier 1..10 couverte, upgrade 7 -> 8 smoke, conquete/world-config restent sur helper shared.
- Readability : changement localise ; noms UI gardes dans `ResourceBuildingModal`, tests explicites sur capacite/logement.
- Architecture : source de verite conservee dans `packages/shared`; backend et frontend consomment sans dupliquer de logique canonique.
- Security : aucun endpoint/auth/secrets modifies ; SQL local non destructif, update cible sur `population.max`.
- Performance : impact nul hors lookup constant en table.
- Docs : aucun changement necessaire ; les docs gameplay pointent deja vers `packages/shared/src/village/population.ts` pour les valeurs exactes.
