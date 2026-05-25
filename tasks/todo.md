# Profil joueur : infos monde

- [x] Vérifier l’état réel du worktree et les composants concernés.
- [x] Brancher la fiche profil sur le monde public courant pour le jour, la phase et le drapeau.
- [x] Adapter les fixtures/tests UI.
- [x] Vérifier tests ciblés, static-check et rendu browser.

## Review

- La fiche profil lit le `PublicWorld` actif pour nom, J+/durée, phase et drapeau.
- Le drapeau reprend le même mapping `sigil`/theme que les cartes de royaumes.
- Tests ciblés Pixi, static-check et vérification browser verts.
- Docs : aucun changement nécessaire, raison : affichage UI d’une donnée monde déjà exposée.
