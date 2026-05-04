# Documentation — où ça vit

## Hiérarchie

```
docs/
├── migration/      # plan + CHANGELOG de la migration Next.js → Pixi
│   ├── README.md           # index des phases
│   ├── 00-overview.md → 07-doc-consolidation.md
│   ├── CHANGELOG.md        # journal phase par phase
│   ├── db-setup.md
│   └── AUTONOMOUS_RUN.md   # protocole run nocturne
└── meta/           # doc gameplay legacy (à fusionner Phase 8.x)
    └── gameplay/
```

## CLAUDE.md hiérarchique

- `/CLAUDE.md` — racine, court, pointe vers les rules + workspaces.
- `/battleforthecrown-pixi/CLAUDE.md` — briefing du nouveau frontend.
- `/battleforthecrown-backend/CLAUDE.md` — **à créer** par l'utilisateur (le run nocturne ne doit pas modifier le backend).
- `/battleforthecrown/CLAUDE.md` — n'existera plus après suppression du legacy.

## Rules path-scoped

- `.claude/rules/` racine : `conventions.md`, `git.md`, `docs.md` (transversales).
- `battleforthecrown-pixi/.claude/rules/` : `pixi-conventions.md`, `react-hud.md`.
- `battleforthecrown-backend/.claude/rules/` : à créer par l'utilisateur (Nest + Prisma + workers).

## Où écrire quoi

| Type d'info | Fichier |
|---|---|
| Décision d'architecture | `docs/migration/` (pendant la migration), puis `docs/architecture/` après. |
| Mécanique gameplay | `docs/gameplay/` (consolidation à finir Phase 8.x). |
| Convention projet | `.claude/rules/conventions.md`. |
| Convention workspace | `<workspace>/.claude/rules/<scope>.md`. |
| Briefing AI agent | `<workspace>/CLAUDE.md`. |
| Onboarding humain | `README.md` de chaque workspace. |
| Journal des changements | `docs/migration/CHANGELOG.md` (pendant la migration), puis convention à choisir post-migration. |

## Doc legacy à supprimer post-migration

- `WARP.md` (déjà dans le `.gitignore` racine).
- `.trae/` (déjà ignoré).
- Dans `battleforthecrown-backend/` : `docs-v2/index.md`, fichiers `*-technical.md` obsolètes, `IMPLEMENTATION_SUMMARY.md`, `PHASE2_*.md`, `schema.prsima.md` — **à nettoyer par l'utilisateur** (le run nocturne ne touche pas au backend).
- Dans `battleforthecrown/` : tout sera supprimé avec le dossier.
