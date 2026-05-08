# 04 — Monorepo : structure git (parent vs sub-repos) ✅ RÉSOLU

**Sévérité** : 🟡 Majeure
**Workspace(s)** : tous
**Tags** : git, monorepo, dx, archi-projet
**Résolu le** : 2026-05-08 — commit `e941727` (option B.1 + B.2.a + nouveau remote racine)

## Résolution

- `battleforthecrown/` (legacy Next.js, 717 MB) supprimé. Historique préservé sur `github.com/kndpt/battleforthecrown` (branche d'archive `legacy/nextjs-frontend` poussée avant suppression).
- `battleforthecrown-backend/.git` supprimé, backend fusionné à plat dans le repo racine. Historique préservé sur `github.com/kndpt/battleforthecrown-backend` (12 commits ahead poussés avant fusion).
- Repo racine désormais sur `github.com/kndpt/battleforthecrown-repo` (privé).
- `battleforthecrown` retiré des yarn workspaces (résout aussi F031 de l'audit).
- `.gitignore`, `CLAUDE.md`, `README.md`, `.claude/rules/{git,docs}.md` nettoyés des références sub-repos.

Effort réel : ~25 min. Une seule commande `git push` suffit désormais pour tout pousser.

---

## Contexte

Le repo est un Yarn workspace avec 4 dossiers de premier niveau, mais la structure git est **asymétrique** :

- `battleforthecrown-pixi/` et `packages/shared/` → trackés par le `.git` racine.
- `battleforthecrown-backend/` → **a son propre `.git`**, ignoré par la racine (cf. `.gitignore`).
- `battleforthecrown/` (legacy Next.js) → **a son propre `.git`**, ignoré par la racine, à supprimer.

Conséquence concrète vécue pendant l'audit : une refacto cross-workspace (ex : ticket 18 `travelSpeed` qui touchait shared + backend + pixi) a nécessité **2 commits dans 2 repos différents** — racine pour shared+pixi, sub-repo pour backend. Le reviewer doit suivre 2 historiques distincts pour comprendre une seule modification cohérente.

## État actuel — factuel

```
battleforthecrown-repo/
├── .git/                          ← racine, track tout sauf les sub-repos
├── .gitignore                     ← ignore explicitement les 2 sub-repos
├── battleforthecrown/             ← legacy Next.js (717 MB, 8 branches)
│   └── .git/                      ← son propre repo
├── battleforthecrown-backend/
│   └── .git/                      ← son propre repo, ahead 11 commits
├── battleforthecrown-pixi/        ← suit le racine
└── packages/shared/               ← suit le racine
```

`.gitignore` racine (extrait) :

```
# Sub-repos with their own git history
battleforthecrown/
battleforthecrown-backend/
```

Le commentaire mentionne explicitement : *"jusqu'à Phase 7 (legacy archive) et Phase 8 (consolidation)"* — donc l'intention initiale était de **consolider** plus tard. C'est ce ticket.

## Conséquences concrètes

1. **Commits cross-workspace fragmentés** : ticket 18 résolu en 2 commits, ticket 19+20 idem, ticket 16 idem. Chaque résolution multi-workspace double le travail de commit + dilue la lisibilité de l'historique.
2. **Pas de PR unique** possible pour une feature transversale — il faudrait 2 PRs synchronisées sur 2 repos.
3. **CI compliquée** (cf. ticket 03) — un seul workflow ne peut pas voir les deux histoires en cohérence.
4. **Backups asymétriques** : si le user clone le repo racine, il rate le backend (sub-repo distant ?).
5. **`battleforthecrown/` (legacy)** : 717 MB de Next.js inutilisé qui traînent. Branche d'archive `legacy/nextjs-frontend` déjà créée dans son `.git`. Peut être supprimé.

## Question à trancher

Trois axes :

1. **Le legacy `battleforthecrown/`** : on supprime maintenant (l'archive existe dans son `.git`) ou on attend ?
2. **Le sub-repo `battleforthecrown-backend/`** : on fusionne dans le racine (consolidation Phase 8 prévue) ou on garde la séparation actuelle ?
3. Si fusion : on **préserve l'historique** du backend (effort) ou on l'**importe à plat** (simplicité) ?

## Pistes

### A. Statu quo (aucun changement)

- Garder les sub-repos séparés.
- Avantage : aucun effort.
- Risque : friction durable sur chaque change cross-workspace, CI bricolée, dette structurelle.
- Recommandé seulement si on prévoit de séparer les deux services (deploy indépendant, équipes différentes) — pas le cas ici.

### B. Consolidation complète (Phase 7 + 8 du plan original)

#### B.1 Suppression du legacy

- `rm -rf battleforthecrown/` au niveau du repo racine.
- Si on veut garder l'historique : **avant suppression**, push la branche `legacy/nextjs-frontend` vers un remote séparé (ex : `github.com/<user>/battleforthecrown-legacy`).
- Mettre à jour `.gitignore` racine + `CLAUDE.md` racine + `docs/`.
- Coût : ~15 min.

#### B.2 Fusion du backend dans le racine

Trois sous-options pour préserver (ou pas) l'historique :

##### B.2.a Import à plat (perte d'historique backend, simple)

- `cd battleforthecrown-backend && rm -rf .git`
- `cd .. && git add battleforthecrown-backend/ && git commit -m "chore(repo): merge backend sub-repo"`
- Avantage : 5 min, simple, lisible.
- Risque : on perd `git blame` / `git log` historique backend. **Si l'historique backend est consultable ailleurs** (ex : pushé sur un remote dédié avant fusion), l'impact est nul.

##### B.2.b `git subtree` avec préservation

- `git subtree add --prefix=battleforthecrown-backend ./backend-temp main`
- Plus complexe, nécessite un remote temporaire.
- Avantage : historique préservé dans le repo racine.
- Risque : `git log` du backend devient bruité dans le racine, peut être trompeur.

##### B.2.c `git filter-repo` pour réécrire l'historique

- Réécrit complètement l'historique des deux sub-repos pour les fusionner proprement avec préfixes.
- Le plus propre, le plus complexe. ~1-2 h, demande de comprendre `filter-repo`.
- Recommandé seulement si on a beaucoup de commits backend qu'on tient à garder navigables.

### C. Inverse : séparer aussi pixi en sub-repo

- Pour rester cohérent : 3 sub-repos (backend, pixi, shared) + un meta-repo qui les coordonne.
- Pattern "polyrepo" (ex : avec `git submodule` ou `npm workspace + multiple repos`).
- Désavantage : double-down sur la fragmentation. Sauf cas extrême (équipes séparées), c'est un anti-pattern.
- **Non recommandé** pour ce projet vu sa taille.

## Tradeoffs résumés

| Option | Effort | Préserve historique | Friction future | Recommandation |
|---|---|---|---|---|
| A — Statu quo | 0 | ✓ | Élevée | Non |
| B.1 + B.2.a | ~20 min | ✗ (sauf push remote séparé) | Nulle | **Probable winner** |
| B.1 + B.2.b | ~1 h | ✓ | Nulle | Si l'historique compte vraiment |
| B.1 + B.2.c | ~2 h | ✓ propre | Nulle | Si on est puriste git |
| C — Polyrepo | ~3 h | n/a | Très élevée | Non |

## Dimensions à valider en sortie

- Le legacy `battleforthecrown/` est supprimé ou explicitement archivé ailleurs.
- Le repo racine track **tout** le code actif (pixi + backend + shared + docs + tasks).
- Les `.gitignore` sont nettoyés (plus de mention "sub-repo" sauf pour le backup éventuel).
- `git log --all --oneline` racine reflète une histoire cohérente.
- `CLAUDE.md` racine, `git.md`, et tous les docs qui mentionnent "sub-repo" sont mis à jour.
- Une seule commande pour push tout : `git push` (vs aujourd'hui : push racine + push backend).

## Tickets liés

- [03 — CI strategy](../03-ci-strategy.md) — la structure git détermine si on a 1 ou 2 workflows CI.
- L'audit `docs/architecture/audit/16-magic-numbers-hardcoded.md` (résolu) a été commit en 2 endroits — exemple concret de la friction.
