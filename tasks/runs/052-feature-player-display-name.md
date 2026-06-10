# Run #052 — feature-player-display-name

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — identité joueur publique transversale.
- **Spec source** : Aucune dédiée. Backprop attendu dans `SPEC.md` et/ou `docs/architecture/` si le run confirme l'invariant public/privé.
- **Type** : `feature`
- **Modules backend** : `auth`, `power`, `world`, `prisma/schema.prisma`
- **Modules frontend** : `auth`, `stores/auth`, `features/layout`, `features/world`, surfaces leaderboard si présentes
- **Modules transverses** : `packages/shared/src/auth/*`, `packages/shared/src/world/*` si le payload carte expose l'identité propriétaire

## Décisions de cadrage

1. **Nom joueur global au compte** : la source de vérité est `User.displayName`, pas `WorldMembership`. Le joueur garde le même nom public sur tous les mondes.
2. **Email privé** : l'email reste l'identifiant de login et ne doit plus être utilisé comme nom affiché dans le jeu ou les payloads publics.
3. **Nom public unique** : `displayName` est unique globalement, avec comparaison case-insensitive côté validation/backfill pour éviter les collisions visuelles.
4. **Validation MVP** : 3 à 20 caractères après trim, caractères autorisés `[A-Za-z0-9 _'-]`, espaces consécutifs normalisés/refusés, pas de nom vide après trim, message collision explicite `Nom de joueur déjà pris`.
5. **Pas de renommage dans ce run** : le vertical couvre création, session et exposition du nom. Une future gestion de renommage/profil peut être ticketée après.

## Dépendances

- Aucune dépendance bloquante active.
- Contexte à respecter :
  - [`70 — Ouvrir la fiche joueur depuis l'avatar IG`](../archive/70-integrate-player-profile-sheet.md) — profil joueur actuellement alimenté par `user.email`.
  - [`034 — Isolation multi-monde des données joueur`](./archive/034-fix-world-scoped-player-data.md) — invariant world-scoped des données joueur visibles.
  - [`63 — Les autres joueurs n'apparaissent jamais sur la carte`](../archive/63-foreign-players-invisible-on-world-map.md) — feed carte des villages joueurs publics.

## Critère de fin (acceptance)

- [ ] `User.displayName` existe dans Prisma avec migration additive, index/contrainte d'unicité adaptée, et backfill déterministe pour les utilisateurs existants. _(auto : migration + Prisma generate + smoke auth)_
- [ ] `POST /auth/register` exige `displayName`, applique la validation MVP, crée l'utilisateur avec ce nom et renvoie `displayName` dans la session. _(auto : smoke auth)_
- [ ] `POST /auth/login` reste basé sur email + password, mais renvoie `displayName`; aucune réponse session ne dépend de l'email comme nom affiché. _(auto : smoke auth)_
- [ ] Le frontend d'inscription expose un champ nom joueur, affiche les erreurs de validation/collision, puis persiste `AuthUser.displayName` dans le store. _(auto : test Pixi ciblé, visuel pour le rendu)_
- [ ] Le profil joueur, l'avatar et les initiales utilisent `displayName` en priorité et n'affichent plus l'email comme nom de joueur. _(auto : test Pixi ciblé)_
- [ ] Le leaderboard de puissance et tout contrat public joueur modifié exposent un nom joueur public, pas `email`. _(auto : smoke/curl + grep `email` sur DTOs publics concernés)_
- [ ] Les villages joueurs publics peuvent exposer le nom du propriétaire quand l'UI en a besoin, sans fuite d'email et sans casser le nom de village existant. _(auto : smoke world entities + test transform frontend si payload modifié)_
- [ ] Les utilisateurs existants reçoivent un `displayName` unique via backfill non destructif. _(auto : inspection migration + smoke DB)_
- [ ] `yarn workspace battleforthecrown-backend prisma generate`, tests ciblés backend/Pixi, puis `yarn static-check` passent. _(auto : commandes exactes)_

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma`
- React/HUD : skill `bftc-react-hud`

## Liens détectés

- **À faire avant** : Aucun.
- **À faire après** : futur ticket/run de renommage joueur, modération/réservation de noms, profil joueur enrichi, tribu/alliance ou préférences.
- **Doublon potentiel** : Aucun.
- **Connexe** :
  - [`70 — Ouvrir la fiche joueur depuis l'avatar IG`](../archive/70-integrate-player-profile-sheet.md) — profil actuel avec fallback email.
  - [`072 — Stats joueur sur les cartes royaumes`](../archive/072-worlds-player-stats.md) — surfaces joueur sur `/worlds`.
  - [`034 — Isolation multi-monde des données joueur`](./archive/034-fix-world-scoped-player-data.md) — invariant données visibles scoppées par monde.
  - [`63 — Les autres joueurs n'apparaissent jamais sur la carte`](../archive/63-foreign-players-invisible-on-world-map.md) — payload carte des villages joueurs.
  - [`65 — Distinguer mes villages des villages joueurs étrangers sur la WorldMap`](../archive/65-own-vs-foreign-villages-map-distinction.md) — UX villages joueurs étrangers.
- **Déjà résolu (archive)** : Aucun ne traite le nom joueur public.
- **Keywords scannés** : `joueur`, `player`, `profile`, `profil`, `identity`, `identité`, `name`, `email`.

## Décomposition initiale (rempli par le lead à l'étape 3)

> Draft de cartographie (`bftc-plan`). À raffiner à l'étape 3 du `$bftc-run`.

- **T1 — Contrat shared auth** : étendre `registerSchema`, `AuthUser` et `AuthSessionResponse` avec `displayName`; ajouter helper/regex de validation si partagé.
- **T2 — Migration Prisma** : ajouter `User.displayName`, générer une migration additive avec backfill unique pour l'existant, puis `prisma generate`.
- **T3 — Auth backend** : valider collision/normalisation, créer/retourner `displayName` sur register/login, adapter helpers de test.
- **T4 — Surfaces publiques backend** : remplacer `email` par un nom public dans leaderboard et enrichir les payloads publics nécessaires (`world entities`) sans confondre nom de village et nom joueur.
- **T5 — Frontend auth/session** : ajouter le champ inscription, typer/persister `displayName`, gérer erreurs validation/collision.
- **T6 — Frontend affichage jeu** : profil, avatar, initiales, leaderboard/carte/popup si présents utilisent `displayName`; l'email reste invisible hors surfaces de compte/login.
- **T7 — Tests, smokes, docs** : auth smoke, smoke public leaderboard/entities, tests Pixi ciblés, grep anti-fuite email, backprop invariant public/privé.

## Points d'attention

- Ne pas utiliser le local-part d'email comme nom public final côté UI. Le backfill peut produire un nom technique unique, mais l'email complet ne doit pas fuiter.
- Préserver la compat des sessions frontend persistées : prévoir fallback sobre pour anciennes sessions sans `displayName`, puis remplacement au login suivant.
- L'unicité case-insensitive peut nécessiter un index SQL spécifique plutôt qu'un simple `@unique` selon le choix Prisma/Postgres.
- Garder le nom de village (`Village.name`) distinct du nom joueur (`User.displayName`) dans les DTOs carte et rapports.
- Ne pas ouvrir le scope modération/renommage/réservation de noms dans ce run.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** : _(rempli à l'étape 10)_
- **Review indépendante** : `Déclenchée` requise (raison : (a) back+front, (c) diff estimé > 100 lignes, (d) invariant durable email privé / nom public).
- **Tests automatisés** : _(rempli à l'étape 10)_
- **Smokes ajoutés/modifiés** : _(rempli à l'étape 10)_
- **QA fonctionnelle agent** : _(rempli à l'étape 10)_
- **Tests IG à faire par le user** : _(rempli à l'étape 10)_
