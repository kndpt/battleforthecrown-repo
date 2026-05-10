# Decisions

- 2026-05-10: Agents Codex : réserver `gpt-5.5` aux rôles à fort jugement (`run_planner`, `implementer`, `test_writer`), garder `gpt-5.4-mini` pour cartographie/exécution tests, utiliser `gpt-5.4` pour documentation.
- 2026-05-10: Frontend village : `battleforthecrown-pixi/src/features/village/buildingLockState.ts` est la source unique de classification des états bâtiment côté UI (`unbuilt-locked`, `unbuilt-available`, `in-progress`, `available`, `max`).
- 2026-05-10: Pipeline `$run` : les prompts `implementer` doivent utiliser les labels stables `Spec source`, `Fichiers à toucher`, `Changement attendu`, `Hors scope explicite`, `Critère de succès`; `Spec source` peut combiner ticket/finding + doc canonique.
