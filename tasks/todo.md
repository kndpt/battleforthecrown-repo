# 70 - Integrer la fiche joueur depuis l'avatar IG

- [x] Preflight: verifier worktree clean, ticket, rules, SPEC et spec source.
- [x] Cartographier `GameHeader`, `HeaderBar`, `PlayerProfileSheet`, stores auth/game et tests existants.
- [x] Integrer `PlayerProfileSheet` dans `GameHeader` avec donnees runtime disponibles et placeholders sobres.
- [x] Cabler selection village et logout sur les flux existants.
- [x] Ajouter/adapter les tests cibles `GameHeader.test.tsx`.
- [x] Lancer les verifications frontend pertinentes puis `yarn static-check`.
- [x] Review 5 axes, docs impact, archive du ticket, README tasks et commit.

## Decisions prises

- Mode ticket rapide: scope frontend-only localise autour de `GameHeader`.
- Pas de nouvelle API backend: monde courant via memberships si disponible, donnees manquantes en placeholders.
- Test cible dans `GameHeader.test.tsx`, car le setup existe deja et couvre les stores + TanStack Query.

## Review

- Correctness: l'avatar IG ouvre `PlayerProfileSheet`; fermeture overlay/swipe preserve route et village actif; selection village met a jour `useGameStore`.
- UX: le profil utilise le `BottomSheet` generique comme la sheet villages; pas de chrome de fermeture interne; pas de `relative` sur le wrapper anime.
- Donnees: user, monde, couronnes, puissance et villages viennent des hooks existants; rang/tribu/stats non disponibles restent en placeholders.
- Tests: `GameHeader.test.tsx` couvre ouverture, fermeture, selection village, etiquette, non-chargement des details avant l'onglet Villages et logout.
