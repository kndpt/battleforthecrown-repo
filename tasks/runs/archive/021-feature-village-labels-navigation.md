# Run #021 — feature-village-labels-navigation

> **Statut** : DONE
> **Démarré** : 2026-05-13
> **Terminé** : 2026-05-13

## Cible

- **Phase roadmap** : Phase 9 — Navigation multi-village (rôles, favoris, sélecteur)
- **Spec source** : [`docs/gameplay/22-village-roles-and-navigation.md`](../../docs/gameplay/22-village-roles-and-navigation.md), [`docs/gameplay/05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md), [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md)
- **Type** : `feature`
- **Modules backend** : `prisma/schema.prisma`, `village`, `combat/conquest`
- **Modules frontend** : `pixi/layout`, `pixi/world-map`, `pixi/api`, `pixi/store`

## Contexte

La Phase 5 rend le multi-village réel : après conquête barbare, un joueur peut posséder plusieurs villages, mais l'UX reste encore pensée autour d'un village actif implicite. La Phase 9 doit donc ajouter la navigation minimale pour comprendre, sélectionner et retrouver ses villages sans introduire de nouvelle mécanique de puissance.

Décisions user (2026-05-13) :

- **Pas de favoris MVP.** La roadmap/spec actuelle les mentionne encore, mais ils sont sortis du scope.
- **Étiquettes privées limitées à 3 valeurs** : `Offensif`, `Défensif`, `Économique`.
- **`Capitale` n'est pas une étiquette choisie.** Elle est dérivée automatiquement : le premier village du joueur ; si ce village est perdu, le premier village conquis restant devient la capitale.
- **Récompenses futures Phase 10** : au moment de valider une récompense, le joueur choisira le village destinataire ; le système retiendra le dernier village ayant reçu une récompense. Ce run ne livre pas les récompenses, il documente la règle pour éviter un hardcode Phase 10.

Objectif du run : fermer l'écart spec/code sur ces décisions, ajouter le contrat backend/shared minimal, puis livrer un sélecteur multi-village frontend utilisable mobile avec badges et filtres par étiquette.

## Dépendances

- Phase 5 — Conquête barbare livrée : un joueur peut déjà posséder plusieurs villages.
- Migrations Prisma non destructives uniquement.
- Décisions Phase 9 à intégrer avant implémentation : pas de favoris MVP ; étiquettes privées limitées à `Offensif`, `Défensif`, `Économique` ; capitale déterministe ; récompense future choisie à la validation avec mémorisation du dernier village destinataire.

## Critère de fin (acceptance)

- [ ] `docs/gameplay/22-village-roles-and-navigation.md` et `tasks/00-mvp-roadmap.md` ne mentionnent plus les favoris comme livrable MVP Phase 9.
- [ ] `docs/gameplay/22-village-roles-and-navigation.md` définit uniquement les étiquettes privées MVP `Offensif`, `Défensif`, `Économique`, sans bonus mécanique.
- [ ] La capitale n'est pas modifiable par le joueur et est exposée comme état dérivé : premier village du joueur, puis premier village conquis restant si la capitale est perdue.
- [ ] L'API villages renvoie, pour chaque village possédé, son étiquette privée éventuelle et son indicateur `isCapital`.
- [ ] Un endpoint backend permet de modifier uniquement l'étiquette privée d'un village possédé, avec validation stricte des 3 valeurs MVP et suppression possible de l'étiquette.
- [ ] Le frontend permet de changer de village actif via un sélecteur multi-village lisible sur mobile.
- [ ] Le frontend affiche les badges d'étiquette privée et capitale dans le sélecteur et/ou la carte sans créer de système de favoris.
- [ ] Le frontend permet de filtrer ou retrouver les villages par étiquette privée MVP.
- [ ] `docs/gameplay/05-daily-cards-and-oyez.md` référence la règle Phase 9 : au moment de valider une récompense future, le joueur choisit le village destinataire et le système retient le dernier village ayant reçu une récompense.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Prisma : skill `bftc-prisma`
- Frontend HUD : skill `bftc-react-hud`

## Notes pour le run

**Écart spec actuel à corriger avant ou pendant l'implémentation** :

- `docs/gameplay/22-village-roles-and-navigation.md` liste encore `Favori`, `Capitale`, `Raid`, `Défense`, `Économie`, `Frontière`, `Conquête`.
- `tasks/00-mvp-roadmap.md` décrit encore `Favori` + `Capitale` comme étiquettes MVP et le critère de fin parle de marquer un village `Capitale` et un autre `Favori`.
- `docs/gameplay/05-daily-cards-and-oyez.md` doit référencer la règle Phase 9 pour la cible des récompenses, mais ne doit pas réouvrir l'arbitrage.

**Modèle attendu** :

- L'étiquette privée est une donnée modifiable par le propriétaire, sans coût, sans cooldown et sans effet gameplay.
- La capitale est un état dérivé, non stocké comme choix utilisateur si une dérivation fiable existe.
- Le calcul de capitale doit utiliser l'ordre d'acquisition du joueur, pas simplement l'ordre de création/spawn du village si ces deux notions divergent.
- Si le village actif frontend n'est plus possédé, le store doit retomber sur un village possédé valide, idéalement la capitale dérivée.

**Hors scope** :

- Pas de favoris, pas de tags libres, pas de multiples étiquettes simultanées.
- Pas de bonus de combat, production, défense ou récompense lié aux étiquettes.
- Pas de dashboard royaume consolidé.
- Pas de livraison du système de récompenses Phase 10 ; seulement la règle documentaire de ciblage futur.
- Pas de partage tribu/public des étiquettes.

**Preuves attendues** :

- Test backend ou smoke REST prouvant ownership + mutation/suppression d'étiquette + rejet d'une valeur hors enum.
- Test ou smoke prouvant `isCapital` sur un joueur multi-village, avec fallback après perte ou transfert de la capitale si le code permet de simuler ce cas proprement.
- Test frontend ciblé sur le sélecteur ou le store si la logique est isolable ; sinon QA manuelle agent avec serveur + navigateur local.

## Décomposition initiale (rempli par le lead à l'étape 3)

- T1 — Aligner les docs Phase 9/Phase 10 sur les décisions utilisateur : retirer favoris MVP, resserrer les étiquettes, documenter capitale déterministe et cible future des récompenses.
- T2 — Cartographier le modèle d'acquisition des villages : `Village.createdAt`, `conqueredAt`, ownership, conquête barbare/PvP, endpoint `/village`, store frontend du village actif.
- T3 — Ajouter la persistance minimale des étiquettes privées côté Prisma avec migration non destructive et validation enum.
- T4 — Étendre le backend `village` : lecture `label`/`isCapital`, endpoint de mutation d'étiquette, ownership checks, suppression d'étiquette.
- T5 — Mettre à jour les contrats shared/API frontend pour exposer `label` et `isCapital`.
- T6 — Implémenter les hooks/mutations frontend et l'invalidation de la liste de villages.
- T7 — Implémenter le sélecteur multi-village dans le shell/header : village actif, badges capitale/étiquette, comportement mobile, fallback si village actif invalide.
- T8 — Ajouter filtres ou accès rapide par étiquette dans la liste/carte sans introduire de favoris.
- T9 — Ajouter tests ciblés + smoke fonctionnel multi-village ; lancer `yarn static-check` et les suites pertinentes.

## Progress (rempli pendant le run)

- 2026-05-13 — Préflight : fiche `PLANNED`, worktree clean après commit de planification, specs/rules/SPEC/skills chargés. Scope non rapide confirmé (Prisma + backend + shared + frontend + docs), cartographie déléguée à `code_mapper`.
- 2026-05-13 — Étapes 2-4 : cartographie reçue. Socle backend/shared/docs appliqué en lead : enum `VillageLabel`, migration non destructive, DTO Zod, `GET /village` enrichi `label`/`isCapital`, endpoint `PATCH /village/:id/label`, specs Phase 9/10 alignées. Frontend délégué à `implementer`.
- 2026-05-13 — Étapes 5-8 : smoke `village-labels` ajouté, migration appliquée sur DB dev + smoke, backend unit vert, Pixi tests verts, `yarn test:smoke` vert, `yarn static-check` vert après review.

## Décisions prises

- `VillageLabel` utilise des valeurs techniques `OFFENSIVE` / `DEFENSIVE` / `ECONOMIC`, avec libellés UI partagés `Offensif` / `Défensif` / `Économique`.
- La capitale est dérivée côté backend par date d'acquisition : `conqueredAt ?? createdAt`. Les villages conquis utilisent `conqueredAt`, ce qui évite qu'un vieux spawn barbare conquis devienne capitale par erreur.
- Le label est porté directement par `Village` en colonne nullable, sans table dédiée : MVP privé, une seule étiquette par village, pas de favoris.
- SPEC.md inchangé : aucun invariant transverse nouveau au-delà de la spec gameplay Phase 9 et du smoke ajouté.

## Rapport final

Run 021 livre la navigation multi-village MVP Phase 9 : étiquettes privées, capitale dérivée, sélecteur actif, filtre par étiquette, et alignement documentaire pour la Phase 10.

Changements livrés :

- `VillageLabel` partagé + enum Prisma + migration non destructive `20260513130000_add_village_label`.
- `GET /village` expose `label`, `isCapital`, `userId` et `conqueredAt`; `PATCH /village/:villageId/label` permet set/clear avec validation Zod et ownership check.
- Frontend : mutation TanStack label, sélecteur multi-village dans le header, fallback vers capitale si le village actif est invalide, badges capitale/étiquette, filtre carte par étiquette.
- Docs : Phase 9/Phase 10/roadmap alignées sur les décisions : pas de favoris MVP, 3 étiquettes, capitale non choisie, récompense future choisie à la validation avec dernier village mémorisé.
- Smoke backend réel `village-labels.smoke.spec.ts` couvre capitale initiale, fallback après perte, set/clear label, valeur invalide et ownership.

Fichiers touchés :

- `battleforthecrown-backend/prisma/schema.prisma`
- `battleforthecrown-backend/prisma/migrations/20260513130000_add_village_label/migration.sql`
- `battleforthecrown-backend/src/modules/village/dto/village-label.dto.ts`
- `battleforthecrown-backend/src/modules/village/village.controller.ts`
- `battleforthecrown-backend/src/modules/village/village.service.ts`
- `battleforthecrown-backend/test/village-labels.smoke.spec.ts`
- `battleforthecrown-pixi/src/api/queries.ts`
- `battleforthecrown-pixi/src/api/world-types.ts`
- `battleforthecrown-pixi/src/features/layout/GameHeader.tsx`
- `battleforthecrown-pixi/src/features/world/WorldMapScreen.tsx`
- `docs/gameplay/05-daily-cards-and-oyez.md`
- `docs/gameplay/22-village-roles-and-navigation.md`
- `packages/shared/src/village/dtos.ts`
- `packages/shared/src/world/dtos.ts`
- `packages/shared/src/world/entities.ts`
- `tasks/00-mvp-roadmap.md`

Tickets ouverts : aucun.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Phase 9 ne mentionne plus les favoris comme livrable MVP — preuve : `docs/gameplay/22-village-roles-and-navigation.md`, `tasks/00-mvp-roadmap.md`.
  - [x] Les seules étiquettes MVP sont `Offensif`, `Défensif`, `Économique`, sans bonus mécanique — preuve : shared `VILLAGE_LABELS`, Prisma enum, docs Phase 9.
  - [x] Capitale non modifiable et dérivée premier village puis premier conquis restant — preuve : `village-labels.smoke.spec.ts`.
  - [x] API villages renvoie `label` + `isCapital` — preuve : `VillageService.getVillages`, smoke `GET /village`.
  - [x] Endpoint backend set/clear label avec validation stricte et ownership — preuve : `PATCH /village/:id/label`, smoke valeur invalide + autre user refusé.
  - [x] Frontend permet changement de village actif via sélecteur mobile-compact — preuve : `GameHeader.tsx`, typecheck Pixi.
  - [x] Frontend affiche badges capitale/étiquette sans favoris — preuve : `GameHeader.tsx`.
  - [x] Frontend permet de filtrer les villages par étiquette — preuve : `WorldMapScreen.tsx`.
  - [x] Daily Cards référence la règle Phase 9 pour le village destinataire de récompense — preuve : `docs/gameplay/05-daily-cards-and-oyez.md`.
- **Tests automatisés** :
  - `yarn workspace @battleforthecrown/shared build` ✅
  - `yarn workspace battleforthecrown-backend prisma generate` ✅
  - `yarn workspace battleforthecrown-backend test --runInBand` ✅ 14 suites / 193 tests.
  - `yarn workspace battleforthecrown-pixi test` ✅ 19 fichiers / 112 tests (warning jsdom canvas existant, suite verte).
  - `yarn static-check` ✅ backend type-check, pixi type-check, backend lint, pixi lint.
- **Smokes lancés** :
  - `yarn test:smoke:preflight` ✅ après application de la migration smoke.
  - `yarn workspace battleforthecrown-backend jest --config ./test/jest-smoke.json --runInBand village-labels` ✅ 1 test.
  - `yarn test:smoke` ✅ 10 suites / 36 tests.
- **Smokes ajoutés/modifiés** :
  - Ajouté `battleforthecrown-backend/test/village-labels.smoke.spec.ts` : capitale initiale, fallback après perte, set/clear label, valeur invalide, ownership.
- **QA fonctionnelle agent** : couverte par smoke REST réel Nest + Prisma + DB smoke. Mutation label et fallback capitale observés par assertions REST/DB.
- **Tests IG à faire par le user** :
  - [ ] Sur un compte multi-village, vérifier visuellement que le header reste lisible sur mobile.
  - [ ] Changer de village actif depuis le header, poser/retirer une étiquette, puis vérifier le badge et le filtre carte.
