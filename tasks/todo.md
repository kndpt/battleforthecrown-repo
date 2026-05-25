# 073 - Format compact ressources et villageois dans le header

- [x] Preflight : worktree clean, ticket, rules, SPEC et briefing Pixi lus.
- [x] Cartographier `GameHeader`, `resourceConfig` et le test existant.
- [x] Ajouter un formatter compact dedie au header.
- [x] Brancher ce formatter uniquement sur ressources et population disponible.
- [x] Adapter le test frontend cible.
- [x] Lancer les verifications ciblees puis `yarn static-check`.
- [x] Review 5 axes, impact docs, archive et commit.

## Review

- Correctness : formatter dedie au header uniquement ; `formatResourceAmount` reste disponible pour combat/scout/details.
- Readability : logique de formatage isolee dans `resourceConfig`, appel explicite depuis `GameHeader`.
- Architecture : pas de changement backend/shared/API ; population conserve `population.available`.
- Security/performance : aucun nouvel input utilisateur ni cout runtime significatif.
- QA : test cible, type-check, lint, static-check et verification navigateur sur env worktree.
- Docs : aucun changement documentaire durable necessaire, le ticket archive trace la decision locale.
