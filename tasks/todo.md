# Ticket 54 - Retour fantôme pendant capture

## Plan

- [x] Preflight : lire leçons, vérifier worktree, identifier changements hors scope.
- [x] Analyse : tracer backend combat/conquête, event `battle.resolved`, store expéditions frontend et rendu Pixi.
- [x] Ticket : créer une fiche active avec symptôme, cause racine, scope et critères de succès.
- [x] Vérification : relire diff et vérifier absence de modification hors scope.
- [x] Commit : stage des fichiers de ticket/docs et commit en anglais.

## Notes d'analyse

- Worktree déjà modifié hors scope : `battleforthecrown-backend/src/common/auth/jwt-auth.guard.ts`. Ne pas toucher.
- En conquête réussie avec Seigneur survivant, `combat.worker.ts` transfère les survivants en `garrison` puis supprime ces unités de `returningUnits`.
- Juste après, `returnAt` reste calculé sur `hasReturningUnits || hasReturningLoot`. Donc une capture avec `returningUnits = {}` mais loot > 0 produit encore une expédition `RETURNING`.
- Le frontend ne semble pas inventer le retour : `applyBattleResolved` bascule en `RETURNING` seulement quand `payload.returnAt` existe, puis `ExpeditionVisual` affiche le glyph `🐎` pour `progress.returning`.

## Review

- Ticket actif `tasks/54-conquest-capture-phantom-return.md` créé avec cause racine, comportement attendu, scope backend et smoke de régression.
- `tasks/README.md` référence le ticket dans les actifs.
- Aucun fichier runtime modifié. Le fichier auth déjà sale reste hors scope.
