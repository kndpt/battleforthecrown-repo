# Run #082 — feature-public-player-profile-newbie-shield-badge

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 7 — Conquête PvP (`tasks/00-mvp-roadmap.md` § Phase 7)
- **Spec source** :
  - `docs/gameplay/14-pvp-conquest.md` § 3 « Bouclier débutant » ligne 193 — « Icône bouclier + timer restant sur **la fiche publique du joueur**, sur le panneau d'info du village et dans le rapport de scout »
  - `docs/gameplay/09-power-and-rankings.md` § « Visibilité » lignes 33-39 — « Puissance Royaume : Visible pour tous » (consommée comme contenu publique du profil)
- **Type** : feature
- **Modules** :
  - backend nouveau module/contrôleur `modules/users` (ou extension `modules/world` / `modules/power`), `modules/world/world-entities-query.service.ts` (réutilisation displayName + isBarbarian), `modules/power/power.service.ts` (réutilisation `getPublicKingdomPower`)
  - shared `packages/shared/src/users/` (ou `packages/shared/src/profile/`) — nouveau DTO + Zod `PublicPlayerProfileResponse`
  - frontend `battleforthecrown-pixi/src/features/world/SelectedEntityPanel.tsx` (CTA « Voir profil »), nouveau composant `PublicPlayerProfileSheet`, `battleforthecrown-pixi/src/api/queries.ts` (query TanStack), `battleforthecrown-pixi/src/features/world/NewbieShieldIcon.tsx` (réutilisé tel quel)

## Dépendances

- Run [`056-feature-pvp-newbie-shield-48h`](archive/056-feature-pvp-newbie-shield-48h.md) — DONE. A livré `NewbieShieldService.getMembershipShieldState`, helper shared `isShieldActive`/`shieldEndsAt` et badge self header. La présente fiche réutilise le service + helper sans modification de la mécanique.
- Run [`081-feature-pvp-newbie-shield-scout-report-badge`](archive/081-feature-pvp-newbie-shield-scout-report-badge.md) — DONE. A livré la deuxième des trois surfaces (rapport de scout). La présente fiche livre la troisième et dernière surface — la fiche publique du joueur — explicitement reportée par 056/081 comme « route inexistante ».
- Run [`080-feature-account-renown`](archive/080-feature-account-renown.md) — DONE. Pattern `PlayerProfileSheet` côté self, à ne pas modifier ici. La fiche publique est un composant séparé pour éviter les couplages entre lecture self (renown XP, villages possédés) et lecture publique (zéro fuite d'information privée).
- Aucune dépendance bloquante : tous les pré-requis sont mergés.

## Contexte

La spec 14 § 3 acte trois surfaces pour la visibilité du bouclier débutant : panneau d'info du village ennemi (livré par run 056), rapport de scout (livré par run 081), **fiche publique du joueur** (jamais livré). Côté code : aucune route REST publique `GET /users/:userId/...`, aucun composant Pixi `PublicPlayerProfileSheet`, aucun chemin pour qu'un joueur ouvre le profil d'un voisin depuis la carte. Le suivi `task_56e23ad7` mentionné par les runs 056 et 081 reste donc partiellement ouvert : la fiche publique est sa moitié manquante.

Conséquence : un joueur qui croise un voisin sur la carte n'a aucune surface dédiée pour vérifier son état de bouclier sans cliquer sur chacun de ses villages individuellement (le badge village du run 056 est local à un village, pas au joueur). C'est un cliquodrome inutile, et la promesse de spec « badge sur la fiche publique » est cassée.

## Critère de fin (acceptance)

- [ ] Backend expose `GET /worlds/:worldId/users/:userId/public-profile` (route publique ou JWT-protected selon décision §Points d'attention), retourne `{ userId, displayName, kingdomPower: number, newbieShield: { active: boolean, endsAt: string } | null }`. _(auto : curl + smoke)_
- [ ] La route retourne **uniquement** des champs publiquement révélables par spec : displayName + puissance royaume publique + état bouclier. **Aucune** info privée (renown XP, villages possédés, couronnes, armée, intel) — un fuite serait une régression de l'invariant 09 § Visibilité. _(auto : test backend qui assert la shape exacte du response)_
- [ ] Cible `userId` inexistante ou non-membre du `worldId` → 404 `USER_NOT_MEMBER_OF_WORLD`. _(auto : smoke)_
- [ ] Cible barbare (pas de `User`) → 404. _(auto : smoke)_
- [ ] `newbieShield` snapshot live à la lecture via `NewbieShieldService.getMembershipShieldState` (état figé du shield jusqu'à expiration ou rupture, jamais recalculé côté front). Aucune nouvelle source de vérité. _(auto : test backend)_
- [ ] Cible avec bouclier inactif (`shieldBrokenAt != null` ou `endsAt < now`) → `newbieShield: null`. _(auto : test backend)_
- [ ] Shared expose `PublicPlayerProfileResponseSchema` (Zod) + type DTO. Boundary Zod parse côté front via le `ApiClient`. _(auto : grep + static-check)_
- [ ] Frontend nouveau composant `PublicPlayerProfileSheet` (sous `features/world/` ou `features/players/`) consomme la query, affiche : nom du joueur, badge bouclier (réutilise `NewbieShieldIcon` + `NewbieShieldTimer` du run 056), bloc puissance royaume publique. _(visuel/gameplay IG)_
- [ ] Si bouclier inactif → section bouclier masquée (pas d'état « non protégé » explicite — discrétion alignée sur la spec qui n'invente pas un signal négatif). _(visuel/gameplay IG)_
- [ ] CTA « Voir profil » sur `SelectedEntityPanel` ouvre la sheet quand l'entité sélectionnée est un village joueur tiers (`isPlayerVillage && entity.userId !== currentUserId`). Sur le village propre du joueur : pas de CTA (la sheet self est ouverte via l'avatar HUD). Sur un barbare : pas de CTA. _(visuel/gameplay IG)_
- [ ] Fermer la sheet ne modifie ni la route courante ni le village sélectionné. _(visuel/gameplay IG)_
- [ ] Aucune migration Prisma (toutes les données existent : `User.displayName`, `WorldMembership.joinedAt`/`shieldBrokenAt`, `Power*`). _(auto : grep `prisma/migrations` n'a aucun nouveau dossier)_
- [ ] Smoke backend dédié : crée un joueur attaquant + un joueur cible sur monde OPEN, attaque PvP sortante rompt le bouclier de l'attaquant — la fiche publique de l'attaquant retourne `newbieShield: null`, celle de la cible retourne `newbieShield.active = true`. _(auto : smoke)_
- [ ] Pixi : 1 test rendant `SelectedEntityPanel` sur village ennemi → CTA présent ; sur village propre → CTA absent ; sur barbare → CTA absent. 1 test rendant `PublicPlayerProfileSheet` avec shield actif (badge visible) + 1 test sans shield (section masquée). _(auto : test pixi)_
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:pixi` verts. _(auto)_
- [ ] Docs : mise à jour du rapport final de `tasks/runs/archive/056-feature-pvp-newbie-shield-48h.md` et `tasks/runs/archive/081-feature-pvp-newbie-shield-scout-report-badge.md` (note clôture explicite du suivi `task_56e23ad7` — fiche publique livrée par ce run). Aucune modification spec (la spec 14 est déjà alignée). _(auto : grep)_

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-react-hud`, `bftc-prisma` (lecture seule)

## Décomposition initiale

_(Lead étape 3 — tâches ≤ 5 fichiers)_

- **T1** — Shared : `packages/shared/src/users/public-profile.schema.ts` (Zod + type `PublicPlayerProfileResponse`). 1 fichier nouveau + index re-export.
- **T2** — Backend service : `modules/users/public-profile.service.ts` (ou rattachement à un module existant) — orchestre la lecture displayName + `getPublicKingdomPower` + `NewbieShieldService.getMembershipShieldState`, gère 404. 1-2 fichiers.
- **T3** — Backend contrôleur : route REST + `@Public()` (ou JWT — cf. Points d'attention) + Zod pipe sur params. 1 fichier.
- **T4** — Frontend query + sheet : `api/queries.ts` (hook `usePublicPlayerProfileQuery`), nouveau composant `PublicPlayerProfileSheet` réutilisant `NewbieShieldIcon`/`NewbieShieldTimer`. 2-3 fichiers.
- **T5** — Frontend trigger : `SelectedEntityPanel` câble CTA « Voir profil » qui ouvre la sheet via état local. 1 fichier.
- **T6** — Smoke backend + tests Pixi (`SelectedEntityPanel` CTA visibility, `PublicPlayerProfileSheet` shield présent/absent). 2 fichiers.
- **T7** — Docs : annotations aux rapports finaux des runs 056 et 081 (clôture suivi `task_56e23ad7`).

## Points d'attention

- **Auth de la route** : `@Public()` (lisible sans JWT, cohérent avec `GET /power/kingdom/:userId/public` du run 058) **ou** JWT-protected (réservé aux joueurs connectés). Décision recommandée : **JWT-protected** car le contenu (shield endsAt précis) est un signal exploitable côté scraping ; aligne avec le pattern « pas de fuite info gratuite » du spec 09 § Visibilité. À trancher au refinement par le user.
- **Scope `worldId` obligatoire** : le bouclier est **par WorldMembership**, pas global. Sans `worldId` dans le path, impossible de retourner un état de bouclier cohérent. La route doit obligatoirement embarquer `worldId` — pas de fallback « mode toutes-mondes ».
- **Pas de fuite renown** : la spec 25 § 2 acte « Renommée = identité cosmétique » mais ne tranche pas explicitement la visibilité publique. Décision pour ce run : **renown reste self-only** (déjà via `GET /users/me/renown`). Visibilité publique du niveau de Renommée = follow-up dédié quand le sujet sera priorisé. Aucune leak via cette route.
- **Pas de fuite awards** : run 067 (cosmetic permanent rewards, PLANNED) acte explicitement « consultation par le propriétaire uniquement » — ce run respecte. La fiche publique n'expose **aucun** award même quand le run 067 sera livré ; un éventuel partage public des awards requerra son propre run + décision spec.
- **Pas de fuite intel** : la spec 11 § Carnet d'intel acte « Info privée au joueur qui a obtenu le rapport ». La fiche publique n'expose jamais l'intel détenu par l'observateur (compo, stock, style scoutés).
- **Réutilisation `NewbieShieldService`** : ne pas dupliquer la logique de calcul shield. Réutiliser tel quel. Le service expose déjà `getMembershipShieldState(membership)` retournant `{ active, endsAt }` — c'est exactement la shape attendue par le DTO public.
- **Discrétion de l'absence de bouclier** : la spec ne mentionne pas d'état négatif visible (« joueur exposé »). Décision : `newbieShield: null` côté DTO → section UI masquée. Pas de badge « bouclier expiré » qui transformerait la fiche en signal d'attaque facile pour les vautours — alignement sur l'invariant 14 (le bouclier est une protection, pas une cible).
- **Coordonnées d'ouverture depuis la carte** : le CTA « Voir profil » sur `SelectedEntityPanel` est le chemin canonique au MVP. Pas de deep-link URL (`/players/:userId`) au MVP — la sheet est une bottom-sheet locale au `WorldMapScreen`. Deep-link = follow-up post-MVP si besoin de partage social.
- **Multi-village du joueur cible** : un même joueur peut avoir N villages sur le monde. Le CTA depuis n'importe lequel ouvre la **même** fiche publique (par `userId`, pas par `villageId`). Cohérent avec « le bouclier est par joueur sur le monde, pas par village ».
- **i18n / wording** : libellés FR à valider au refinement (« Voir profil », « Joueur protégé », « Bouclier débutant », `{hh:mm} restantes`). Réutiliser le wording existant des runs 056/081 pour cohérence.

## Hors scope explicite

- **Renown public** : niveau de Renommée du joueur visible publiquement. Spec 25 ne tranche pas la visibilité publique — follow-up dédié.
- **Awards cosmétiques publics** : titres `Vainqueur de <world>`, etc. (livrés par run 067 PLANNED en self-only). Visibilité publique = follow-up post-MVP.
- **Villages possédés visibles** : liste des villages du joueur cible. Déjà visible sur la carte via fog of war + scout. La fiche publique ne dédouble pas cette info.
- **Couronnes / ressources / armée** : strictement privé par spec 09 § Visibilité (« Puissance Armée : Cachée pour les ennemis »). Jamais sur fiche publique.
- **Activité récente / historique** : pas de feed (« attaqué tel village il y a X »). MVP minimal.
- **Deep-link `/players/:userId`** : pas de route URL dédiée au MVP. Sheet ouverte via état local du `WorldMapScreen`.
- **Profil cross-monde** : la fiche est scopée au monde courant (le bouclier est par WorldMembership). Pas de vue cross-monde au MVP.
- **Open par Inbox / par rapport de scout** : seul le CTA depuis `SelectedEntityPanel` est livré au MVP. Ouverture depuis un rapport scout = follow-up si l'utilisateur en exprime le besoin (le badge sur le rapport est déjà livré par run 081).

## Liens détectés (préflight)

- **À faire avant** : Aucun (tous les pré-requis mergés — runs 056, 080, 081).
- **À faire après** : 
  - Visibilité publique du niveau de Renommée — quand spec 25 tranchera.
  - Visibilité publique des awards cosmétiques — quand run 067 sera DONE et que le sujet sera priorisé.
- **Doublon potentiel** : Aucun. La fiche publique d'un joueur tiers n'est livrée par aucun run actif ni archivé.
- **Connexe (contexte)** :
  - [`archive/080-feature-account-renown.md`](./archive/080-feature-account-renown.md) — `PlayerProfileSheet` self-only, **pas réutilisé** pour la fiche publique (couplage explicite refusé).
  - [`archive/058-feature-pvp-power-third-attack-guard.md`](./archive/058-feature-pvp-power-third-attack-guard.md) — `GET /power/kingdom/:userId/public` réutilisé tel quel.
  - [`archive/056-feature-pvp-newbie-shield-48h.md`](./archive/056-feature-pvp-newbie-shield-48h.md) — `NewbieShieldService` + helpers shared réutilisés sans modification.
  - [`archive/081-feature-pvp-newbie-shield-scout-report-badge.md`](./archive/081-feature-pvp-newbie-shield-scout-report-badge.md) — pattern « snapshot shield exposé via DTO » à reproduire ici (mais lecture live, pas snapshot, car la fiche publique reflète l'état courant pas un instant figé).
- **Déjà résolu (archive)** : Aucun. Le suivi `task_56e23ad7` mentionné par 056/081 est précisément ce qui motive ce run.
- **Keywords scannés** : `public-profile`, `public-player`, `fiche-publique`, `newbie-shield`, `bouclier-debutant`, `player-profile-sheet`.

## Décomposition initiale

_(Vide au démarrage. Voir « Décomposition initiale » plus haut comme draft refinement.)_

## Progress

_(Vide au démarrage. Sera rempli en cours de run.)_

## Décisions prises

_(Vide au démarrage. Sera rempli en cours de run.)_

## Rapport final

### Acceptance & QA

- [ ] _(à remplir au DONE)_
- **Review indépendante** : à déclencher — back+front + introduit une nouvelle surface publique (invariant info publique vs privée). Critères a + d.
- **Tests automatisés** : smoke backend ciblé + tests Pixi (SelectedEntityPanel CTA visibility + PublicPlayerProfileSheet shield visible/masqué) + unit shared (Zod boundary).
- **Tests IG user** : ouverture sheet depuis village ennemi sur la carte, vérification badge bouclier visible avec timer cohérent, fermeture, ouverture sur village propre (CTA absent attendu), ouverture sur barbare (CTA absent attendu).
