---
name: bftc-auto-merge
description: Scanne les PRs ouvertes et merge celles qui sont APPROVED + tous les checks CI verts. Ignore le reste sans intervention.
invoke: /bftc-auto-merge
---

# Auto-Merge

Routine horaire. Merge silencieux. Aucune action humaine requise pour les PRs éligibles.

## Setup Routine

URL : **https://claude.ai/code/routines**

```
Prompt  : /bftc-auto-merge
Schedule: 0 * * * *   (toutes les heures)
Repo    : kndpt/battleforthecrown-repo
```

## Critères merge (tous requis)

- `reviewDecision === "APPROVED"` — approuvé, aucun `CHANGES_REQUESTED` actif
- Tous les `statusCheckRollup` à `conclusion/state === "SUCCESS"`
- Aucun check `IN_PROGRESS` / `QUEUED` / `PENDING`
- Non-draft

**Sinon → skip. Passage humain requis.**

## Procédure

```bash
# Fetch all open PRs with review + CI state
gh pr list --state open --json number,title,headRefName,reviewDecision,isDraft,statusCheckRollup

# Pour chaque PR éligible
gh pr merge <number> --squash --delete-branch
```

Afficher un résumé : PRs mergées / ignorées (raison courte par PR ignorée).
Ne jamais commenter une PR, ne jamais modifier de fichier state.
