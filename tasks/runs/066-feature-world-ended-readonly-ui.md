# Run #066 — feature-world-ended-readonly-ui

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle (`tasks/00-mvp-roadmap.md` § Phase 11)
- **Spec source** :
  - `docs/gameplay/19-world-lifecycle.md` § `LOCKED → ENDED` (lignes 99-107) — « Mode lecture seule : les joueurs peuvent encore consulter leur royaume mais plus d'action (raid, upgrade, conquête) » + « Le monde reste consultable 🔧 7 j en `ENDED` puis archivé »
  - `docs/gameplay/24-rankings.md` § « Cycles » (vue monde entier — « Hall of fame du monde, cosmétiques permanents ») + § « Puissance du Royaume » (snapshot consultable à `ENDED`)
- **Type** : feature
- **Modules** :
  - frontend : `features/worlds` (cards CTA `ctaFor`, `WorldDetail`, `WorldSelectionScreen`), `features/game` (`WorldSessionGate`, `GameScreen`, HUD CTAs grisés), nouvel écran `features/worlds/EndedWorldView` ou `features/rankings/FinalRankingsScreen`, `api/queries.ts` (nouveau hook `useFinalRankingsQuery`), `api/world-types.ts` (DTO snapshot), `api/ws-bindings.ts` (réagir à `world.status.changed` → forcer un mode lecture seule sans rechargement)
  - backend : `modules/rankings/rankings.controller.ts` + `rankings.service.ts` (nouvel endpoint `GET /worlds/:worldId/rankings/final` qui lit `WorldFinalRankingSnapshot`), retours 200 même sur monde ENDED (déjà exposé par helper `assertWorldWritable` du run 061), exposition possible du champ dérivé `archiveAt = endsAt + 7j` dans `WorldLifecycle` DTO
  - shared : `packages/shared/src/world/dtos.ts` + `packages/shared/src/rankings/types.ts` — ajouter `WorldFinalRankingSnapshotEntry`, étendre `WorldLifecycleDto` avec `archiveAt` dérivé, exposer `WorldStatus.ENDED` côté CTA helpers si besoin
  - docs : `docs/gameplay/19-world-lifecycle.md` (lever la mention « run successeur » + ajouter section UI livrée), `docs/architecture/backend-modules.md` (nouveau endpoint final rankings), `docs/architecture/data-model.md` (référencer `WorldFinalRankingSnapshot` côté lecture)

## Dépendances

- **Bloquante** : run [`061-feature-world-ended-lifecycle`](./061-feature-world-ended-lifecycle.md) — PLANNED. Doit livrer `WorldFinalRankingSnapshot` (table + tri + tiebreaker stable) + `assertWorldWritable` (mutations 403). Sans 061, ce run n'a rien à consommer côté UI.
- **Connexe non bloquante** : run [`052-feature-eliminated-player-rejoin-flow`](./archive/052-feature-eliminated-player-rejoin-flow.md) — DONE. Pattern `WorldSessionGate` + écran « royaume perdu » existant à réutiliser pour la cohérence visuelle de l'état « monde terminé ».
- **Successeur** : run wipe destructeur `endsAt + 7j` ([`065-feature-world-ended-archive-wipe`](./065-feature-world-ended-archive-wipe.md), PLANNED). Quand ARCHIVED s'ajoute, l'UI devra retirer le monde de la liste publique et invalider proprement les caches du joueur.

## Critère de fin (acceptance)

- [ ] Sur monde `ENDED`, `WorldSessionGate` (ou équivalent) rend un état explicite « Monde terminé — consultation uniquement » au lieu de basculer vers la `GameScreen` interactive. _(auto : test Pixi `WorldSessionGate.test.tsx`)_
- [ ] `ctaFor()` (worldsViewModel) renvoie un CTA non-engageant pour `world.status === 'ENDED'` (libellé type « Terminé · consulter », `ctaKind: 'ended'`). Ne tombe **jamais** sur la branche par défaut `"S'inscrire"` ni `"Entrer"`. _(auto : test Pixi `worldsViewModel.test.ts`)_
- [ ] Sur monde ENDED, la liste `/worlds` continue d'afficher le monde (pas masqué tant que pas ARCHIVED) avec badge `Terminé` + countdown vers `archiveAt = endsAt + 7j`. _(visuel/gameplay IG)_
- [ ] Page détail `/worlds/:worldId` d'un monde ENDED affiche un lien/CTA « Voir le classement final » qui ouvre la consultation. _(visuel/gameplay IG)_
- [ ] Nouvel écran `EndedWorldView` (ou panneau dédié) affiche les 3 leaderboards finaux snapshottés : Puissance du Royaume, Gloire d'Assaut, Gloire du Rempart. Source = `WorldFinalRankingSnapshot` (run 061), pas `RankingsService.getRankingsSummary` (qui calcule live). _(auto : test Pixi + visuel/gameplay IG)_
- [ ] Backend expose `GET /worlds/:worldId/rankings/final` qui retourne les snapshots par signal (POWER / ASSAULT_GLORY / RAMPART_GLORY) avec rang, score, userId, displayName. Contrat HTTP : **200** sur monde ENDED avec snapshot présent ; **404** sur monde `PLANNED` / `OPEN` / `LOCKED` (snapshot pas encore créé, état attendu) ; **409** sur monde ENDED sans snapshot (invariant cassé — run 061 garantit `transitionWorld(LOCKED, ENDED)` + snapshot dans la même tx, donc ce cas signale une corruption). _(auto : test backend + smoke)_
- [ ] Chaque HUD action mutante (boutons attaquer / scout / construire / entraîner / changer style / envoyer caravane / claim carte quotidienne) est **grisée + tooltip** côté front sur monde ENDED, **sans** attendre le 403 backend. Source de la décision : `world.status === 'ENDED'` exposé par les DTOs existants. _(visuel/gameplay IG + au moins 1 test unitaire sur le helper `isWorldReadOnly`)_
- [ ] Sur réception WS `world.status.changed` → `ENDED` pendant qu'un joueur est en session : invalide `worldEntities`, `myVillages`, et bascule l'UI en lecture seule **sans rechargement** ; affiche un toast « Le monde s'est terminé. » _(auto : test ws-bindings)_
- [ ] Lien depuis `/worlds` (ou GameHeader) vers `/worlds/:worldId/rankings/final` accessible même si le joueur n'avait jamais rejoint ce monde (consultation publique du Hall of fame). _(visuel/gameplay IG)_
- [ ] Doc gameplay `19-world-lifecycle.md` mise à jour : retirer la mention « run successeur » + ajouter une note `UI lecture seule livrée par run 066`.
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:pixi` verts.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-react-hud`, `bftc-prisma` (pour le endpoint snapshot)

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- T1 — Shared : étendre `WorldLifecycleDto` avec `archiveAt` dérivé (= `endsAt + lifecycle.archiveAfterDays`, default 7), exposer le type `WorldFinalRankingSnapshotEntry` dans `packages/shared/rankings`. Build shared.
- T2 — Backend endpoint : `RankingsController.GET /worlds/:worldId/rankings/final` + `RankingsService.getFinalRankings(worldId)` qui lit `WorldFinalRankingSnapshot` (créée par run 061), retourne `{ leaderboards: [...] }` aligné sur le DTO de `getRankingsSummary` mais sourcé snapshot. Codes : **200** si snapshot trouvé, **404** si `world.status !== 'ENDED'` (état attendu, snapshot pas encore créé), **409** si `world.status === 'ENDED'` mais aucun snapshot en DB (corruption d'invariant — log warning).
- T3 — Backend lifecycle : exposer `archiveAt` calculé dans le payload `PublicWorld.lifecycle` + `WorldSessionDto`, sans nouvelle colonne DB (dérivé runtime).
- T4 — Front helper : `isWorldReadOnly(world): boolean` dans `features/worlds/lifecycle.ts` (ou équivalent), unit test pur. Tous les sites qui rendent un CTA mutant consomment ce helper. Inventaire des sites = livrable T4.
- T5 — Front worlds list : `ctaFor()` gère `ENDED` (CTA `'ended'`, libellé « Terminé · consulter »), `dayLabel` affiche `Terminé il y a {N}j · archivé dans {M}j`. Update `worldsViewModel.test.ts` (au moins 3 cas : ENDED isJoined, ENDED non isJoined, ENDED proche archive).
- T6 — Front écran ENDED : nouveau `EndedWorldView` (ou `WorldEndedScreen`) accessible depuis `WorldSessionGate` quand le joueur entre dans un monde ENDED, et depuis `/worlds/:worldId` pour consultation publique. Affiche : bannière « Monde terminé », countdown archive, lien vers `FinalRankingsScreen`.
- T7 — Front leaderboard final : `FinalRankingsScreen` consomme `useFinalRankingsQuery(worldId)`, rend les 3 leaderboards snapshottés (3 sections lisibles, podium Or/Argent/Bronze visuel sur le Top 3 pour chaque signal). Wording aligné `ui-writing-style.md`.
- T8 — Front grayout HUD : appliquer `isWorldReadOnly()` sur les CTAs mutants existants (`AttackCTA`, `ConstructionButton`, `TrainingDrawer`, `StrategyChangeButton`, `CaravanLaunchModal`, `DailyDutyClaim`). Tooltip « Monde terminé — consultation uniquement ». Inventaire exhaustif à dresser à l'étape 1 (Refinement).
- T9 — WS bindings : ajouter handler sur `world.status.changed` côté Pixi pour basculer en lecture seule sans rechargement quand `to === 'ENDED'`, invalider les caches mutables et afficher un toast.
- T10 — Smoke backend + tests Pixi + docs impact : `19-world-lifecycle.md` (UI livrée), `backend-modules.md` (endpoint).

## Points d'attention

- **Dépendance run 061** : ce run est inutile tant que `WorldFinalRankingSnapshot` n'existe pas en DB. Bien le séquencer après le merge de 061 — sinon T2 retourne du vide systématique et T7 ne peut pas être démo en QA IG.
- **Cohérence garde-fou front vs back** : le backend (run 061 helper `assertWorldWritable`) renvoie 403 sur monde ENDED. Le front grise les CTAs pour éviter l'aller-retour. Les deux doivent rester alignés sur la même source (`world.status`), sinon un joueur pourrait voir un bouton actif puis se prendre un 403 silencieux. Toute mutation ajoutée plus tard doit consommer `isWorldReadOnly` côté front.
- **Caches TanStack Query à invalider sur `world.status.changed` → ENDED** : `worldEntities`, `myVillages`, `myMemberships`, `rankings`, `dailyDuty`, `garrison`. Liste exhaustive à valider au refinement (sinon UI affiche des stale data pendant que tout est gelé serveur-side).
- **Consultation publique du Hall of fame** : la spec 19 § Questions ouvertes acte « Consultable indéfiniment depuis la fiche profil global, ou seulement pendant la phase `ENDED` ? Trancher au refinement ». Position par défaut MVP : consultable durant les 7j en `ENDED`, **inaccessible une fois `ARCHIVED`** (cohérent avec la spec 19 § `LOCKED → ENDED` qui acte « plus accessibles depuis l'UI » après archivage). À valider user étape 3.
- **Récompenses cosmétiques (titre/bannière/badge)** : hors scope explicite — la spec 19 § Questions ouvertes acte « Catalogue précis à définir avec le travail UI/UX. Pas bloquant. ». Un ticket dédié sera créé quand le catalogue UI sera tranché.
- **Tooltip texte** : aligner sur `ui-writing-style.md` (FR, registre médiéval-fantasy, court). Proposition : « Le monde est terminé. Plus d'action possible. »
- **Membres éliminés** : un membre éliminé (`villageCount = 0`) sur monde ENDED ne doit pas voir le CTA `Revenir` (run 052) — il doit voir le même état `ended` que les autres membres. À valider à l'étape 1.

## Hors scope explicite

- Récompenses cosmétiques permanentes (titre / bannière / badge profil) — catalogue UI à trancher dans un ticket dédié.
- Archivage destructeur à `endsAt + 7j` (purge entités joueur) — couvert par run [`065`](./065-feature-world-ended-archive-wipe.md).
- Snapshot leaderboard côté backend + helper `assertWorldWritable` côté mutations — couvert par run [`061`](./061-feature-world-ended-lifecycle.md).
- Notifications push « Monde terminé » — Phase 6 post-MVP (cf. roadmap).
- Statistiques personnelles cross-mondes (« Vainqueur de Avalon-3 » attaché au compte) — dépend du catalogue cosmétique, hors scope MVP de ce run.

## Liens détectés (préflight)

- À faire avant : [`061-feature-world-ended-lifecycle`](./061-feature-world-ended-lifecycle.md) — PLANNED, bloquant (snapshot leaderboard + helper read-only). Sans 061, T2 et T7 n'ont pas de source de vérité.
- À faire après : [`065-feature-world-ended-archive-wipe`](./065-feature-world-ended-archive-wipe.md) — PLANNED, ajoute `ARCHIVED` qui devra retirer le monde des listes publiques et purger les caches Pixi côté joueurs.
- Connexe (contexte) : [`052-feature-eliminated-player-rejoin-flow`](./archive/052-feature-eliminated-player-rejoin-flow.md) — DONE, pattern `WorldSessionGate` + écran « royaume perdu » à réutiliser pour la cohérence UX.
- Connexe (contexte) : [`051-feature-rankings-glory`](./archive/051-feature-rankings-glory.md) — DONE, le `FinalRankingsScreen` partage les composants du `RankingsScreen` live.
- Déjà résolu (archive) : aucun.
- Keywords scannés : `world-ended`, `monde-termine`, `read-only`, `leaderboard-final`, `hall-of-fame`, `archive`.
