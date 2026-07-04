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

### Approbation (une des deux conditions suffit)
- **Greptile a reviewé** (check `Greptile Review: success`) **ET** n'a commenté aucun P0, P1 ou P2 ouvert
- **OU CodeRabbit a approuvé** : `reviewDecision === "APPROVED"`, aucun `CHANGES_REQUESTED` actif

### CI
- Tous les checks du HEAD commit à `conclusion === "SUCCESS"`
- Aucun check `IN_PROGRESS` / `QUEUED` / `PENDING`

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
Si une PR est en draft, tu peux la mettre en mode ready for review automatiquement et la traiter comme une PR ordinaire.
Si conflits, les résoudre intelligement puis merger.
