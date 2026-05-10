# Documentation — où ça vit et quand la mettre à jour

## Vérification obligatoire en fin de tâche

À la fin de **toute tâche** qui modifie du code, du gameplay, une API, un modèle de données, une convention, un workflow dev, ou une décision d'architecture, l'agent doit vérifier l'impact documentation.

La vérification couvre :
- **Créer** une doc si une nouvelle mécanique, API, convention ou décision n'a pas de référence durable.
- **Mettre à jour** la doc existante si elle devient inexacte, incomplète ou ambiguë.
- **Supprimer ou déplacer** une doc devenue obsolète.
- **Ne rien modifier** uniquement si la tâche n'a pas d'impact documentaire réel.

Dans le compte-rendu final, l'agent doit mentionner :
- `Docs : mises à jour ...`
- ou `Docs : aucun changement nécessaire, raison : ...`

## Hiérarchie

```
docs/
├── architecture/   # doc humain de référence (cross-workspace)
│   ├── README.md
│   ├── decisions.md          # ADR consolidé (pourquoi des choix structurants)
│   ├── backend-modules.md    # arborescence NestJS, modules, services
│   ├── data-model.md         # entités Prisma, relations
│   ├── realtime.md           # pattern Outbox, gateway WS, événements
│   └── db-setup.md           # bootstrap Postgres + Prisma, snippets SQL
└── gameplay/       # mécaniques de jeu (économie, bâtiments, combat, événements)
```

## CLAUDE.md hiérarchique

- `/CLAUDE.md` — racine, court, pointe vers les rules + workspaces.
- `/battleforthecrown-pixi/CLAUDE.md` — briefing du frontend Pixi.
- `/battleforthecrown-backend/CLAUDE.md` — briefing du backend NestJS.

## Rules path-scoped

- `.claude/rules/` racine : `conventions.md`, `git.md`, `docs.md`, `qa.md`, `tests.md` (transversales).
- `battleforthecrown-pixi/.claude/rules/` : `pixi-conventions.md`, `react-hud.md`.
- `battleforthecrown-backend/.claude/rules/` : `nest-conventions.md`, `prisma.md`, `workers.md`.

## Où écrire quoi

| Type d'info | Fichier |
|---|---|
| Décision d'architecture structurante (le **pourquoi**) | `docs/architecture/decisions.md` (ADR consolidé). |
| Doc technique de référence (modules, data model, realtime, DB) | `docs/architecture/<domaine>.md`. |
| Doc UI frontend (catalogue composants, design system, writing style) | `battleforthecrown-pixi/docs/ui-{library,design-system,writing-style}.md`. |
| Mécanique gameplay | `docs/gameplay/`. |
| Convention projet (transversale) | `.claude/rules/conventions.md`. |
| Convention workspace | `<workspace>/.claude/rules/<scope>.md`. |
| Briefing AI agent | `<workspace>/CLAUDE.md`. |
| Onboarding humain | `README.md` de chaque workspace. |
| Historique des changements | `git log` (les commits suivent `<type>(<scope>): <subject>`). |
