# 03 — CI : automatiser ou pas ✅ RÉSOLU

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : tous
**Tags** : ci, automation, qualité, dx
**Résolu le** : 2026-05-08 — option **D' (pre-push local seul)** retenue, pas d'Actions cloud.

## Résolution

Décision : **husky + hook `pre-push`** qui lance `yarn test` (unit backend + unit pixi + smokes orchestration) à chaque push. Pas de pre-commit (les commits granulaires de l'agent ne paient pas le coût des smokes 15× par session) — le filet s'arme une fois, au moment où le code quitte la machine.

- `husky@9.1.7` ajouté en `devDependency` racine ; script `prepare` câblé pour armer le hook après `yarn install`.
- `.husky/pre-push` versionné, exécutable. Pré-checks Docker + base `battleforthecrown_smoke` avec messages d'erreur ciblés (échec en < 1 s si pré-requis manquants, vs ~23 s si on laissait Jest crasher).
- Doc dédiée : [`docs/architecture/local-ci.md`](../../docs/architecture/local-ci.md). Référencée depuis le `CLAUDE.md` racine et `.claude/rules/git.md`.
- Bypass exceptionnel : `git push --no-verify` (branche d'archive, env DB cassé hot-fix).

**Pas de GitHub Actions.** Justification : projet solo + agent IA + zéro collaborateur ; le filet local est suffisant et instantané. La doc `local-ci.md` consigne les triggers qui justifieraient une migration vers une CI cloud (collaborateurs, tests > 2 min, signal partagé requis).

Effort réel : ~25 min. Filet vert au moment du merge (88 unit + 65 vitest + 10 smokes = 28 s total).

---

## Contexte

L'audit qu'on vient de finir a éliminé une grande partie de la dette technique : strict TS partout, helpers DRY, casts retirés, type-tests bidirectionnels. Sans filet automatique, cette dette **revient lentement** — un cast `as any` glissé un soir, un test ignoré "vite-fait", un `console.log` oublié.

Question : on automatise quoi, et où (local pre-commit vs CI cloud) ?

## État actuel

- Pas de `.github/workflows/`
- Pas de `.husky/`
- Pas de `lint-staged`
- Aucun bot, aucune protection de branche
- `yarn build`, `yarn lint`, `yarn test` (unit pure-logic) et `yarn workspace battleforthecrown-backend test:smoke` (smokes orchestration) existent et passent en local.

Conséquence concrète :
- Un commit qui ne build pas peut être push sur `main` sans aucun signal.
- Personne ne vérifie automatiquement le strict TS, le lint, ou les tests avant merge.
- Les seuls signaux qualité passent par le développeur qui pense à lancer les checks à la main.

## Question à trancher

Selon le contexte du projet (solo, collaboratif futur, deploy continu, etc.) :

1. **Le minimum vital** : pre-commit hook local (husky) qui run `lint + type-check + test` sur les fichiers staged ?
2. **CI complète** : GitHub Actions sur PR + push, build matrix, tests E2E inclus, blocage merge si rouge ?
3. **Hybride** : pre-commit léger (lint + type-check uniquement, rapide) + CI plus complète (build + tests + smokes) ?

## Pistes

### A. Pre-commit local seul (husky + lint-staged)

- `.husky/pre-commit` qui exécute `yarn lint` + `yarn type-check` sur les fichiers staged.
- Optionnel : `yarn test --changed` pour les tests touchés.
- Avantage : feedback **instantané** au commit, pas de dépendance externe (pas besoin de GitHub Actions, pas de minutes CI consommées).
- Risque : un dev peut bypass avec `--no-verify`. Pas de signal côté review.
- Coût : ~30 min setup.

### B. GitHub Actions full

- Workflow `ci.yml` qui lance sur push + PR :
  - `yarn install --frozen-lockfile`
  - `yarn build`
  - `yarn lint`
  - `yarn test` (unit pure-logic)
  - `yarn workspace battleforthecrown-backend test:smoke` (smokes orchestration backend, vraie DB — cf. [`docs/architecture/smoke-tests.md`](../../docs/architecture/smoke-tests.md))
- Protection de branche `main` : merge bloqué si rouge.
- Avantage : signal partagé, impossible à bypasser.
- Risque : minutes CI consommées (gratuit jusqu'à 2000 min/mois sur repo public/perso). Setup plus long si DB requis (Postgres en service container).
- Coût : ~1-2 h setup + tuning.

### C. Hybride (recommandé par défaut sur la plupart des projets)

- Pre-commit léger : `lint` + `type-check` (rapide, < 10 s).
- CI complète : `build` + `test` + `test:smoke`.
- Avantage : feedback rapide local, vrai filet en CI, charge CI optimisée (le pre-commit a déjà filtré le bruit).
- Coût : ~2 h setup.

### D. Rien (statu quo)

- Pour un projet purement perso, sans collaborateurs, où l'agent IA fait la majorité des commits sous supervision humaine.
- Avantage : zéro setup, zéro maintenance.
- Risque : la dette revient. La personne (ou l'IA) doit penser à lancer `yarn build && yarn test` avant chaque commit. Inégal.

### D' (option retenue) — Pre-push local seul

Variante non listée à l'origine, dérivée de A en déplaçant le hook de `pre-commit` à `pre-push`.

- `.husky/pre-push` qui exécute `yarn test` complet (unit + smokes).
- Avantage : on paie le coût (~30-45 s) une seule fois au push, pas à chaque commit. Permet à l'agent de commit en granularité fine sans pénalité. Tout ce qui arrive sur le remote est testé. Pas de minutes cloud, pas de bot, setup minimal.
- Risque : bypassable avec `--no-verify` (acceptable, projet solo). Dépend de Docker + base smoke local — mitigé par des pré-checks dans le hook.
- Coût : ~25 min setup.
- Quand basculer vers C : autres contributeurs, tests > 2 min, ou besoin de signal partagé.

## Question annexe : Postgres en CI

Les smokes backend (cf. [`docs/architecture/smoke-tests.md`](../../docs/architecture/smoke-tests.md)) ont besoin d'une vraie DB Postgres (`battleforthecrown_smoke`, isolée de la dev). Options en CI :

- **Service container GitHub Actions** : `services: postgres:16-alpine` dans le job, `prisma migrate deploy` au boot sur `battleforthecrown_smoke`.
- **Mock DB** (jamais conseillé pour ce projet — toute la philosophie est server-authoritative ; un smoke qui mocke Prisma est interdit cf. `tests.md`).
- **DB éphémère par test** via Testcontainers (lourd, mais isolation parfaite).

→ Question rendue caduque par D' : on utilise le Postgres local du dev (pas de séparation CI / dev nécessaire tant que le filet est local).

## Dimensions à valider en sortie

- Décision tranchée : A, B, C, D.
- Si CI : nom du workflow, triggers, jobs définis, badge dans le README racine.
- Si pre-commit : `.husky/pre-commit` versionné, `prepare` script dans `package.json`.
- Documentation courte dans `docs/architecture/` ou `.claude/rules/ci.md` qui explique le filet.
- Le filet **passe vert** sur `main` au moment du merge du ticket.

## Tickets liés

- [01 — Tests unitaires](./01-unit-tests-audit.md) ✅ — politique pure-logic-only formalisée, fixtures réparées.
- [02 — Smoke tests](./02-smoke-tests-strategy.md) ✅ — 10 flows backend couverts ; doc d'implémentation : [`docs/architecture/smoke-tests.md`](../../docs/architecture/smoke-tests.md).
- [04 — Monorepo git](./04-monorepo-git-strategy.md) ✅ — désormais 1 repo unifié, donc 1 seul workflow CI à concevoir (pas de synchronisation cross-repos).
