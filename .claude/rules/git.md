# Git & commits

## Format

```
<type>(<scope>): <subject>
```

Exemples :

```
feat(pixi-frontend/auth): port lib/ + ui/ + auth + worlds screens
feat(pixi/world-map): WorldMapScene with viewport + entity reconciliation
chore(repo): initialize workspace git baseline before pixi migration
fix(pixi-frontend/ws): clear refresh token on auth failure
```

- **EN** pour le commit (échanges avec le user en FR).
- `type` : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `style`, `wip`.
- `scope` : workspace + sous-domaine (ex `pixi-frontend/village`, `backend/auth`).
- `subject` impératif court ; détails dans le body si nécessaire.

## Règles

- **Un seul commit propre par phase** quand on travaille en autonomie. Éviter les WIP traînants.
- **Pas de `git push --force`** sans demande explicite du user.
- **Pas de `--no-verify`** sauf cas exceptionnel discuté avec le user.
- **Jamais** de `git reset --hard`, `git checkout -- .`, `git rebase -i` interactif sans confirmation explicite.
- **Pas de modification de la config git** (user.email, signing, etc.) sans demande.
- Sub-repos : `battleforthecrown/.git` et `battleforthecrown-backend/.git` ont leur propre histoire — ne pas les inclure dans les commits du repo racine (déjà ignored dans `.gitignore`).
- Branches d'archive (ex `legacy/nextjs-frontend`) : créer dans le `.git` du workspace concerné, pas dans le racine.
