# Ticket 65 - Own vs foreign villages map distinction

## Plan

- [x] Preflight : Git clean, ticket 65 lu, rules/SPEC/contextes charges.
- [x] Cartographie : verifier `WorldMapScene`, `WorldMiniMap` et source fiable `isMine`.
- [x] Implementation : separer le style Pixi des villages joueurs etrangers.
- [x] Tests : lancer le filet adapte puis `yarn static-check`.
- [x] Review : verifier diff, lisibilite ownership, absence de regression halo actif/barbares.
- [x] Documentation : verifier impact docs et justifier.
- [x] Archive : passer ticket en DONE, archiver, mettre a jour `tasks/README.md`, commit.

## Choix de scope

- Inclus : palette etrangere bleue acier sur la grande carte.
- Inclus : harmonisation minimap avec la meme teinte.
- Exclu : changement de contrat API, backend ou assets.

## Review

- `WorldMapScene.styleFor` separe maintenant `isMine` et `PLAYER_VILLAGE && !isMine`.
- Les villages joueurs etrangers gardent le sprite village, mais recoivent une tint bleue acier + ring bleu clair.
- Les villages du joueur gardent la palette doree existante ; le halo actif reste dessine separement au-dessus.
- Les villages barbares ne changent pas.
- La minimap utilise la meme teinte bleue pour les villages joueurs etrangers.
- Tests : `yarn workspace battleforthecrown-pixi test buildMapEntities` vert ; `yarn static-check` vert apres `prisma generate` requis par le worktree.
- Docs : aucun changement durable necessaire, convention UX locale au rendu WorldMap.
