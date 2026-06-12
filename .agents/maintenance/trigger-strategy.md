# BFTC Maintenance Skills — Trigger Strategy

This document defines when each maintenance skill runs, how to configure the Routines, and the
escalation logic for overlapping work.

---

## Overview

| Skill | Type | Frequency | Output |
|---|---|---|---|
| `bftc-maint-new-commits` | Reactive (tracks main cursor) | Each session start + Routine | Ready PR |
| `bftc-maint-debt` | Proactive (sweeps existing debt) | Twice nightly: 00h + 04h | Ready PR |
| `bftc-refactor-backend` | Deep structural | Weekly, Saturday night 01:00 | Ready PR |
| `bftc-refactor-pixi` | Deep structural | Weekly, Saturday night 02:00 | Ready PR |
| `bftc-refactor-shared` | Deep structural | Weekly, Saturday night 03:00 | Ready PR |
| `bftc-routine-gameplay-plan` | Proactive (gameplay backlog) | Daily (prompt Routine) | Ticket + JSON ledger + PR |

---

## PR Naming Policy

Maintenance PRs are neither `$bftc-run` runs nor task tickets. They use their own
`maint/...` branch family so they are visible as autonomous maintenance work.

| Skill | Branch | PR title |
|---|---|---|
| `bftc-maint-debt` | `maint/debt/<short-topic>` | `maint(debt): <subject>` |
| `bftc-maint-new-commits` | `maint/new-commits/<short-sha>` | `maint(new-commits): review new main commits` |
| `bftc-refactor-backend` | `maint/refactor-backend/<short-topic>` | `maint(refactor-backend): <subject>` |
| `bftc-refactor-pixi` | `maint/refactor-pixi/<short-topic>` | `maint(refactor-pixi): <subject>` |
| `bftc-refactor-shared` | `maint/refactor-shared/<short-topic>` | `maint(refactor-shared): <subject>` |

Historical ledger/report entries may mention legacy `claude/*` branch names; new
entries must use the conventions above.

---

## Routines — Setup

Routines run on Anthropic infrastructure even when your machine is off.
Configure at: **https://claude.ai/code/routines**

Documentation: https://code.claude.com/docs/en/routines.md

### bftc-maint-new-commits

**Purpose**: Check if new commits on main haven't been reviewed yet.

**Prompt for the Routine**:
```
/bftc-maint-new-commits
```

**Trigger**: Schedule — daily, every 4 hours (or at minimum 06:00 UTC + 14:00 UTC).
The skill self-stops if no new commits exist; low cost if nothing to do.

**Note**: Also auto-triggers at session start via `invoke: auto` in the skill frontmatter,
so manual sessions already cover this without a Routine.

### bftc-maint-debt

**Purpose**: Pick one bounded existing debt item and fix it. Runs twice per night.

**Prompt for the Routine**:
```
/bftc-maint-debt
```

**Trigger**: Schedule — daily at 22:00 UTC and 02:00 UTC (= 00:00 and 04:00 Paris CEST).
*Adjust UTC offset for CET (winter): 23:00 UTC and 03:00 UTC.*

**Behavior with open PRs**: The skill reads existing open PRs to avoid duplicate work,
then picks a different candidate. Two runs per night can produce two separate PRs on
different candidates — this is intentional.

### bftc-refactor-backend

**Purpose**: Full NestJS audit + one structural refactor PR.

**Prompt for the Routine**:
```
/bftc-refactor-backend
```

**Trigger**: Schedule — weekly on Saturday at 23:00 UTC (= Sunday 01:00 CEST).

### bftc-refactor-pixi

**Purpose**: Full frontend audit + one structural refactor PR.

**Prompt for the Routine**:
```
/bftc-refactor-pixi
```

**Trigger**: Schedule — weekly on Sunday at 00:00 UTC (= Sunday 02:00 CEST).
Offset from backend to avoid two heavy sessions competing for the same repo state.

### bftc-refactor-shared

**Purpose**: Full shared package audit + one structural refactor PR.

**Prompt for the Routine**:
```
/bftc-refactor-shared
```

**Trigger**: Schedule — weekly on Sunday at 01:00 UTC (= Sunday 03:00 CEST).

### bftc-routine-gameplay-plan

**Purpose**: Find one unimplemented gameplay spec in `docs/gameplay/`, create a ticket/run via
`$bftc-plan`, append the subject to `.agents/maintenance/gameplay-plan-subjects.json`, open a PR.

**Ledger**: `.agents/maintenance/gameplay-plan-subjects.json` — source of truth for subjects
already picked (merged on `main` + entries from open routine PRs read at preflight).

**Prompt**: see full Routine prompt in repo discussions / paste from maint docs. Token PR body :
`bftc-routine-gameplay-plan`. Branch : `plan/gameplay/<slug>`.

**Trigger**: Schedule — daily (e.g. 04:00 UTC = 06:00 Paris CEST).

**Behavior with open PRs**: do **not** hard stop. Read open PRs + JSON, exclude subjects already
listed, pick a different gameplay gap.

---

## Manual escalation rules

- A `bftc-maint-debt` or `bftc-maint-new-commits` run that identifies a **structural** issue
  (god service, server-authoritative violation, store coupling) should add it to the relevant
  refactor report (`refactor-{backend,pixi,shared}-report.md`) as a candidate, NOT try to fix it
  inline. Leave it for the weekly `bftc-refactor-*` run.

- After a large feature merges, manually trigger `bftc-maint-new-commits` immediately rather
  than waiting for the Routine.

- If a `bftc-refactor-*` run surfaces a Critical finding, do not wait for the next weekly cycle —
  trigger the relevant skill manually or open a hotfix PR.

---

## Open PR coexistence

| Situation | Action |
|---|---|
| `bftc-maint-new-commits` open PR + new run | Hard stop. Wait for merge. |
| `bftc-maint-debt` open PR(s) + new run | Read existing PRs, pick a different candidate. |
| `bftc-refactor-*` open PR + new run | Hard stop. Wait for merge or close. |
| `bftc-maint-*` open + `bftc-refactor-*` run | Fine. Different scopes, no conflict. |
| `bftc-routine-gameplay-plan` open PR(s) + new run | Read JSON from `main` + open PR branches, exclude listed subjects, continue on a different spec. |

---

## Escalation: when skills conflict

If two skills would touch the same file in the same week:
1. The `bftc-refactor-*` skill has priority (deeper, ready-for-review).
2. The `bftc-maint-*` skill should skip that file and pick a different candidate.
3. If there is no other candidate, the `bftc-maint-*` run produces a ledger/backlog-only PR.
