# Local CI — hook pre-push + smokes via `/run`

Le projet est solo + agent IA, sans joueur ni collaborateur, sans CI cloud configurée. Le filet anti-régression est réparti en deux couches :

1. **Hook git `pre-push` (husky)** — léger, synchrone, bloque le push si du code qui ne compile pas ou casse les unit tests quitte la machine.
2. **Skill `/run`** — porte la responsabilité des smokes en fin de chaque run/ticket via la section `Acceptance & QA` obligatoire.

> Source unique de la stratégie tests : skill [`bftc-tests-policy`](../../.agents/skills/bftc-tests-policy/SKILL.md). Politique QA et obligation smokes : skill [`bftc-qa`](../../.agents/skills/bftc-qa/SKILL.md). Hard Gate `/run` : skill [`run`](../../.agents/skills/bftc-run/SKILL.md).

## TL;DR

À chaque `git push`, husky lance :

```
yarn static-check  → tsc --noEmit + eslint --quiet (backend + pixi)   (~5-10 s)
yarn test:backend  → Jest unit pure-logic                              (~1 s)
yarn test:pixi     → Vitest jsdom                                      (~3 s)
                                                                total ~10-15 s
```

Si une étape échoue, le push est bloqué. Les **smokes ne tournent pas** dans le hook — c'est `/run` qui les lance en fin de tâche dès qu'un diff touche `battleforthecrown-backend/src/`.

## Pourquoi sortir les smokes du hook

**Coût synchrone trop élevé** — la suite smoke pèse ~2 min (boot Nest × N fichiers + scénarios DB réels). À chaque push, c'est rédhibitoire quand on push souvent. Le hook reste donc minimaliste (~10-15 s).

Pas de CI cloud non plus (refus explicite : projet solo, on ne veut pas allonger la boucle ticket → push → résultat). On déporte la responsabilité smokes là où elle a le plus de sens : **l'agent qui vient de toucher le code backend**, dans le cadre formel du `/run`.

> Historique : un flake « ordering Jest » avait été cité comme 2e raison. Causé par le sequencer par défaut (`slowestFirst`) dont l'ordre dépend du cache `.jest-cache`. Résolu en figeant l'ordre des fichiers smoke via `test/jest-smoke-sequencer.js` (ordre alphabétique stable). Voir `tasks/archive/59-smokes-jest-ordering-flakies.md`.

> ⚠️ **Concurrence CPU pendant smokes** : les smokes utilisent des timers réels et du polling pg-boss à 1 s. Lancer autre chose de CPU-heavy en parallèle (`yarn static-check`, autres jest, builds) peut faire timeout les workers et générer des faux positifs de flake. Lancer les smokes seuls, sans autre charge.

## Câblage `/run` ↔ smokes

Voir le Hard Gate dans [`run/SKILL.md`](../../.agents/skills/bftc-run/SKILL.md) et la section dédiée dans [`bftc-qa/SKILL.md`](../../.agents/skills/bftc-qa/SKILL.md). En résumé : smokes obligatoires dès que le diff touche `battleforthecrown-backend/src/`, reportés dans `Acceptance & QA`, flaky non masqué.

## Pourquoi pre-push et pas pre-commit

L'agent commit en granularité fine (souvent 5-10 commits par phase). Payer 10-15 s à chaque commit ferait perdre plusieurs minutes par session. Le hook s'exécute donc **une seule fois** au moment du push.

Conséquence : on accepte des commits intermédiaires WIP cassés en local. Tout ce qui **arrive sur le remote** est typé, linté et passe les unit tests.

## Pré-requis

Aucun pour le hook (plus de Docker ni de DB smoke). Pour lancer les smokes à la main (en `/run` ou hors-run) :

| Pré-requis | Comment vérifier | Comment réparer |
|---|---|---|
| Container `battleforthecrown-postgres` healthy | `docker compose ps` (depuis `battleforthecrown-backend/`) | `cd battleforthecrown-backend && docker compose up -d` |
| Base `battleforthecrown_smoke` existe + migrations à jour | `yarn test:smoke:preflight` | Voir [`db-setup.md` § DB smoke](./db-setup.md) |

## Câblage technique

```
package.json (racine)
  └── "prepare": "husky"          ← s'exécute après yarn install
.husky/
  └── pre-push                    ← versionné, exécutable, appelé par git
```

`prepare` est invoqué automatiquement par yarn à chaque install. Cloner le repo + `yarn install` suffit pour avoir le hook armé.

## Modifier le hook

Le hook est un script shell standard dans `.husky/pre-push`. Modifier directement le fichier, commit. La modification est versionnée.

## Bypass exceptionnel

```bash
git push --no-verify
```

Réservé à :
- Push d'une branche d'archive (`legacy/*`).
- Hot-fix où `static-check` ou les unit ne sont pas pertinents (très rare).

À traiter comme l'exception. Pas la règle. Sans demande user explicite, l'agent ne bypass jamais.

## CI cloud — GitHub Actions

Workflow actif : `.github/workflows/ci.yml`. Deux jobs requis pour merger sur `main` (à configurer via branch protection rules dans les settings GitHub) :

| Job | Contenu | DB | Durée estimée |
|---|---|---|---|
| `unit` | `static-check` + `test:backend` + `test:pixi` | Aucune | ~3 min |
| `smokes` | `prisma migrate deploy` + preflight + smoke suite | Postgres 16 natif | ~5-8 min |

**Détails smokes CI :**
- `SMOKE_WORKERS=4` (vs 8 en local) pour rester sous les 100 connexions Postgres par défaut du runner 2 CPU.
- `smoke-preflight.sh` détecte automatiquement `PG_MODE=native` via `pg_isready` — pas de Docker.
- `--maxWorkers=4` passé à Jest au moment du run pour aligner avec les 4 clones DB créés.

**Branch protection à activer :**
Dans GitHub → Settings → Branches → protection rule pour `main` :
- [x] Require status checks to pass : `Static check & unit tests`, `Smoke tests`
- [x] Require branches to be up to date before merging
