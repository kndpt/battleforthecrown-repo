# Codex Cloud environment

Codex Cloud doit préparer un checkout capable d'exécuter le workflow `bftc-run` :
édition de fichiers, `static-check`, smokes backend, démarrage backend et QA `curl`.

## Setup script UI

Dans l'écran Codex `Environments`, mettre seulement :

```bash
cd "$CODEX_WORKTREE_PATH"
. scripts/codex-cloud-setup.sh
```

Ne pas maintenir de logique longue dans `.codex/environments/environment.toml` : il est généré par l'UI Codex. Si ce fichier est versionné, il doit rester un simple appel sourcé à `scripts/codex-cloud-setup.sh`, sinon les variables exportées ne sont pas capturées pour la phase agent.

## Ce que le script prépare

[`scripts/codex-cloud-setup.sh`](../../scripts/codex-cloud-setup.sh) fait le bootstrap non destructif :

- variables dev (`DATABASE_URL`, JWT, `PORT`, `FRONTEND_URL`, URLs Vite/WS) exportées pour le setup et les shells agent via `~/.bftc-codex-env` ;
- `yarn install --frozen-lockfile` ;
- `prisma generate` ;
- rebuild propre de `@battleforthecrown/shared` ;
- `docker compose up -d` pour Postgres ;
- migrations Prisma sur `battleforthecrown` ;
- seed de la config monde par défaut ;
- création si besoin de la DB template `battleforthecrown_smoke` ;
- migrations Prisma sur `battleforthecrown_smoke` ;
- `yarn static-check`.

Le script ne reset pas la DB et ne supprime pas de données.

## DB attendues

| DB | Usage | Données |
|---|---|---|
| `battleforthecrown` | backend dev + QA `curl` | schéma migré + config monde par défaut |
| `battleforthecrown_smoke` | template smoke | schéma migré, pas de seed métier manuel |
| `battleforthecrown_smoke_w1`…`_w8` | clones Jest smoke | recréées par `yarn test:smoke:preflight` |

Les smokes créent leurs propres données dans les clones. La QA `curl` ne doit pas supposer des comptes existants : pour les endpoints protégés, l'agent crée d'abord un user via `/auth/register`, récupère le JWT, rejoint/crée l'état requis, puis appelle l'endpoint avec `Authorization: Bearer <token>`.

## Vérification rapide

Après sauvegarde de l'environnement, demander à Codex Cloud :

```text
Ne modifie rien. Lance :
yarn test:smoke:preflight
yarn test:smoke
PORT=15001 yarn workspace battleforthecrown-backend start:dev
curl -fsS http://localhost:15001/health
```

Pour le `start:dev`, l'agent doit démarrer le backend en session longue, lancer le `curl`, puis arrêter le serveur.

## Notes

- `battleforthecrown-backend/scripts/smoke-preflight.sh` appelle Prisma via le workspace backend, pas via un binaire implicite au root.
- `yarn test:smoke` peut émettre quelques erreurs pg-boss/Prisma pendant l'arrêt forcé des workers ; le verdict reste le code de sortie Jest.
