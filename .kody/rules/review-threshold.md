---
title: "Review threshold — actionable findings only"
scope: "file"
path: ["**/*"]
severity_min: "medium"
enabled: true
---

@kody-sync

## Instructions

Only leave a comment when it is materially actionable and could affect correctness,
security, data integrity, runtime behavior, architecture, or meaningful test coverage.

Do NOT comment on spelling, accents, grammar, terminology preference, punctuation,
formatting, line wrapping, minor naming/style consistency, or wording tone unless it
creates a real user-facing ambiguity or contradicts an executable process.

If the finding would be labeled Nitpick, Trivial, Low value, or cosmetic, do not post it.

Only actionable findings with real impact: bugs, security, data loss, regressions,
architecture, missing tests. No wording/style/naming/formatting nitpicks or low-value comments.

## Examples

### Bad example

```text
Consider renaming this variable from `userData` to `userInfo` for consistency.
```

### Good example

```text
This transaction writes domain data but omits the required EventOutbox record — domain events will not propagate to clients.
```
