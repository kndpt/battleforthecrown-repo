# Codex Instructions

This repository keeps its agent instructions in `CLAUDE.md` files.

Before making or reviewing changes:

- Read the root `CLAUDE.md`.
- Find and read every relevant `CLAUDE.md` on the path to the files you will inspect or edit.
- Find and read relevant `.claude/rules/**/*.md` files. Rules in a subtree apply when the task touches that subtree; path-scoped rules apply when their frontmatter matches the files involved.
- Current known instruction files:
  - `CLAUDE.md`
  - `battleforthecrown-pixi/CLAUDE.md`
- Current known rule files:
  - `.claude/rules/conventions.md`
  - `.claude/rules/docs.md`
  - `.claude/rules/git.md`
  - `battleforthecrown-backend/.claude/rules/nest-conventions.md`
  - `battleforthecrown-backend/.claude/rules/prisma.md`
  - `battleforthecrown-backend/.claude/rules/workers.md`
  - `battleforthecrown-pixi/.claude/rules/pixi-conventions.md`
  - `battleforthecrown-pixi/.claude/rules/react-hud.md`
- Treat those files as the project guidance for Codex, unless they conflict with higher-priority system, developer, or user instructions.
- Do not duplicate Claude instructions here. Update the relevant `CLAUDE.md` file when project rules change.
