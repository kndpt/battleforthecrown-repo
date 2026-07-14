# 91 — Poids gameplay de la capitale dérivée

**Sévérité** : 🟢 Mineur (enhancement — aucune régression, la capitale dérivée fonctionne mais n'a aucun effet mécanique)
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/gameplay/lab/tickets/05-player-capital.md`](../docs/gameplay/lab/tickets/05-player-capital.md) (§ Piste, § Points à trancher) · contexte Phase 9 [`docs/gameplay/22-village-roles-and-navigation.md`](../docs/gameplay/22-village-roles-and-navigation.md) · contrainte [`tasks/00-mvp-roadmap.md`](./00-mvp-roadmap.md) L106,110

## Problème

Une notion de « capitale » existe déjà en jeu, mais elle est **purement cosmétique** : un badge, zéro poids gameplay.

- **Dérivée, pas choisie** : `getCapitalVillageId` (`battleforthecrown-backend/src/modules/village/village.service.ts:106-115`) trie les villages du joueur par `conqueredAt ?? createdAt` et renvoie le plus ancien. Aucun endpoint ne permet de la changer (`village.controller.ts` = `label` / `upgrade` / `cancel` / `strategy` uniquement).
- **Aucun effet mécanique** : `isCapital` est un booléen exposé au DTO villages, consommé seulement comme badge d'affichage (`GameHeader.tsx:330`, `VillageHero.tsx:185`, `multiVillageSheet.ts:41`). Perdre ou défendre sa capitale n'a aucune conséquence de jeu.
- **Aucune persistance** : pas de colonne capitale sur `Village` / `User` / `WorldMembership` (`prisma/schema.prisma`) — calcul à la volée.

Le lab ticket 05 pointe le manque : *« Le joueur manque d'un centre symbolique… Perdre ou défendre ce village devient naturellement important. »* Aujourd'hui ce centre n'existe que visuellement.

## Cause racine probable

Sans objet (feature additive). La capitale dérivée + badge a été livrée en Phase 9 (run archivé 021) sans jamais lui attacher de poids gameplay — c'était hors scope à l'époque.

## Comportement attendu

Décision à trancher, puis (si piste retenue) implémentation :

- La capitale **dérivée existante** (règle inchangée) porte un effet gameplay léger, server-authoritative, qui rend sa défense/perte signifiante **sans la rendre intouchable** (elle reste conquérable normalement).
- L'effet suit la capitale dérivée si celle-ci bascule (perte du 1er village, resettlement — cf. run 100).
- L'effet est **surfacé** au joueur : rapport de combat (la cible était la capitale, le bonus a joué) et/ou panneau / profil royaume.
- Aucun bonus sur les villages non-capitale (invariant : effet = neutre ailleurs).

## Contrainte dure

La partie « **capitale désignable par le joueur** » du lab ticket 05 (choisir/changer sa capitale avec cooldown/coût) **contredit une décision MVP tranchée** :

- `tasks/00-mvp-roadmap.md:110` — *« la capitale n'est PAS choisie par le joueur, elle est dérivée du premier village puis du premier village conquis restant si la capitale est prise. »*
- Idem run archivé `tasks/runs/archive/021-feature-village-labels-navigation.md:23,38`.

=> La désignation joueur est une **piste post-MVP**, à ne pas embarquer sans réouverture explicite de cette décision. Le scope par défaut respecte le modèle dérivé.

## Pistes

- **PISTE A (principale) — Poids gameplay sur la capitale dérivée.** Ne contredit aucune décision (la roadmap est muette sur un bonus de capitale ; les étiquettes Phase 9 sont « sans bonus mécanique » mais la capitale n'est pas une étiquette). Bonus défensif léger, configurable via `WorldConfig`, appliqué server-side au garrison du village capitale dans la résolution de combat, capitale recalculée à la résolution via `getCapitalVillageId`. Option prestige (module `power`) à spécifier ou écarter. **Scope MVP-safe.**
- **PISTE B (post-MVP) — Capitale désignable.** Endpoint dédié + colonne persistante `capitalVillageId` + cooldown/coût. **CONTREDIT roadmap L110** → hors scope sauf décision explicite.

Points à trancher (arbitrage user) :
1. Effet **cosmétique/prestige** ou **mécanique** (bonus défensif) ? Magnitude ?
2. Périmètre du bonus défensif : garrison propre du village capitale seul, ou aussi les renforts (participants) ?
3. Empilement (`stacking`) avec le `defenseBonus` de style stratégique (aujourd'hui `strategy.defenseBonus` et `config.combat.defenseBonus` sont exclusifs par participant dans `sumDefensePower`) — ordre d'application et impact équilibrage.
4. Interaction resettlement (run 100) : confirmer que le bonus suit la capitale dérivée mobile, pas un village figé.

## Scope recommandé

### Backend

- `modules/combat/combat-resolution.ts` (`sumDefensePower:124-154`) — point d'insertion du multiplicateur capitale (si piste A mécanique).
- `modules/combat/interfaces/combat-context.interface.ts` — enrichir `CombatContext.defender` d'un flag `isCapital`.
- `modules/combat/combat.service.ts` (chargement `targetVillage` l.422/531/1019) — calculer la capitale du `userId` défendeur via `getCapitalVillageId` (réutiliser, **ne pas dupliquer** la logique de tri).
- `modules/combat/combat-report.presenter.ts` — surfacer « capitale » + effet du bonus dans le rapport défenseur.
- `modules/village/village.service.ts:106-115` — source de vérité dérivée, à réutiliser telle quelle.

### Frontend

- Badge capitale déjà livré (`VillageHero.tsx:185`, `GameHeader.tsx:330`, `multiVillageSheet.ts:41`) — **ne pas re-planifier**, y adosser la mention du bonus.
- Panneau / profil royaume (UI dédiée évoquée par le ticket 05) — écran cible à localiser.

### Shared / Docs

- `packages/shared/src/world` — valeur du bonus capitale dans `WorldConfig` (comme `combat.defenseBonus`).
- `packages/shared/src/village` — formule pure du bonus (cohérente avec `getStrategyBonusValue`) si retenue.
- Promotion du lab ticket 05 vers une note canonique dans `22-village-roles-and-navigation.md` (décision de scope MVP vs post-MVP).

### Tests

- Unitaires purs sur la formule / le multiplicateur défensif.
- Bascule capitale dérivée (mono-village, perte du 1er village, resettlement) → le bonus suit.
- Non-régression : combats de villages non-capitale inchangés.

## Critères de succès

- [ ] Une piste est tranchée avec Kelvin (A mécanique / A prestige / B post-MVP) et les 4 points ci-dessus sont arbitrés.
- [ ] (Si piste A) le village capitale dérivé bénéficie d'un effet configurable `WorldConfig`, appliqué **server-side**, calculé à la résolution via `getCapitalVillageId` (aucun flag persistant, aucune duplication de tri).
- [ ] (Si piste A) le rapport de combat défenseur indique que la cible était la capitale et que le bonus a joué.
- [ ] La capitale reste **conquérable normalement** (pas d'intouchabilité).
- [ ] Le bonus suit la capitale dérivée après bascule (perte / resettlement) — test.
- [ ] Aucune régression sur les combats de villages non-capitale (effet neutre ailleurs).
- [ ] La décision de scope (dérivé MVP vs désignable post-MVP) est documentée dans `22-village-roles-and-navigation.md`.
