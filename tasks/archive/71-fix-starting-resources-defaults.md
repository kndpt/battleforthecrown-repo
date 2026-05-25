# 71 — Stock initial absent sur inscription monde

**Sévérité** : 🟡 Majeur
**Statut** : ✅ Résolu 2026-05-25
**Spec amont** : [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) — le starting stock couvre les premiers upgrades.

## Symptôme | Problème

Quand un joueur rejoint un nouveau monde sans variables `.env` `*_STARTING_AMOUNT`, son village démarre avec `0/0/0` ressources. La production passive remonte ensuite lentement, mais l'inscription est cassée.

Le header affichait aussi `population.used` (`17`) alors que l'info utile joueur est la population disponible : `population.available = max - used` (`233` au départ).

## Cause racine

`JoinWorldUseCase` lisait `WOOD_STARTING_AMOUNT`, `STONE_STARTING_AMOUNT`, `IRON_STARTING_AMOUNT` avec un fallback `0`. En dev local, ces variables ne sont pas définies.

## Résolution

- Fallback serveur durable à `1000` bois/pierre/fer si l'env est absente.
- Overrides env conservés.
- Env invalide refusée explicitement.
- Header et listes villages branchés sur `population.available`.
- Village local `fresh-open` réparé en DB : `13/13/13` → `1000/1000/1000`.

## QA

- Test backend ciblé : `join-world.use-case.spec.ts` OK.
- Test Pixi ciblé : `GameHeader.test.tsx` OK.
- `yarn static-check` OK.
- QA API locale : nouveau compte `qa-starting-1779727160@test.local` + join `fresh-open` → `1000/1000/1000`, `17/250`.
- Smokes backend : 24 suites / 48 tests OK.
