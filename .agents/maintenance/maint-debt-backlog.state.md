# maint-debt — candidats (réécrit chaque run)

last: 2026-06-13 | archive: `archive/maint-debt/2026-06-13-full.md`
branch: `maint/debt/<topic>` | title: `maint(debt): <subject>`

## candidate

| area | note |
|------|------|
| pixi magic 3600 + formatDuration dup | UI text differs — need product call before dedupe |
| VillageCanvas + VillageScene pipeline | zero importers — needs retire-canvas decision, too broad |
| pixi local clamp dup (OnboardingFab) | local clamp vs lib/math.ts export — trivial 1-file fix |
| backend combat.service BadRequest→NotFound | ~11 lines "not found" use 400 instead of 404 — 1 file but critical path, needs review |
| pixi formatNumber mismatch | PowerBottomSheet (Intl) vs ArmyViewDesign (regex) — different logic, needs decision |

## done (this run)

| area | PR |
|------|-----|
| shared/resources/affordability.ts dead code | #93 — 4 functions + 3 types, 0 importers, deleted |

## rules

- max 20 rows here ; `fixed`/`rejected` → archive only, not this file
- pick 1 candidate/run ; ≤5 files ; no destructive prisma / balance change
