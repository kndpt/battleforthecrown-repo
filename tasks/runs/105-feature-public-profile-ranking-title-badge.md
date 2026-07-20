# Run #105 — public-profile-ranking-title-badge

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors phase séquentielle — follow-up post-MVP du run 068 (Gloire hebdo), reporté explicitement par 068 § Hors scope l.95. Rattachement Phase 12 « Ajouts mineurs MVP » à confirmer au refinement.
- **Spec source** : `docs/gameplay/24-rankings.md` § Rewards (l.119-131, spécifiquement l.127 « badge public sur la fiche joueur »)
- **Type** : feature
- **Modules** : shared `world/public-player-profile` | backend `users` (public-profile) + `rankings` (cycle service) | frontend `features/world` (fiche publique)

## Objectif

Le titre hebdo (Gloire d'Assaut / Gloire du Rempart) est attribué et persisté (`RankingCycleTitleAward`, run 068) mais lisible **uniquement par son détenteur** via `GET /users/me/ranking-titles` (self-scoped). Aucune surface publique n'expose le titre d'un joueur tiers.

Ce run lève le report de 068 § Hors scope l.95 : surfacer le **titre actif** d'un joueur tiers sur sa **fiche publique** ouverte depuis la carte (`PublicPlayerProfileSheet`), sous forme de badge cosmétique — comme autorisé par la spec 24 § Rewards l.127. Fog-safe : un titre de Gloire est public/cosmétique, zéro pouvoir in-world (même classe que `renownLevel`, déjà exposé).

## Dépendances

- **Aucun prérequis bloquant.** Run 068 (DONE) fournit `RankingCycleTitleAward` + `RankingsCycleService.getTitlesForUser` + shared `rankings/` types (`RankingCycleTitle`, `GlorySignalSchema`). Run 082 (DONE) fournit le pattern d'extension additive du DTO public (`newbieShield`, `inactivity`).

## Critère de fin (acceptance)

- [ ] [auto] `GET worlds/:worldId/users/:userId/public-profile` renvoie le champ titre public quand le joueur détient un titre actif.
- [ ] [auto] Seuls les titres **actifs** (`validUntilAt > now`) sont surfacés ; un titre expiré n'apparaît pas dans le DTO public.
- [ ] [auto] Aucun champ non-fog-safe ajouté : le DTO public ne contient que `userId` / `displayName` / `kingdomPower` / `renownLevel` / `newbieShield` / `inactivity` + titre `{ signal, label, active }` (test de schéma).
- [ ] [auto] `GET /users/me/ranking-titles` (self) reste inchangé (signature + payload).
- [ ] [visuel] La fiche publique (`features/world`) affiche le badge (glyphe ⚔️/🛡️ + label) quand un titre actif existe, et n'affiche aucun bloc titre sinon.
- [ ] [auto] `yarn static-check` vert (rebuild shared inclus).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`
- Preuves du gap (préflight, à revérifier au démarrage) :

  ```bash
  # DTO public : aucun champ titre
  grep -n "PublicPlayerProfileResponseSchema" packages/shared/src/world/public-player-profile.ts
  # route titres self-scoped uniquement
  grep -n "users/me/ranking-titles\|out of scope" battleforthecrown-backend/src/modules/rankings/ranking-titles.controller.ts
  # aucune notion de titre actif exposé publiquement
  rg -n "activeTitle" battleforthecrown-pixi/src packages/shared/src battleforthecrown-backend/src   # → 0
  # fiche publique front : aucun bloc titre
  rg -n "title|Title|badge" battleforthecrown-pixi/src/features/world/PublicPlayerProfileSheet.tsx
  # pattern de rendu déjà écrit (design-system) à réutiliser
  grep -n "TitleRow\|titleSignalStyle" battleforthecrown-pixi/src/features/design-system/components/PlayerProfileSheet.tsx
  ```

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 (shared, ≤2 fichiers)** — Étendre `PublicPlayerProfileResponseSchema` (`packages/shared/src/world/public-player-profile.ts`) d'un champ titre public **additif** (`activeTitle` nullable ou `activeTitles[]` — cardinalité à trancher), restreint à `{ signal, label, active }` (aucun `cycleIndex` / XP). Mettre à jour / ajouter le `.spec`.
- **T2 (backend, ≤3 fichiers)** — Ajouter `getActiveTitlesForUser(userId, worldId?)` dans `rankings-cycle.service.ts` (filtre `validUntilAt > now`, réutilise la query `rankingCycleTitleAward.findMany`) ; l'appeler dans `PublicProfileService.getPublicProfile` (`modules/users/public-profile.service.ts`) ; câbler l'import de module (vérifier export `RankingsCycleService` sans cycle de dépendance) ; spec unit du mapping.
- **T3 (frontend, ≤3 fichiers)** — Rendre le badge dans `features/world/PublicPlayerProfileSheet.tsx` ; adapter le schéma de parse de `usePublicPlayerProfileQuery` (`api/queries/power.ts`) ; réutiliser / porter `TitleRow` + `titleSignalStyle` depuis `features/design-system/components/PlayerProfileSheet.tsx`.
- **T4 (docs, ≤3 fichiers)** — `24-rankings.md` § Rewards (marquer badge public livré) ; retirer / mettre à jour la note « out of scope MVP » de `ranking-titles.controller.ts` et de `068 § Hors scope l.95`.

## Points d'attention (à trancher au refinement)

- **Scope monde du titre** : la fiche publique est world-scoped mais les titres portent chacun leur `worldId` (cross-monde). Décider : titres du **monde courant** seulement, ou tous les titres actifs. Spec muette → défaut recommandé : monde courant (cohérent avec la fiche world-scoped).
- **Actif vs historique** : surfacer uniquement l'**actif** (badge courant), pas l'historique. Spec muette.
- **Cardinalité** : un joueur peut détenir Assaut **ET** Rempart actifs simultanément → 1 ou 2 badges ? (`array` vs single). Décider en T1.
- **Extraction du composant** : `TitleRow` vit dans `features/design-system` (prototype) → décider extraction en composant UI partagé vs inline dans la fiche world.
- **Hors scope de cette tranche** : badge à côté du nom dans le **leaderboard** (`RankingsScreen`) = surface supplémentaire, follow-up séparé pour rester small.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

_(Vide au démarrage.)_

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : requise — critère (b) : modifie une surface d'exposition d'information publique (DTO fiche joueur tiers) touchant l'invariant fog-of-war / visibilité (spec 09). Un second regard valide que le périmètre des champs exposés reste minimal et qu'aucune donnée mécanique ne fuit.
- **Tests automatisés** : …
- **Tests IG user** : … ou `Aucun`, raison
