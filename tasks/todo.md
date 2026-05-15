# Ticket 66 - Inbox report outcome uses losses heuristic

## Plan

- [x] Preflight : Git clean, ticket 66 lu, rules/SPEC/briefing Pixi charges.
- [x] Cartographie : verifier les heuristiques liste et l'usage de `ReportCard`.
- [x] Implementation : remplacer les heuristiques locales par `combatReportOutcome(report).isVictory`.
- [x] Tests : ajouter les cas attacker wipe et attacker survives dans `combatReportView.test.ts`.
- [x] Review : verifier diff, coherence liste/modal et suppression du pattern `defenderLosses >= attackerLosses`.
- [x] Verification : lancer test Pixi cible puis `yarn static-check`.
- [x] Documentation : verifier impact docs et justifier.
- [x] Archive : passer ticket en DONE, archiver, mettre a jour `tasks/README.md`, commit.

## Choix de scope

- Inclus : `ReportsList.tsx`, car c'est le rendu inbox actif.
- Inclus : `ReportCard.tsx`, car le ticket exige de supprimer l'heuristique du dossier combat meme si le composant n'est plus monte.
- Inclus : tests unitaires sur la source commune `combatReportOutcome`.
- Exclu : refonte de l'inbox ou changement backend/shared.

## Review

- `ReportsList.tsx` et `ReportCard.tsx` consomment maintenant `combatReportOutcome`, la meme source que le modal.
- Le pattern heuristique `defenderLosses >= attackerLosses` n'existe plus dans `features/combat/`.
- Les tests couvrent le cas reproductible attacker wipe et le cas inverse attacker survives avec pertes lourdes.
- Docs : aucun changement canonique attendu ; la regle vit deja dans `packages/shared/src/combat/utils.ts`.
- Verification : `yarn workspace battleforthecrown-pixi test src/features/combat/combatReportView.test.ts` vert ; `yarn static-check` vert apres `prisma generate` local.
