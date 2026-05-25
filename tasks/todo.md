# Run 035 — early barbarian reachability

- [x] Préflight : worktree clean, fiche run, règles, `SPEC.md`, lessons et specs gameplay lues.
- [x] Cartographier la portée Watchtower, le seeding barbare, la vision serveur et le gate combat.
- [x] Implémenter la portée Watchtower L1=10 en gardant une vision finie et cohérente par niveau.
- [x] Garantir après le seeding normal un village barbare T1 dans le rayon Watchtower L1 si aucun T1 atteignable n'existe déjà.
- [x] Préserver l'idempotence et l'anti-submersion : une seule cible proche jouable, pas de reseed local infini.
- [x] Ajouter/adapter les tests pure-logic et le smoke backend join -> seeding -> vision -> attaque.
- [x] Mettre à jour `docs/gameplay/03-buildings.md` et `docs/gameplay/07-barbarian-spawning.md`.
- [x] Review 5 axes + review indépendante si le diff/invariant le requiert.
- [x] Lancer les gates requis : tests ciblés, `yarn test:smoke:preflight`, smoke backend, `yarn static-check`.
- [x] Finaliser la fiche run : rapport `Acceptance & QA`, archive, README tasks et commit unique.

## Review

- Watchtower L1 portée à 10 cases, progression finie jusqu'à L10=55.
- Le seeding barbare garantit une seule cible T1 proche si aucune cible T1 n'est déjà visible au rayon L1.
- Tests ciblés verts : 3 suites / 63 tests.
- Smokes backend verts : preflight OK, 24 suites / 50 tests.
- `static-check` vert après corrections de review.
- Review indépendante : `BLOCK` initial corrigé, re-review `GO`.
- Docs : mises à jour `00-game-flow.md`, `01-overview.md`, `03-buildings.md`, `07-barbarian-spawning.md`.
