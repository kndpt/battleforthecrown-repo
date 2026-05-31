---
name: bftc-qa
description: "Use when finishing a BFTC task to choose QA: playable checklist, curl/SQL/logs, smokes, static checks, and docs impact."
---

# BFTC QA

End every substantive task with one QA decision. Automated tests do not replace QA.

## Non-negotiable IG boundary

The agent must not perform in-game QA with the browser. It may run automated tests, smokes, curls, logs, DB reads, healthchecks, or frontend/server boot checks. If in-game validation is needed, give Kelvin only a concise French checklist and stop there.

## Smokes — ciblés localement, exhaustifs en CI

Le hook `pre-push` ne lance pas les smokes. La CI GitHub lance la suite smoke complète sur PR. En local, l'agent doit lancer le plus petit périmètre smoke qui prouve le risque du diff.

- Si le diff touche `battleforthecrown-backend/src/`, décider :
  - **smoke ciblé** si un ou plusieurs flows existants couvrent directement l'endpoint, worker, event, contrat DB ou payload modifié ;
  - **full smoke local** seulement pour les changements transversaux : Prisma schema/migration, AppModule/boot/config, auth/JWT global, EventOutbox/gateway global, shared contract multi-domaines, scheduler/workers communs, ou mapping incertain ;
  - **pas de smoke local** si le diff backend est pure logic/unit-testé, type-only/DTO non runtime, script hors boot, ou refacto interne sans effet endpoint/worker/event. Justifier explicitement.
- Toujours lancer le preflight avant un smoke local :

```bash
yarn workspace battleforthecrown-backend test:smoke:preflight
```

- Commande smoke ciblée :

```bash
yarn workspace battleforthecrown-backend test:smoke:run -- <file-or-pattern...>
```

- Commande smoke complète locale si nécessaire :

```bash
yarn workspace battleforthecrown-backend test:smoke
```

- Reporter dans `Acceptance & QA` : commandes exactes + résultat synthétique (suites passées / tests passés) + raison du périmètre choisi.
- Si un smoke fail de façon flaky (ordering, timing), ne pas masquer : investiguer ou escalader. Pas de `--no-verify`.
- Le full smoke CI ne dispense pas de smoke ciblé quand le diff backend modifie un comportement orchestration/I/O, mais il évite de relancer systématiquement toute la suite localement.

## Choose the mode

| Change | QA |
|---|---|
| Visible UI, HUD, Pixi, gameplay | Kelvin in-game checklist only |
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

Keep it ≤ 5 checkboxes, chronological, French, no boot instructions, no browser automation.

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
