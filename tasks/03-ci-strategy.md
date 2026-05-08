# 03 — CI : automatiser ou pas

**Sévérité** : 🟠 Moyenne
**Workspace(s)** : tous
**Tags** : ci, automation, qualité, dx

## Contexte

L'audit qu'on vient de finir a éliminé une grande partie de la dette technique : strict TS partout, helpers DRY, casts retirés, type-tests bidirectionnels. Sans filet automatique, cette dette **revient lentement** — un cast `as any` glissé un soir, un test ignoré "vite-fait", un `console.log` oublié.

Question : on automatise quoi, et où (local pre-commit vs CI cloud) ?

## État actuel

- Pas de `.github/workflows/`
- Pas de `.husky/`
- Pas de `lint-staged`
- Aucun bot, aucune protection de branche
- `yarn build`, `yarn lint`, `yarn test` existent et fonctionnent au niveau racine (sauf 7 tests cassés cf. ticket 01 et tous les E2E cf. ticket 02).

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
  - `yarn test` (unit)
  - `yarn test:e2e` (intégration backend, après ticket 02)
- Protection de branche `main` : merge bloqué si rouge.
- Avantage : signal partagé, impossible à bypasser.
- Risque : minutes CI consommées (gratuit jusqu'à 2000 min/mois sur repo public/perso). Setup plus long si DB requis (Postgres en service container).
- Coût : ~1-2 h setup + tuning.

### C. Hybride (recommandé par défaut sur la plupart des projets)

- Pre-commit léger : `lint` + `type-check` (rapide, < 10 s).
- CI complète : `build` + `test` + `test:e2e`.
- Avantage : feedback rapide local, vrai filet en CI, charge CI optimisée (le pre-commit a déjà filtré le bruit).
- Coût : ~2 h setup.

### D. Rien (statu quo)

- Pour un projet purement perso, sans collaborateurs, où l'agent IA fait la majorité des commits sous supervision humaine.
- Avantage : zéro setup, zéro maintenance.
- Risque : la dette revient. La personne (ou l'IA) doit penser à lancer `yarn build && yarn test` avant chaque commit. Inégal.

## Question annexe : Postgres en CI

Les tests d'intégration backend (ticket 02) ont besoin d'une DB Postgres. Options en CI :

- **Service container GitHub Actions** : `services: postgres:16-alpine` dans le job, `prisma migrate deploy` au boot.
- **Mock DB** (jamais conseillé pour ce projet — toute la philosophie est server-authoritative).
- **DB éphémère par test** via Testcontainers (lourd, mais isolation parfaite).

## Dimensions à valider en sortie

- Décision tranchée : A, B, C, D.
- Si CI : nom du workflow, triggers, jobs définis, badge dans le README racine.
- Si pre-commit : `.husky/pre-commit` versionné, `prepare` script dans `package.json`.
- Documentation courte dans `docs/architecture/` ou `.claude/rules/ci.md` qui explique le filet.
- Le filet **passe vert** sur `main` au moment du merge du ticket.

## Tickets liés

- [01 — Tests unitaires](./archive/01-unit-tests-audit.md) — un test cassé bloque la CI.
- [02 — Smoke tests](./02-smoke-tests-strategy.md) — la CI a besoin que les smokes existent et passent pour les inclure.
- [04 — Monorepo git](./04-monorepo-git-strategy.md) ✅ — désormais 1 repo unifié, donc 1 seul workflow CI à concevoir (pas de synchronisation cross-repos).
