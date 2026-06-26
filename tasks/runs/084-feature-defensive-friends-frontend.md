# Run #084 — feature-defensive-friends-frontend

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 12 — Ajouts mineurs MVP. Suite frontend du [run 063](archive/063-feature-defensive-friends-list.md) qui a livré le backend + contrat shared. Le contrat REST/DTO est figé côté serveur ; ce run ne fait que le HUD Pixi/React qui le consomme.
- **Spec source** : [`docs/gameplay/20-defensive-friends.md`](../../docs/gameplay/20-defensive-friends.md) (§ Décisions tranchées + § Contrat technique). Contrat shared : `@battleforthecrown/shared/social` (`FriendshipDto`, `MyFriendshipsResponse`, `CreateFriendshipSchema`, `DEFENSIVE_FRIENDS_CAP`, `FRIENDSHIP_ERROR_CODES`).
- **Type** : `feature`
- **Modules frontend** : nouveau `features/social/DefensiveFriendsSheet.tsx` (3 buckets `pendingIn`/`pendingOut`/`active`, add via pseudo, accept/refuse, retrait), point d'entrée HUD (profil joueur / drawer — à confirmer en refinement), extension du formulaire de renfort pour cibler un village d'ami `ACTIVE`, viewer de rapport de scout affichant `details.defensiveFriendsDisplayNames`.

## Dépendances

- ✅ Backend livré (run 063) : endpoints `POST/GET/DELETE /worlds/:worldId/friendships`, `POST …/:id/accept`, guard renfort cross-joueur, scout enrichi. Aucun changement backend attendu dans ce run.
- Hors scope : toute évolution du contrat backend (cap, codes d'erreur, statuts). Si un manque backend apparaît, le remonter en finding plutôt que de l'implémenter ici.

## Critère de fin (acceptance)

- [ ] **[frontend]** Sheet `DefensiveFriendsSheet` accessible depuis le HUD : liste les 3 catégories (`pendingIn`, `pendingOut`, `active`), bouton add via pseudo (`recipientDisplayName`), accept/refuse pour `pendingIn`, retirer pour `active`/`pendingOut`. Bouton ajout désactivé si cap 5 `ACTIVE` atteint, tooltip « Cap 5 amis défensifs ».
- [ ] **[frontend]** Les codes d'erreur (`FRIENDSHIP_ALREADY_ACTIVE`, `FRIENDSHIP_PENDING_AWAITING_ACCEPT`, `DEFENSIVE_FRIENDS_CAP_REACHED`) produisent des toasts/messages lisibles distincts (notamment guider vers `accept` sur `PENDING_AWAITING_ACCEPT`).
- [ ] **[frontend]** Le formulaire de renfort autorise la cible d'un village d'ami `ACTIVE`. Si aucun ami `ACTIVE`, seul l'auto-renfort reste cliquable.
- [ ] **[frontend]** Le viewer de rapport de scout affiche `defensiveFriendsDisplayNames` (compacte, ≤ 5 noms) quand présent.
- [ ] `yarn static-check` + `yarn test:pixi` verts. Vitest sur le mapping non trivial (TanStack mutations + rollback, parsing erreurs codes).
- [ ] **[docs]** Catalogue UI (`battleforthecrown-pixi/docs/ui-library.md`) mis à jour si un nouveau composant réutilisable est introduit.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-react-hud`, `bftc-pixi-scene`, `bftc-tests-policy`, `bftc-qa`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — API client + query/mutations** : hook(s) TanStack Query pour `GET …/me` + mutations create/accept/delete avec invalidation. Vitest mapping/rollback.
- **T2 — DefensiveFriendsSheet** : composant 3 buckets + add + accept/refuse + remove + cap UI.
- **T3 — Renfort form** : autoriser cible village d'ami `ACTIVE`.
- **T4 — Scout viewer** : afficher `defensiveFriendsDisplayNames`.
- **T5 — Point d'entrée HUD + docs UI**.

## Progress

_(Pendant run — supprimé à l'archive)_

## Décisions prises

_(Pendant run — supprimé à l'archive)_

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : …
- **Tests automatisés** : …
- **Tests IG user** : checklist mobile (sheet, cap grisé, renfort ami, scout révèle).
