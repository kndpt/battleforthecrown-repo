# Local CI — pre-push hook

Le projet est solo + agent IA. On ne paie pas de minutes GitHub Actions et on n'a pas de bot reviewer. Le filet anti-régression vit donc **localement**, dans un hook git `pre-push` géré par husky.

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

À traiter comme l'exception et **pas** la règle. Si on bypass régulièrement, c'est qu'il y a un problème dans le hook — le réparer plutôt que le contourner.

## Quand passer à une CI cloud

Le pre-push local cesse d'être suffisant si :

- D'autres contributeurs rejoignent le projet (impossible de garantir leur env Postgres local).
- Les tests dépassent ~2 min — l'attente au push devient insupportable.
- On veut un signal partagé (badge, status checks GitHub).

Dans ce cas : ajouter un workflow GitHub Actions qui rejoue les mêmes commandes (`yarn test`) avec un service container Postgres. Le hook local reste un filet rapide, la CI cloud devient le filet partagé.
