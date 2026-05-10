# Ticket 29 — puissance publique village + royaume

## Plan

- [x] Préflight : repo clean, ticket ouvert, spec et rules relues.
- [x] Trancher les questions produit avec l'utilisateur.
- [x] Cartographier le module power backend.
- [x] Ajouter des endpoints publics dédiés pour village et royaume.
- [x] Vérifier build, QA backend, review et docs.
- [x] Archiver le ticket, mettre à jour `tasks/README.md` et commit.

## Review

- Correctness : aucun finding bloquant ou majeur. Les endpoints propriétaires restent inchangés, les endpoints publics retournent des payloads dédiés.
- Readability : aucun finding.
- Architecture : aucun finding. Piste B retenue pour éviter les DTOs variables sur les routes existantes.
- Security : risque assumé par arbitrage produit sur `kingdomPower` public ; la puissance armée par village reste non exposée.
- Performance : aucun finding pour le scope actuel.
- Vérifications : build backend, tests backend, QA curl sur routes publiques et route propriétaire protégée.
- Docs : mises à jour `docs/architecture/auth.md` et `docs/architecture/backend-modules.md`.
