---
name: bftc-qa
description: "Use when finishing a BFTC task to choose QA: playable checklist, curl/SQL/logs, smokes, static checks, and docs impact."
---

# BFTC QA

End every substantive task with one QA decision. Automated tests do not replace QA.

## Smokes — non-négociables si backend touché

Le hook `pre-push` ne lance plus les smokes (trop lents, flakies par ordering Jest). C'est désormais l'agent qui en porte la responsabilité.

- Si le diff touche `battleforthecrown-backend/src/` → lancer `yarn test:smoke:preflight && yarn test:smoke` en fin de tâche, tout vert.
- Reporter dans `Acceptance & QA` : commande exacte + résultat synthétique (suites passées / tests passés).
- Si un smoke fail de façon flaky (ordering, timing), ne pas masquer : investiguer ou escalader. Pas de `--no-verify`.
- Exception : diff strictement hors `src/` (docs, scripts hors boot, fixtures isolées) — écrire `Smokes : non applicables, raison : <…>`.

## Choose the mode

| Change | QA |
|---|---|
| Visible UI, HUD, Pixi, gameplay | User in-game checklist |
| Backend-only endpoint, worker, DB, WS payload, logs | Agent backend QA |
| Backend + visible UI impact | Both |
| Docs, rules, skills, static typing only | `QA : pas de test runtime nécessaire, raison : ...` |

If a user checklist requires terminal, SQL, logs, DevTools, env vars, or code edits, it is not user QA; the agent must do it.

## User QA format

```markdown
## QA

**Résultat attendu** : <observation visible en jeu>

- [ ] <clic/navigation 1>
- [ ] <clic/navigation 2>
- [ ] Vérifier que <résultat visible>
```

Keep it ≤ 5 checkboxes, chronological, French, no boot instructions.

## Agent backend QA

Use the agent's own backend instance on a free port, not the user's server.

```bash
cd battleforthecrown-backend
PORT=15002 yarn start:dev > /tmp/bftc-qa.log 2>&1 &
```

Verify with the cheapest real signal: `curl`, DB read through `bftc-db`, worker logs, or WS event observation. Check boxes only after execution.

## Gotchas

- DB locale is read-only except fixtures created by the agent, e.g. `qa-%` users. Never reseed to "restore".
- Auth endpoint is `POST /auth/register`; token field is `accessToken`.
- Backend boot failure often comes from stale callers in `scripts/`; inspect `/tmp/bftc-qa.log`.
- If no runtime QA is needed, say why in the final response.
