# Run 67 — power realtime combat events

- [x] Préflight : worktree clean, ticket lu, rules/spec/briefings chargés.
- [x] Cartographie : WS bindings, tests, payloads partagés, workers combat/return/conquête.
- [x] Implémenter les invalidations power sur events combat côté frontend.
- [x] Ajouter les tests Vitest ciblés.
- [x] Review diff 5 axes.
- [x] Vérifier : test ciblé, `yarn test:pixi`, smokes backend, `yarn static-check`.
- [x] Documentation impact + archive ticket prêts pour commit.

## Review

- Correctness : power invalidée sur pertes attaquant/défenseur, retour survivants, conquête nouveau + ancien propriétaire.
- Readability : réutilisation du helper existant `invalidatePowerQueries`; pas de nouveau signal frontend.
- Architecture : l'Outbox reste DB-first, `village.conquered` transporte le fait métier complet.
- Security : pas de nouvelle exposition sensible, seulement les IDs déjà participants de l'event.
- Performance : +2 invalidations TanStack par event concerné, borné aux événements combat existants.

## Vérification

- `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 rtk yarn workspace battleforthecrown-pixi test src/api/ws-bindings.test.ts` : OK, 23 tests.
- `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 rtk yarn workspace battleforthecrown-pixi test` : OK, 25 files / 138 tests.
- `rtk yarn test:smoke:preflight` : OK.
- `rtk yarn test:smoke` : OK après `rtk yarn workspace battleforthecrown-backend prisma generate`, 22 suites / 43 tests.
- `rtk yarn static-check` : OK.

## Notes de cartographie

- `battle.resolved` : pertes attaquant déjà persistées à la résolution, `villageId` disponible.
- `village.attacked` : pertes défenseur persistées, `defenderVillageId` disponible.
- `village.conquered` : event user-scoped au nouveau propriétaire via `newOwnerId`; ancien propriétaire non notifié par cet event.
- `battle.returned` : pas no-op pour la puissance, le `ReturnWorker` réinsère les survivants dans `unitInventory`; la power backend lit `unitInventory`.
