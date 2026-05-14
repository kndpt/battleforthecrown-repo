# Decisions

- 2026-05-11: Multi-agent skills : `run` et `plan-run` vivent uniquement dans `.agents/skills/`; Claude Code et Codex consomment via `.claude/skills` / `.codex/skills` symlinks. Ne pas recréer `.claude/commands` pour ces pipelines; `.gemini` est abandonné.
- 2026-05-11: Docs `$bftc-run` : supprimer les docs `safety-fallbacks*` redondantes; garder le filet opérationnel dans `tasks/runs/README.md` + le détail exécutable dans `.agents/skills/bftc-run/SKILL.md`.
- 2026-05-11: Contexte agent permanent : privilégier AGENTS + rules invariantes seulement (~2.4k mots après refacto final) et déplacer les procédures longues en skills (`bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`, `bftc-react-hud`, `bftc-pixi-scene`). Ne pas garder de rule qui sert seulement à trigger un skill.
- 2026-05-11: Smokes backend : `yarn test:smoke` et le hook pre-push passent par `yarn test:smoke:preflight`, source canonique `battleforthecrown-backend/scripts/smoke-preflight.sh` (Docker, DB smoke, migrations).
- 2026-05-10: Agents Codex : réserver `gpt-5.5` aux rôles à fort jugement (`run_planner`, `implementer`, `test_writer`), garder `gpt-5.4-mini` pour cartographie/exécution tests, utiliser `gpt-5.4` pour documentation.
- 2026-05-10: Frontend village : `battleforthecrown-pixi/src/features/village/buildingLockState.ts` est la source unique de classification des états bâtiment côté UI (`unbuilt-locked`, `unbuilt-available`, `in-progress`, `available`, `max`).
- 2026-05-10: Pipeline `$bftc-run` : les prompts `implementer` doivent utiliser les labels stables `Spec source`, `Fichiers à toucher`, `Changement attendu`, `Hors scope explicite`, `Critère de succès`; `Spec source` peut combiner ticket/finding + doc canonique.
