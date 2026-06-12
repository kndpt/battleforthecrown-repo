# Cursor Cloud environment

Cursor Cloud Agents doivent pouvoir exécuter le workflow `bftc-run` : édition, `static-check`, smokes backend, backend + DB, QA `curl`, puis PR GitHub.

La config est **versionnée** dans [`.cursor/environment.json`](../../.cursor/environment.json) et [`.cursor/Dockerfile`](../../.cursor/Dockerfile). Le bootstrap partagé vit dans [`scripts/lib/bftc-cloud-*.sh`](../../scripts/lib/).

## Activation dashboard

1. [Cloud Agents](https://cursor.com/agents) → connecter le repo GitHub.
2. Cursor détecte `.cursor/environment.json` ou proposer un setup agent-led.
3. Premier agent : `install` exécute [`scripts/cursor-cloud-setup.sh`](../../scripts/cursor-cloud-setup.sh) puis snapshot.
4. Agents suivants : snapshot + `start` ([`scripts/cursor-cloud-start.sh`](../../scripts/cursor-cloud-start.sh)) relance Postgres ; terminal `backend` garde Nest en fond.

Secrets prod : onglet **Secrets** du dashboard Cursor (pas dans le repo). Les valeurs `env` du JSON sont des defaults dev uniquement.

## Ce que le bootstrap prépare

[`scripts/cursor-cloud-setup.sh`](../../scripts/cursor-cloud-setup.sh) — idempotent, ne reset pas la DB :

- variables dev exportées + `~/.bftc-cloud-env` ;
- `yarn install --frozen-lockfile`, `prisma generate`, rebuild `@battleforthecrown/shared` ;
- Postgres **16 natif** (pas DinD — voir `.cursor/Dockerfile`) ;
- migrations sur `battleforthecrown` + seed config monde ;
- DB template `battleforthecrown_smoke` + migrations ;
- `yarn static-check`.

Postgres : **natif** (Cursor). Codex Cloud utilise Docker via le même lib — voir [`codex-cloud.md`](./codex-cloud.md).

## DB attendues

Identique à Codex — voir le tableau dans [`codex-cloud.md`](./codex-cloud.md#db-attendues).

## Harness agent (avant PR)

En session Cloud, l'agent **doit** prouver le backend quand le diff le touche (`bftc-qa` / `bftc-run`) :

```bash
yarn workspace battleforthecrown-backend test:smoke:preflight
yarn workspace battleforthecrown-backend test:smoke:run -- <pattern>   # ciblé
# ou test:smoke complet si changement transversal
curl -fsS http://localhost:15001/health   # backend terminal déjà up
```

QA protégée : créer un user via `/auth/register`, JWT, puis `curl` avec `Authorization: Bearer …`.

## Vérification rapide

Après premier setup Cloud :

```text
Ne modifie rien. Lance :
yarn workspace battleforthecrown-backend test:smoke:preflight
yarn workspace battleforthecrown-backend test:smoke
curl -fsS http://localhost:15001/health
```

## Forcer un rebuild d'environnement

Modifier `.cursor/environment.json`, `.cursor/Dockerfile` ou `scripts/cursor-cloud-setup.sh` invalide souvent le snapshot. Sinon recréer l'environnement dans le dashboard.

## Notes

- `install` est snapshotté : deps et données Postgres peuvent persister entre agents (comportement attendu).
- `start` relance Postgres à chaque agent ; le terminal `backend` démarre Nest.
- Pas de QA IG browser côté agent — smokes + curl uniquement.
