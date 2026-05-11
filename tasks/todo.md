# Simplification multi-agent skills

## Plan

- [x] Vérifier l'état Git et les sources actuelles `.agents` / `.claude` / `.codex` / `.gemini`.
- [x] Valider avec le user la cible single-source `.agents/skills`.
- [x] Supprimer les commandes Claude dupliquées et le dossier `.gemini`.
- [x] Rendre `run` / `plan-run` harness-neutral dans `.agents/skills`.
- [x] Mettre à jour les docs qui référencent slash commands ou Gemini.
- [x] Supprimer les docs safety-fallbacks redondantes et condenser le filet dans `tasks/runs/README.md`.
- [x] Transformer les rules longues tests/QA/Prisma/workers/React HUD/Pixi en skills à la demande.
- [x] Condenser `nest-conventions.md` en invariants backend courts.
- [x] Mettre à jour `AGENTS.md` root/backend/pixi et `$run` pour charger les skills au bon moment.
- [x] Supprimer les rules proxy restantes et corriger les agents Claude/Codex vers les skills.
- [x] Corriger les dernières références obsolètes vers `tests.md` / anciennes rules dans les docs actives.
- [x] Canoniser le preflight smoke DB et rendre `static-check` moins verbeux.
- [x] Vérifier diff, grep résiduel, docs impact et checks pertinents.

## Review

- Correctness : `run` et `plan-run` ont une seule source dans `.agents/skills`; les noms d'agents sont explicités par harness Claude Code/Codex.
- Readability : docs remplacent les anciennes slash commands par les skills workspace `$run` / `$plan-run`; safety-fallbacks condensé dans `tasks/runs/README.md`.
- Architecture : `.claude/skills` et `.codex/skills` restent des symlinks vers `.agents/skills`; `.claude/commands`, `.gemini`, les docs safety-fallbacks et les rules proxy supprimés ; règles permanentes limitées à conventions/docs/git + nest invariants.
- Security : aucun secret ni configuration runtime touché.
- Performance : aucun impact runtime.
- Vérifications : grep ciblé anciens chemins/invocations actifs, agents Claude/Codex audités, symlinks OK, validation manuelle frontmatter skills OK, `rtk yarn static-check` PASS.
- Suite cleanup : docs actives déplacées vers `bftc-tests-policy` / `.agents/{rules,skills}`, descriptions skills raccourcies, preflight smoke DB canonisé via `yarn test:smoke:preflight`, `static-check` utilise ESLint `--quiet` et filtre le warning externe `baseline-browser-mapping`.
- Docs : mises à jour dans `AGENTS.md` root/backend/pixi, `tasks/README.md`, `tasks/runs/README.md`, `docs/architecture/*`, rules condensées, skills, règle conventions et leçon associée.
