# Documentation — où ça vit

## Hiérarchie

```
docs/
├── architecture/   # doc humain de référence (cross-workspace) — backend modules, data model, realtime
├── gameplay/       # mécaniques de jeu (vision, économie, bâtiments, combat, événements)
└── migration/      # plan + CHANGELOG de la migration Next.js → Pixi
    ├── README.md           # index des phases
    ├── 00-overview.md → 07-doc-consolidation.md
    ├── CHANGELOG.md        # journal phase par phase
    ├── db-setup.md
    └── AUTONOMOUS_RUN.md   # protocole run nocturne
```

## CLAUDE.md hiérarchique

- `/CLAUDE.md` — racine, court, pointe vers les rules + workspaces.
- `/battleforthecrown-pixi/CLAUDE.md` — briefing du frontend Pixi.
- `/battleforthecrown-backend/CLAUDE.md` — briefing du backend NestJS (sous-repo avec son propre `.git`).
- `/battleforthecrown/CLAUDE.md` — n'existera plus après suppression du legacy.

## Rules path-scoped

- `.claude/rules/` racine : `conventions.md`, `git.md`, `docs.md` (transversales).
- `battleforthecrown-pixi/.claude/rules/` : `pixi-conventions.md`, `react-hud.md`.
- `battleforthecrown-backend/.claude/rules/` : `nest-conventions.md`, `prisma.md`, `workers.md`.

## Où écrire quoi

| Type d'info | Fichier |
|---|---|
| Décision d'architecture (humain) | `docs/architecture/`. Pendant la migration, les choix de stack sont aussi documentés dans `docs/migration/`. |
| Mécanique gameplay | `docs/gameplay/`. |
| Convention projet | `.claude/rules/conventions.md`. |
| Convention workspace | `<workspace>/.claude/rules/<scope>.md`. |
| Briefing AI agent | `<workspace>/CLAUDE.md`. |
| Onboarding humain | `README.md` de chaque workspace. |
| Journal des changements | `docs/migration/CHANGELOG.md` (pendant la migration), puis convention à choisir post-migration. |

## Doc legacy à supprimer post-migration

- `WARP.md` (déjà dans le `.gitignore` racine).
- `.trae/` racine (déjà ignoré).
- Dans `battleforthecrown-backend/` : `.trae/rules/project_rules.md` (Trae IDE, on est sur Claude Code) — à supprimer par l'utilisateur dans le sous-repo.
- Dans `battleforthecrown/` : tout sera supprimé avec le dossier.
