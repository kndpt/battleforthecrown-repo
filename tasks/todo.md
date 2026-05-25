# Run 033 - Feature worlds selection screen

- [x] Preflight: verifier worktree clean, fiche run, rules, SPEC, skills specialises et specs source.
- [x] Cartographier prototype design-system `Choix du Monde.html` / `world-views.jsx` et l'existant Pixi worlds/profile.
- [x] Porter la variante B en composants React/Tailwind typés sous `battleforthecrown-pixi/src/features/design-system/worlds/`.
- [x] Ajouter les apercus `/design-system` avec fixtures issues du prototype, sans hardcode dans les composants.
- [x] Remplacer l'ancien `/worlds` par `WorldsSelectionScreen` branche sur `GET /worlds/public`.
- [x] Câbler CTA `OPEN` vers `useJoinWorldMutation`, `PLANNED` vers toast placeholder, `LOCKED` disabled.
- [x] Câbler le bloc monde du profil joueur vers l'ecran `/worlds`.
- [x] Ajouter les tests Pixi/Vitest sur view-models worlds: statut, filtrage, compteurs, CTA.
- [x] Lancer tests cibles, `yarn workspace battleforthecrown-pixi type-check`, `yarn static-check`.
- [x] Faire review 5 axes + review independante, fixer les findings bloquants/majeurs.
- [x] Verifier impact docs, completer la fiche run, archiver, mettre a jour `tasks/README.md`, commit unique.

## Decisions prises

- Mode complet: UI visible + migration design-system + route + tests, diff probablement > 100 lignes.
- Scope backend nul: `GET /worlds/public` et `world.status.changed` existent deja via run 032.
- Variante production prioritaire: B bannières heraldiques, avec A/C gardees hors integration API pour iterations futures uniquement si le budget reste raisonnable.
- Pas de chip d'activite/densite: la ligne metriques utilise joueurs + tier, conforme clarification.
- Join error affiche une notice non bloquante, afin de laisser les cartes et CTA visibles apres un echec.

## Review

- Correctness: `GET /worlds/public` consomme le DTO public via Zod, onglets derives localement, `LOCKED` affiche uniformement `Inscription close`.
- Readability: mapping DTO -> UI isole dans `worldsViewModel`, composant design-system props-only, fixtures separees.
- Architecture: aucun calcul autoritatif frontend; le screen consomme status/lifecycle/identity publics et reutilise mutation join existante.
- Security: endpoint public sans auth deja existant, aucune donnee sensible ajoutee.
- Performance: transformation memoisee, liste locale simple, pas de polling supplementaire.
- Review independante: BLOCK initial corrige (notice join, test rendu, phase brute), re-review GO.
- Docs: aucun changement necessaire, UI consommatrice sans nouvelle convention durable.
