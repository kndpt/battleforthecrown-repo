# Progress

## In Progress

## Done

- 2026-05-31: Ticket 076 termine : annulation de formation depuis les `QueueChip` Caserne avec confirmation design-system, mutation existante branchee, pending global sur actions queue, test `ArmyViewDesign` + type-check Pixi + static-check verts.
- 2026-05-31: Run 043 termine : `GameShellLayout` route-level centralise header/nav/toasts/power/unread pour `/game/*`; `VillageView` ouvre les bâtiments via `panel=buildings`; tests Pixi/static-check et QA navigateur verts.
- 2026-05-31: Automations Codex BFTC creees : prompts commencent par `$bftc-maint-new-commits`, `$bftc-maint-debt`, `$bftc-refactor-{backend,pixi,shared}`; toutes actives en worktree aux horaires de `.agents/maintenance/trigger-strategy.md`.
- 2026-05-31: Politique smokes agent mise a jour : local cible par fichiers `*.smoke.spec.ts`, full smoke porte par CI PR ; skills/docs/agents Codex+Claude alignes.
- 2026-05-31: Politique PR `$bftc-run` clarifiee : fiche run -> PR ready obligatoire sauf derogation explicite au demarrage ; ticket simple -> pas de PR sauf demande user.
- 2026-05-31: Ticket 075 termine : `GameEntryTransition` ne rejoue plus overlay/audio sur navigation interne `/game/*`; entree depuis hors-jeu et reload direct restent couverts par Vitest + static-check.
- 2026-05-25: Ticket 073 termine : formatter compact lowercase dedie au header Pixi pour ressources + `population.available`, sans toucher `formatResourceAmount` global ; test `GameHeader` + static-check verts.
- 2026-05-11: Simplification multi-agent run/plan-run : `.agents/skills` devient la source unique, `.claude/commands` et `.gemini` supprimés, docs alignées sur `$bftc-run` / `$plan-run`.
- 2026-05-11: Rules diet : tests/QA/Prisma/workers/React HUD/Pixi déplacés en skills à la demande, `nest-conventions.md` condensé, AGENTS/rules passés en bootstrap court.
- 2026-05-11: Cleanup post-rules : docs actives repointées vers `.agents/{rules,skills}`, descriptions skills raccourcies, preflight smoke DB canonisé, `static-check` passé en ESLint `--quiet` + filtre du warning `baseline-browser-mapping`.
- 2026-05-10: Revue des modèles `.codex/agents/` ; `run_planner`, `implementer`, `test_writer` migrés vers `gpt-5.5`, `doc_writer` vers `gpt-5.4`, agents rapides conservés en `gpt-5.4-mini`.
- 2026-05-10: Run 009 terminé et archivé : frontend village lock-aware via `getBuildingLockState`, modale verrouillée sans upgrade, scène Pixi sans bâtiments level 0, labels `Non construit`, tests/build Pixi verts.

## Blocked
