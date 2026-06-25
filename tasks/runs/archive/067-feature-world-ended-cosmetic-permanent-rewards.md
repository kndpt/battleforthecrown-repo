# Run #067 — world-ended-cosmetic-permanent-rewards

> **Statut** : DONE
> **Démarré** : 2026-06-24
> **Terminé** : 2026-06-24

## Cible

- **Phase roadmap** : Phase 11 — World lifecycle (`tasks/00-mvp-roadmap.md` § Phase 11)
- **Spec source** :
  - `docs/gameplay/19-world-lifecycle.md` § `LOCKED → ENDED` (ligne 105) + § « Wipe et récompenses fin de monde » (lignes 109-121) — partie « Récompenses cosmétiques permanentes » uniquement
  - `docs/gameplay/24-rankings.md` § « Rewards » (lignes 117-129) — cosmétiques par défaut, pas de bonus économique
- **Type** : feature
- **Modules** :
  - backend `workers/world-lifecycle.worker.ts`, `modules/rankings`, `modules/user` (ou nouveau `modules/cosmetic`), `prisma/schema.prisma` + migration
  - shared `packages/shared/src/rankings/` ou nouveau `packages/shared/src/cosmetic/` (type CosmeticAward + libellés)
  - frontend `battleforthecrown-pixi/src/features/layout/PlayerProfileSheet.tsx` + queries TanStack (profile sheet expose les awards globaux du joueur)

## Dépendances

- Run [`061-feature-world-ended-lifecycle`](061-feature-world-ended-lifecycle.md) — PLANNED. Livre la transition `LOCKED → ENDED` + le `WorldFinalRankingSnapshot` qui sert de source unique à l'attribution. Ce run consomme le snapshot pour calculer les bénéficiaires des awards et **doit être démarré après que 061 soit DONE** (snapshot disponible). Si l'ordre s'inverse, l'attribution peut s'appuyer sur les classements live en repli — à trancher au refinement.
- Run [`051-feature-rankings-glory`](archive/051-feature-rankings-glory.md) — DONE. A livré les 3 classements runtime (Puissance du Royaume + Gloire d'Assaut + Gloire du Rempart). Source des bénéficiaires top 1.

## Contexte

La spec 19 § Wipe acte MVP : à `ENDED`, tout le royaume du joueur (villages, bâtiments, armée, ressources, couronnes) est wipe, **mais les récompenses cosmétiques sont permanentes** et attachées au compte global. Run 061 livre la transition + snapshot leaderboard mais déclare cette feature explicitement hors scope (« Catalogue précis à définir avec le travail UI/UX. Pas bloquant. »). Aucune table cosmetic n'existe en DB, aucun endpoint d'exposition des awards globaux d'un joueur, et la `PlayerProfileSheet` n'affiche pas la collection. Conséquence : à la première fin de monde MVP, les vainqueurs n'ont aucune trace permanente — la promesse spec « titre du monde, bannière, badge profil » est cassée.

## Critère de fin (acceptance)

- [ ] Migration Prisma crée `UserWorldCosmeticAward` (ou équivalent) avec au minimum : `id`, `userId` (FK User), `worldId` (FK World), `kind` (enum `POWER_CHAMPION_TITLE` | `ASSAULT_CHAMPION_TITLE` | `RAMPART_CHAMPION_TITLE`), `worldDisplayName` (snapshot du nom de monde lisible au moment de l'attribution, immutable), `awardedAt`. Unique `(userId, worldId, kind)`, index `(userId)` pour la lecture profil.
- [ ] À la transition `LOCKED → ENDED` dans `WorldLifecycleWorker.transitionWorld`, **après** snapshot leaderboard (run 061) et **dans la même transaction Prisma**, le service d'awards attribue les 3 titres au top 1 (`rank = 1`) de chaque signal (`POWER`, `ASSAULT_GLORY`, `RAMPART_GLORY`) via `WorldFinalRankingSnapshot`.
- [ ] Tiebreaker : si plusieurs joueurs partagent `rank = 1` sur un signal, tous reçoivent l'award (no exclusion). Tiebreaker du snapshot 061 considéré stable.
- [ ] Score `0` : un joueur classé `rank = 1` avec `score = 0` ne reçoit **pas** d'award (cas d'un monde sans aucune activité PvP pour Assaut/Rempart). POWER reste attribué car la puissance du royaume reste > 0 par construction (existence d'au moins un Château).
- [ ] Échec de l'attribution ⇒ rollback transactionnel de la transition (jamais de monde ENDED sans awards calculés, même si 0 award attribué).
- [ ] Idempotence : second run du worker ne dédouble pas les awards (contrainte unique côté DB protège).
- [ ] Endpoint `GET /users/me/cosmetic-awards` retourne la liste des awards du joueur connecté, triée `awardedAt DESC`, avec `worldDisplayName` + `kind` + `awardedAt`.
- [ ] Le wipe destructeur successeur (run 065 — `world-ended-archive-wipe`) ne supprime **pas** la table `UserWorldCosmeticAward` (cosmétiques permanents par construction).
- [ ] Frontend `PlayerProfileSheet` affiche les awards du joueur sous forme de badges/lignes avec libellés FR (`Vainqueur de <worldDisplayName>`, `Conquérant de <worldDisplayName>`, `Sentinelle de <worldDisplayName>`). Vide → section masquée ou état neutre lisible.
- [ ] Catalogue libellés FR centralisé dans `packages/shared/src/cosmetic/` (ou rankings) avec mapping `kind → libellé`.
- [ ] Smoke backend : fast-forward d'un monde avec scoring PvP, transition à ENDED, assert 3 awards créés en DB + endpoint `/users/me/cosmetic-awards` retourne 200 + 3 entrées pour les top 1.
- [ ] Unit pure-logic (Vitest, ≥ 1) sur la résolution top-1-par-signal depuis un snapshot, incluant les cas tie + score=0.
- [ ] `yarn static-check` + `yarn test:backend` + `yarn test:pixi` verts.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`, `bftc-react-hud`

## Décomposition initiale

_(Lead étape 3 — tâches ≤ 5 fichiers)_

- T1 — Migration Prisma : modèle `UserWorldCosmeticAward` + enum `CosmeticAwardKind` + unique + index + `prisma generate`.
- T2 — Shared `packages/shared/src/cosmetic/` (ou rankings) : type `CosmeticAwardKind`, type `CosmeticAwardResponse`, libellés FR centralisés (`COSMETIC_AWARD_LABELS`).
- T3 — Backend `CosmeticAwardService.awardChampionsForWorld(tx, worldId)` : lit `WorldFinalRankingSnapshot` (run 061), filtre `rank = 1` + score > 0 (sauf POWER), batch `createMany` dans la tx fournie. Unit test sur résolution + tiebreaker + score 0.
- T4 — Câblage worker : `WorldLifecycleWorker.transitionWorld` (LOCKED→ENDED) appelle `cosmeticAwards.awardChampionsForWorld(tx, worldId)` **après** `rankings.snapshotFinalRankings`, même `$transaction`. Outbox enrichi (event `world.cosmetic-awards-attributed` optionnel — utilité limitée puisque consommé via REST côté front).
- T5 — Endpoint REST `GET /users/me/cosmetic-awards` + DTO + query TanStack côté front. Auth requise (`@JwtAuthGuard`).
- T6 — Frontend `PlayerProfileSheet` : section « Récompenses » affichant les awards (badge + libellé + nom de monde + date). Vide → section masquée.
- T7 — Smoke backend dédié + doc impact (`docs/architecture/data-model.md` mention table + `docs/gameplay/19-world-lifecycle.md` § Wipe ↔ pointer vers ce run pour le « comment » ; `docs/gameplay/24-rankings.md` § Rewards confirmer mapping libellés FR).

## Points d'attention

- **Wipe préserve les awards** : run 065 (wipe destructeur) doit explicitement exclure `UserWorldCosmeticAward` de sa purge. À documenter clairement dans le run 065 quand il sera démarré.
- **`worldDisplayName` snapshotté** : la spec attache l'award au compte global ; si le monde est purgé/renommé après archive, le libellé doit rester lisible. Snapshot du `world.identity.displayName` au moment de l'attribution, jamais relu après.
- **Score = 0 sur Assaut/Rempart** : un monde MVP avec très peu de PvP peut avoir un top 1 à 0 points sur ces signaux. Ne pas distribuer un titre vide (« Conquérant d'Avalon » au joueur qui n'a tué personne) — exclusion explicite via filtre score > 0. POWER reste distribué car ≥ 1 château implique score > 0.
- **Tiebreaker rank 1** : la spec ne tranche pas. Décision : si plusieurs joueurs partagent rank 1, tous reçoivent l'award (no exclusion). Cohérent avec « pas de duplicate snobism » — un partage triomphal reste un triomphe.
- **Bannière + badge profil** : la spec 19 cite « titre, bannière, badge profil ». Ce run livre **uniquement les titres** (catalog minimal). Bannière / badge profil dépendent d'assets UI à designer — successeur dédié quand le catalog visuel sera fourni. Documenter cette restriction en hors scope explicite.
- **Idempotence vs replay worker** : la contrainte unique `(userId, worldId, kind)` protège. Si le worker rejoue (pg-boss retry), la deuxième tentative `createMany skipDuplicates` (ou catch unique violation) doit être no-op silencieux.
- **Affichage profil mobile** : si un joueur a 10+ awards, la section ne doit pas exploser la sheet. Limite visuelle (5 derniers + « voir tout ») ou scroll local — à trancher au refinement avec le designer.

## Hors scope explicite

- **Bannière du monde + badge profil global** : assets UI non encore designés. Ce run livre uniquement la mécanique d'attribution + le libellé textuel (titre). Successeur dédié quand le catalog visuel sera fourni par UI/UX.
- **Bonus mécanique attaché aux awards** : la spec 24 § Rewards est explicite — cosmétiques par défaut, jamais de couronnes / production / attaque / défense. Ce run respecte la règle ; tout reward économique reste hors scope (et explicitement banni par spec).
- **Affichage public des awards d'un autre joueur** (ex : sur la fiche scout, dans le rapport de combat) : MVP livre la consultation par le propriétaire uniquement. Visibilité publique = follow-up post-MVP quand l'aspect social sera priorisé.
- **Catalogue de titres au-delà des 3 champions top 1** : pas de titres pour rank 2/3, pas de titres thématiques par activité (« Architecte », « Pillard »…). 3 awards par monde maximum (1 par signal × 1 top 1 par signal, sauf ties).
- **Cycle court hebdomadaire** : les awards de fin de cycle hebdo (titre temporaire) listés dans spec 24 § Rewards restent hors scope — ce run cible uniquement la **fin de monde** (ENDED). Le cycle hebdo demande sa propre fiche si priorité.

## Liens détectés (préflight)

- **À faire avant** :
  - [`061-feature-world-ended-lifecycle`](061-feature-world-ended-lifecycle.md) — PLANNED, livre `WorldFinalRankingSnapshot` qui est la source de ce run. Ce run **doit attendre** 061 DONE.
- **À faire après** :
  - Ticket post-MVP « bannière + badge profil visuels » quand assets UI designés.
  - Ticket post-MVP « affichage public des awards d'un joueur » (scout / rapport / leaderboard).
- **Connexe (contexte)** :
  - [`065-feature-world-ended-archive-wipe`](065-feature-world-ended-archive-wipe.md) — doit explicitement préserver la table `UserWorldCosmeticAward` lors du wipe destructeur.
  - [`066-feature-world-ended-readonly-ui`](066-feature-world-ended-readonly-ui.md) — UI front « monde terminé » qui peut afficher les vainqueurs (consomme le snapshot, distinct des awards persistants côté profil).
- **Doublon** : aucun. Run 061 mentionne le sujet en « hors scope » → ce run est la fiche dédiée annoncée.
- **Déjà résolu** : non. Ticket archivé `tasks/archive/12-rankings-rewards-undefined.md` avait posé les rewards économiques (1500/1000/500 couronnes) qui sont **supersédés** par spec 24 (cosmétiques uniquement) — ce run respecte la nouvelle direction.
- **Keywords scannés** : `cosmetic`, `cosmétique`, `titre`, `world-title`, `champion`, `vainqueur`, `award`, `badge`, `bannière`, `wipe-preserve`, `ended-rewards`, `permanent-reward`.

## Rapport final

Synthèse : table `UserWorldCosmeticAward` + enum `CosmeticAwardKind` ; attribution des 3 titres top-1 (POWER/ASSAULT/RAMPART) dans la `$transaction` de transition LOCKED→ENDED, après le snapshot 061 ; endpoint `GET /users/me/cosmetic-awards` + section « Récompenses » sur le profil (libellés FR shared). _(détail = git history)_

Décision assumée : POWER exempté du filtre `score > 0` (par construction `score > 0` dès ≥ 1 château, cf. critère ticket) ; Cascade FK World conservée (run 065 ne hard-delete jamais la ligne World, donc permanence préservée).

### Acceptance & QA

- [x] Migration `UserWorldCosmeticAward` (champs/unique `(userId,worldId,kind)`/index `(userId)`) — `cat prisma/migrations/20260624100925_*/migration.sql` → enum + table + 2 index + 2 FK créés.
- [x] Attribution top-1/signal après snapshot, même `$transaction` — `world-lifecycle.worker.ts:291-303` → `awardChampionsForWorld(tx,…)` entre `snapshotFinalRankings` et `creditRankingBonuses`.
- [x] Tiebreaker rank-1 → tous awardés (vacant : 061 casse les ex æquo) + score 0 sauf POWER — `vitest run packages/shared/src/cosmetic/resolve.spec.ts` → 5/5 (cas (b) score 0, (c) tie, (e) répartition).
- [x] Idempotence replay worker — smoke 5d (`unique` + `createMany skipDuplicates`) → count stable à 3 après 2ᵉ tick.
- [x] `GET /users/me/cosmetic-awards` trié `awardedAt DESC`, caller-only — smoke 5b/5c → Alice 3 entrées, Bob 0, `200`.
- [x] Frontend badges libellés FR + section masquée si vide — `PlayerProfileSheet.tsx` (`awards.length > 0`) + `buildProfileAwards` → libellés `Vainqueur/Conquérant/Sentinelle de <monde>`.
- [x] Wipe 065 préserve la table — documenté (`data-model.md`, `19-world-lifecycle.md`) ; code de purge = run 065 à venir.
- **Review indépendante** : Déclenchée (back+front + invariant durable + diff ~700 l). Verdict `GO` — 0 bloquant, 0 majeur, 4 mineurs (edge dégénéré + nits non-fonctionnels, hors scope ticket).
- **Tests automatisés** : `yarn static-check` ✅ ; `yarn test:backend` ✅ 508/508 ; `yarn test:pixi` ✅ 784/784 ; `vitest resolve.spec` ✅ 5/5.
- **Smokes lancés** : Ciblés — `test:smoke:run -- cosmetic-awards` ✅ (1/1) ; régression `world-ended-lifecycle world-final-rankings` ✅ (2/2). Backend touché (worker/module) → ciblé suffisant ; full smoke couvert par CI PR.
- **Smokes ajoutés** : `test/cosmetic-awards.smoke.spec.ts` — fast-forward ENDED, 3 awards DB, endpoint 200×3 + 0 (Bob), idempotence.
- **QA fonctionnelle agent** : couverte par smoke (transition worker + endpoint REST réel).
- **Tests IG à faire par le user** : checklist FR ci-dessous (rendu visuel profil).
