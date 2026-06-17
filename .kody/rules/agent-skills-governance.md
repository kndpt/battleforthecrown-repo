---
title: "Agent skills and rules governance"
scope: "file"
path: [".agents/**"]
severity_min: "medium"
enabled: true
---

@kody-sync

Reference: @file:docs/architecture/decisions.md

## Instructions

Agent skills are project governance — review with extra care.

Flag:

- Hardcoded file paths that may have drifted.
- Rules contradicting `docs/architecture/decisions.md`.
- Skill `description` fields > 160 characters (they load on every agent context window — keep them tight).

## Examples

### Bad example

```yaml
description: >
  This skill audits every backend controller, service, worker, gateway, DTO, Prisma query,
  outbox emission, and test file for layering violations, god services, N+1 queries, and more.
```

### Good example

```yaml
description: Audit backend layering, Outbox usage, Prisma access patterns, and test coverage gaps.
```
