# Local CI — pre-push hook

Le projet est solo + agent IA, sans joueur ni collaborateur. On ne paie pas de minutes GitHub Actions et on n'a pas de bot reviewer. Le filet anti-régression vit donc **localement**, dans un hook git `pre-push` géré par husky.

> Décision et alternatives discutées dans [`tasks/archive/03-ci-strategy.md`](../../tasks/archive/03-ci-strategy.md). Source unique de la stratégie tests : [`.claude/rules/tests.md`](../../.claude/rules/tests.md).

## TL;DR

À chaque `git push`, husky lance `yarn test` :

```
yarn test:backend  → Jest unit pure-logic     (~5 s)
yarn test:pixi     → Vitest jsdom              (~5 s)
yarn test:smoke    → 10 flows orchestration    (~23 s, vraie DB)
                                          total ~30-45 s
```

Si une étape échoue, le push est bloqué.

## Pourquoi pre-push et pas pre-commit

L'agent commit en granularité fine (souvent 5-10 commits par phase). Payer ~30 s à chaque commit ferait perdre plusieurs minutes par session. Le hook s'exécute donc **une seule fois** au moment du push — c'est le moment où le code quitte la machine, c'est là que le filet a le plus de valeur.

Conséquence : on accepte des commits intermédiaires WIP cassés en local. Tout ce qui **arrive sur le remote** est testé.

## Pré-requis

Le smoke a besoin d'une vraie Postgres :

| Pré-requis | Comment vérifier | Comment réparer |
|---|---|---|
| Container `battleforthecrown-postgres` healthy | `docker compose ps` (depuis `battleforthecrown-backend/`) | `cd battleforthecrown-backend && docker compose up -d` |
| Base `battleforthecrown_smoke` existe + migrations à jour | `docker exec battleforthecrown-postgres psql -U postgres -lqt \| grep smoke` | Voir [`db-setup.md` § DB smoke](./db-setup.md) |

Le hook fait ces deux checks **avant** de lancer les tests et échoue avec un message ciblé si un pré-requis manque (gain de temps : pas d'attente de 23 s pour s'apercevoir que la DB n'est pas là).

## Câblage technique

```
package.json (racine)
  └── "prepare": "husky"          ← s'exécute après yarn install
.husky/
  └── pre-push                    ← versionné, exécutable, appelé par git
```

`prepare` est invoqué automatiquement par yarn à chaque install. Cloner le repo + `yarn install` suffit pour avoir le hook armé. Aucune config locale supplémentaire.

## Modifier le hook

Le hook est un script shell standard dans `.husky/pre-push`. Modifier directement le fichier, commit. La modification est versionnée et s'applique immédiatement à tous les contributeurs après leur prochain `yarn install`.

## Bypass exceptionnel

```bash
git push --no-verify
```

Cas d'usage légitimes :
- Push d'une branche d'archive (`legacy/*`) où les tests ne s'appliquent plus.
- Hot-fix où l'environnement Postgres local est cassé et on n'a pas le temps de le réparer (rare).
- Client git GUI (Zed, SourceTree…) qui timeout sur un hook long parce que son shell n'a pas le bon PATH. Préférer le terminal pour les push qui doivent passer par les smokes.

À traiter comme l'exception et **pas** la règle. Si on bypass régulièrement, c'est qu'il y a un problème dans le hook — le réparer plutôt que le contourner.

---

## Note honnête : ce setup est un compromis, pas la pratique standard

**Mettre des smokes dans un hook `pre-push` est généralement un anti-pattern.** La hiérarchie industrielle reconnue est :

| Étage | Tests acceptables | Durée cible |
|---|---|---|
| `pre-commit` | lint, format, typecheck | < 5 s |
| `pre-push` | unit tests rapides | < 10 s |
| **CI cloud** | **smokes, intégration, E2E, build** | **sans contrainte de temps locale** |

Faire tourner les smokes en pre-push, c'est faire le travail du CI sur le poste du dev. Les conséquences théoriques :

1. **Couplage à l'environnement local** — le hook dépend de Docker + DB smoke à jour. Faux pour un nouvel arrivant qui n'a pas encore fait le bootstrap.
2. **Faux filet** — `--no-verify` reste possible à tout moment. Aucun signal partagé.
3. **Pas de reproductibilité** — la DB locale accumule de l'état (jobs pg-boss, données stale) ; un smoke peut passer ici et casser sur une base fraîche en CI.
4. **Dégradation prévisible** — à 30 smokes au lieu de 10, le hook approche 1 min et devient insupportable.

**Pourquoi on garde quand même ce setup aujourd'hui** :

- **Solo**. Personne d'autre ne push, donc l'argument "couplage env local" est vide.
- **Pas de joueur**. Pas de pression production, pas de coût d'incident à arbitrer.
- **Pas de CI configurée**. Mieux vaut un filet imparfait qu'aucun.
- **Volumétrie smokes maîtrisée**. 10 flows, ~23 s. Politique [`tests.md`](../../.claude/rules/tests.md) = "smoke seulement pour orchestration nouvelle" — pas d'explosion attendue.
- **Setup CI cloud = ~1 h de travail** sans bénéfice immédiat tant que ces conditions tiennent.

C'est un **compromis pragmatique pour un projet solo en phase de développement**. Pas une recommandation générale.

---

## Cible long terme : vraie CI cloud + hook léger

À implémenter dès qu'au moins un des triggers ci-dessous saute. Notes pour le futur agent ou le futur dev qui prendra le ticket.

### Triggers de migration

- Un autre contributeur rejoint le projet → on ne peut plus garantir son env Postgres local.
- Le jeu sort de phase dev (joueurs réels, signal d'incident) → on veut un filet partagé visible.
- Les smokes dépassent ~30 flows ou ~45 s → le hook devient un blocage chronique.
- Tu te surprends à `--no-verify` plus d'une fois par mois → le filet local n'est plus tenable.

### Architecture cible

```
.husky/pre-push
  └── yarn lint && yarn test:backend && yarn test:pixi   (~10 s, no Docker)

.github/workflows/ci.yml      (push + pull_request)
  ├── job: lint-and-build
  │     ├── yarn install --frozen-lockfile
  │     ├── yarn lint
  │     └── yarn build
  └── job: test
        ├── services: postgres:16-alpine  (port 5432, db: battleforthecrown_smoke)
        ├── yarn install --frozen-lockfile
        ├── yarn workspace battleforthecrown-backend prisma migrate deploy
        │   (DATABASE_URL pointing at the service container)
        ├── yarn test:backend
        ├── yarn test:pixi
        └── yarn test:smoke
```

Protection de branche `main` : merge bloqué si `ci.yml` rouge.

### Étapes d'implémentation (~1 h)

1. **Alléger le hook** (`.husky/pre-push`) : retirer le bloc smoke, garder lint + unit. Supprimer les pré-checks Docker/DB devenus inutiles.
2. **Créer `.github/workflows/ci.yml`** :
   - Trigger `push` + `pull_request` sur `main`.
   - Job lint+build sur `ubuntu-latest` + `actions/setup-node@v4` (node 22) + `yarn install --frozen-lockfile` cache yarn.
   - Job test avec service container `postgres:16-alpine` :
     ```yaml
     services:
       postgres:
         image: postgres:16-alpine
         env:
           POSTGRES_USER: postgres
           POSTGRES_PASSWORD: postgres
           POSTGRES_DB: battleforthecrown_smoke
         ports: ['5432:5432']
         options: >-
           --health-cmd pg_isready
           --health-interval 5s
           --health-timeout 5s
           --health-retries 10
     ```
   - `prisma migrate deploy` avec `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/battleforthecrown_smoke`.
   - Lancer `yarn test:backend && yarn test:pixi && yarn test:smoke`.
3. **Activer la protection de branche** sur `main` (Settings → Branches → Require status checks → cocher `ci.yml`).
4. **Mettre à jour cette doc** : retirer la section "Note honnête" et "Cible long terme", remplacer par la description du nouveau setup. Mettre à jour `CLAUDE.md` racine et `.claude/rules/git.md` pour pointer vers le bon comportement de hook.
5. **Vérifier le coût** : le tier gratuit GitHub Actions = 2000 min/mois sur repo privé. Un run ~3-5 min, donc ~400 runs/mois. Largement assez.

### Pièges anticipés

- **Cache yarn** : utiliser `actions/setup-node@v4` avec `cache: 'yarn'` pour éviter de réinstaller à chaque run.
- **Build du package shared** : `postinstall` racine fait déjà `yarn workspace @battleforthecrown/shared build`, donc `yarn install` suffit. Vérifier que le `tsconfig.tsbuildinfo` n'est pas pris en compte par le cache (il vient avec sa propre date).
- **Prisma generate** : `prisma generate` doit tourner avant le build. Le `postinstall` Prisma le fait automatiquement, mais en cas de cache yarn agressif il peut être skippé — ajouter explicitement `yarn workspace battleforthecrown-backend prisma generate` au début du job test si on observe le bug.
- **Smokes qui s'attendent à `MULTIPLIER_TICK_INTERVAL_MS` ou autres env vars** : recopier le `jest-smoke-setup.ts` pour la CI, ou exporter les mêmes vars dans le workflow YAML.
