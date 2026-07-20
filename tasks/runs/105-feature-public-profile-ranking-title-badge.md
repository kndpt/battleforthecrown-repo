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

Ce run lève **une partie** du report de 068 § Hors scope l.95 (« affichage public d'un autre joueur ») : surfacer le **titre actif** d'un joueur tiers sur **une seule surface**, sa **fiche publique** ouverte depuis la carte (`PublicPlayerProfileSheet`), sous forme de badge cosmétique — comme autorisé par la spec 24 § Rewards l.127. Fog-safe : un titre de Gloire est public/cosmétique, zéro pouvoir in-world (même classe que `renownLevel`, déjà exposé).

Les autres surfaces d'affichage public citées par 068 § Hors scope (badge dans le leaderboard `RankingsScreen`, fiche scout, rapport de combat) **restent hors scope** et à suivre en follow-up — le report de 068 n'est donc pas clos, seulement rétréci à la fiche publique.

**Décisions figées (contrat, ne pas rouvrir en refinement)** :
- **Cardinalité = tableau** `activeTitles[]` : un joueur peut détenir **Assaut ET Rempart** actifs simultanément ; un champ scalaire perdrait l'un des deux. Chaque élément = `{ signal, label, active }` (rien d'autre).
- **Scope monde obligatoire** : la fiche publique est world-scoped ; seuls les titres du **monde de la fiche** (`worldId`) sont exposés. Les titres d'autres mondes (les `RankingCycleTitleAward` survivent au wipe) ne doivent **jamais** fuiter sur une fiche d'un autre monde.
- **Actif seul** : uniquement `validUntilAt > now`, jamais l'historique.
- **Monde exposable seul** : ne pas surfacer de titre pour un monde `ARCHIVED` (garde de cycle de vie, cohérente avec `assertWorldWritable`/`isWorldArchived`).

## Dépendances

- **Aucun prérequis bloquant.** Run 068 (DONE) fournit `RankingCycleTitleAward` + `RankingsCycleService.getTitlesForUser` + shared `rankings/` types (`RankingCycleTitle`, `GlorySignalSchema`). Run 082 (DONE) fournit le pattern d'extension additive du DTO public (`newbieShield`, `inactivity`).

## Critère de fin (acceptance)

- [ ] [auto] `GET worlds/:worldId/users/:userId/public-profile` renvoie `activeTitles[]` (tableau) quand le joueur détient ≥1 titre actif **sur ce monde** ; `[]` sinon.
- [ ] [auto] **Scope monde imposé** : un titre actif détenu par le joueur sur un **autre** monde n'apparaît **pas** dans le DTO (`getActiveTitlesForUser(userId, worldId)` filtre `worldId`, paramètre obligatoire).
- [ ] [auto] Un joueur détenant Assaut **ET** Rempart actifs sur ce monde voit **les deux** éléments dans `activeTitles[]` (cardinalité tableau vérifiée).
- [ ] [auto] Seuls les titres **actifs** (`validUntilAt > now`) sont surfacés ; un titre expiré n'apparaît pas.
- [ ] [auto] **Garde cycle de vie** : aucun titre surfacé pour un monde `ARCHIVED` (exclusion explicite).
- [ ] [auto] Aucun champ non-fog-safe ajouté : le DTO public ne contient que `userId` / `displayName` / `kingdomPower` / `renownLevel` / `newbieShield` / `inactivity` + `activeTitles[]` d'éléments `{ signal, label, active }` (test de schéma).
- [ ] [auto] `GET /users/me/ranking-titles` (self) reste inchangé (signature + payload).
- [ ] [auto] Smoke `public-profile-ranking-title` couvrant : 2 titres actifs même monde, titre cross-world non exposé, titre sur monde archivé non exposé.
- [ ] [visuel] La fiche publique (`features/world`) affiche 1 ou 2 badges (glyphe ⚔️/🛡️ + label) quand des titres actifs existent, et aucun bloc titre sinon.
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

- **T1 (shared, ≤2 fichiers)** — Étendre `PublicPlayerProfileResponseSchema` (`packages/shared/src/world/public-player-profile.ts`) du champ **additif `activeTitles`** (tableau, jamais scalaire — décision figée) d'éléments restreints à `{ signal, label, active }` (aucun `cycleIndex` / XP / `worldId`). `.spec` couvrant le cas 0 titre (`[]`) et 2 titres actifs.
- **T2 (backend, ≤3 fichiers)** — Ajouter `getActiveTitlesForUser(userId, worldId)` (paramètre `worldId` **obligatoire** — décision figée) dans `rankings-cycle.service.ts` : filtre `where: { userId, worldId, validUntilAt: { gt: now } }` sur `rankingCycleTitleAward.findMany`, + garde monde exposable (exclure `ARCHIVED`, réutiliser `isWorldArchived`/statut monde). L'appeler dans `PublicProfileService.getPublicProfile` (`modules/users/public-profile.service.ts`) en passant le `worldId` de la fiche ; câbler l'import de module (vérifier export `RankingsCycleService` sans cycle de dépendance) ; spec unit du mapping (cross-world exclu, archived exclu).
- **T3 (frontend, ≤3 fichiers)** — Rendre le badge dans `features/world/PublicPlayerProfileSheet.tsx` ; adapter le schéma de parse de `usePublicPlayerProfileQuery` (`api/queries/power.ts`) ; réutiliser / porter `TitleRow` + `titleSignalStyle` depuis `features/design-system/components/PlayerProfileSheet.tsx`.
- **T4 (docs, ≤3 fichiers)** — `24-rankings.md` § Rewards (marquer badge public livré) ; retirer / mettre à jour la note « out of scope MVP » de `ranking-titles.controller.ts` et de `068 § Hors scope l.95`.

## Points d'attention

_(Scope monde, cardinalité tableau, actif-seul et garde `ARCHIVED` sont **figés** dans § Objectif — ne pas les rouvrir. Restent ouverts :)_

- **Garde monde exposable** : vérifier au démarrage la façon exacte d'exclure `ARCHIVED` côté `PublicProfileService` (le statut monde est déjà résolu pour la fiche — réutiliser plutôt qu'une 2e requête). Bien traiter les `RankingCycleTitleAward` **persistants après wipe** (le filtre `worldId` seul ne suffit pas si le monde est archivé mais non purgé).
- **Extraction du composant** : `TitleRow` vit dans `features/design-system` (prototype) → décider extraction en composant UI partagé vs inline dans la fiche world.
- **Câblage NestJS** : `RankingsCycleService` exporté/importable depuis le module `users` sans cycle de dépendance (fallback : petit read-service dédié).
- **Follow-up hors scope** : badge à côté du nom dans le **leaderboard** (`RankingsScreen`), fiche scout et rapport de combat — surfaces supplémentaires du report 068, à ticketer séparément.

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
