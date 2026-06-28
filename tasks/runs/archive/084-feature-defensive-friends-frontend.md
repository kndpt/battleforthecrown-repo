# Run #084 — feature-defensive-friends-frontend

> **Statut** : DONE
> **Démarré** : 2026-06-28
> **Terminé** : 2026-06-28

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

## Décisions prises

- Entrée HUD = bouton « Amis » sur la carte du monde (`WorldMapScreen`, cluster haut-gauche) — co-localisé avec l'usage social/PvP (scout voisins, renfort villages d'amis). _(détail : git history)_
- Sur un village d'ami `ACTIVE`, le panneau carte n'expose que **Renfort** (attaque/scout masqués) via le nouveau prop `VillageMapPanel.reinforceOnly` ; le modal force le mode renfort. Cohérent avec la nature défensive de l'amitié (pour attaquer un ami, le retirer d'abord) et évite des boutons inertes.
- Renfort ami exclu sous fenêtre de capture `OPEN` (panneau + modal, defense-in-depth) ; le backend reste autoritatif.

## Rapport final

Suite frontend du run 063 (backend + contrat shared figés). HUD complet : sheet de gestion 3 buckets, renfort cross-joueur sur village d'ami `ACTIVE`, amis défensifs révélés par le scout. Review indépendante : BLOCK cycle 1 (bouton renfort ami non rendu) → fix `reinforceOnly` → GO cycle 2.

### Acceptance & QA

**Critères d'acceptance vérifiés**

- [x] Sheet `DefensiveFriendsSheet` (3 buckets, add pseudo, accept/refuse, retrait, cap 5 grisé + tooltip) — `yarn workspace battleforthecrown-pixi test src/lib/friendshipsCache.test.ts` → cap/transforms verts ; rendu visuel = IG.
- [x] Codes d'erreur → messages FR distincts + guidage vers `accept` — `yarn workspace battleforthecrown-pixi test src/features/social/friendshipErrorMessage.test.ts` → 3 codes distincts + 404 pseudo + fallback verts (lecture `err.data.code`, jamais le message).
- [x] Renfort autorise un village d'ami `ACTIVE` ; sinon seul l'auto-renfort cliquable — `yarn workspace battleforthecrown-pixi test src/features/design-system/components/villageMapPanel/VillageMapPanel.reinforceOnly.test.tsx` → Renfort seul rendu, `disabled` si non renforçable ; flux complet = IG.
- [x] Viewer scout affiche `defensiveFriendsDisplayNames` (≤5, omis si vide/barbare) — `yarn workspace battleforthecrown-pixi test src/features/combat/scoutReportView.test.ts` → section présente/omise verte.
- [x] `yarn static-check` + `yarn test:pixi` verts — `yarn static-check` → OK (66s) ; `yarn workspace battleforthecrown-pixi test` → 851 pass (122 fichiers).
- [x] Catalogue UI mis à jour si nouveau composant réutilisable — aucun nouveau primitive `src/ui/` (sheet = composition feature) → pas de changement `ui-library.md`.

**Review indépendante** : Déclenchée (raison: diff > 100 lignes, plusieurs zones HUD). Cycle 1 `BLOCK` (1 bloquant : bouton renfort ami jamais rendu sur la carte) → fix `VillageMapPanel.reinforceOnly` → Cycle 2 `GO` (0 bloquant/majeur ; 2 mineurs acceptés : duplication `isFriendActiveVillage` defense-in-depth, styles inline footer).

**Tests automatisés** : `yarn static-check` vert ; `yarn workspace battleforthecrown-pixi test` → 851 pass. Nouveaux : `friendshipsCache.test.ts` (transforms optimistic + cap), `friendshipErrorMessage.test.ts` (parsing codes), `VillageMapPanel.reinforceOnly.test.tsx` (footer ami), +3 cas `scoutReportView.test.ts`.

**Smokes lancés** : Non lancés localement, raison : run frontend-only (aucun fichier `battleforthecrown-backend/src/` touché ; backend + contrat shared figés au run 063). Full smoke couvert par CI PR.

**Smokes ajoutés/modifiés** : Aucun, raison : frontend-only.

**QA fonctionnelle agent** : Non exécutée — frontend pur consommant un backend figé ; aucun comportement backend nouveau à curl/SQL. Validation gameplay/visuelle = IG (cf. ci-dessous).

**Tests IG à faire par le user** (≤5, règle `qa.md` : Kelvin teste ; serveurs non démarrés — flux PR async, env distant) :

1. Carte → bouton « Amis » ouvre la sheet ; inviter par pseudo → toast ; à 5 amis actifs le bouton « Inviter » est grisé + tooltip « Cap 5 ».
2. Joueur B accepte la demande reçue → l'ami passe en « Actifs » des deux côtés (resync REST).
3. Taper le village d'un ami `ACTIVE` sur la carte → panneau « Renfort » seul (pas Attaque/Scout) → envoi de troupes OK.
4. Village d'ami sous fenêtre de capture `OPEN` → bouton « Renfort » désactivé.
5. Scouter un joueur ayant des amis défensifs → rapport scout affiche la section « Amis défensifs » (≤5 noms).
