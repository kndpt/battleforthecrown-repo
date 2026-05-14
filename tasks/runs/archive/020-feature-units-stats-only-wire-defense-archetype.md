# Run #020 — feature-units-stats-only-wire-defense-archetype

> **Statut** : DONE
> **Démarré** : 2026-05-14
> **Terminé** : 2026-05-14

## Cible

- **Phase roadmap** : Hors phase — régularisation issue de runs 003 (passifs déclarés data-only) et 004 (audit combat ayant constaté que `defenseCavalry`/`defenseArcher` ne sont pas consommés).
- **Spec source** : [`docs/gameplay/08-units.md`](../../../docs/gameplay/08-units.md), [`docs/gameplay/04-combat.md`](../../../docs/gameplay/04-combat.md).
- **Type** : `refactor` + `feature` — suppression d'un système mocké (`UnitPassive`) et activation d'un système mocké (défense différenciée par archétype attaquant).
- **Modules backend** : `combat`, `power`.
- **Modules frontend** : `features/army`, `features/design-system`.

## Contexte

Deux systèmes encodent aujourd'hui la même information « unité X est forte/faible face à unité Y » :

1. **Passifs `attackVsUnits`** côté offensif (Écuyer +10 % vs Archer, Archer +10 % vs Milice/Guerrier). Déclarés data-only par run 003. Le résolveur de combat ne les lit nulle part.
2. **Défenses différenciées par archétype** côté défensif (`UnitStats.defenseInfantry/Cavalry/Archer`). Présentes dans le shared et affichées dans `UnitDetailModal`, mais `combat-resolution.ts:128` ne lit que `defenseInfantry` quel que soit l'attaquant.

Décision user (2026-05-13) : **conserver uniquement les défenses différenciées par archétype** et faire vivre cette mécanique dans le résolveur. Les passifs (les 6 `kind`s : `attackVsUnits`, `attackVsWall`, `attackOnRaid`, `defenseOnGarrison`, `aoeDamage`, `scout`) sont supprimés du gameplay, du code et de la doc. L'objectif est de réduire la surface conceptuelle à un seul levier de matchup, lisible côté joueur et alimenté par les stats déjà présentes.

> ⚠️ Effet de bord assumé : disparaissent aussi `attackVsWall` (Bélier vs Rempart — Wall désactivé MVP, sans regret), `defenseOnGarrison` (Templier bonus garnison), `attackOnRaid` (Guerrier bonus raid), `aoeDamage` (Catapulte zone), `scout` (Espion). L'Espion garde sa fonction scouting via la mission `SPY-only` (gérée par run 016, indépendante du champ `passive`).

## Dépendances

- Aucune. Tous les prérequis (catalogue shared figé, résolveur combat audité) sont déjà en place via runs 003 et 004.

## Critère de fin (acceptance)

Suppression des passifs :

- [x] `packages/shared/src/army/types.ts` : type `UnitPassive` supprimé, champ `passive` retiré de `UnitStats`.
- [x] `packages/shared/src/army/unit.ts` : aucune des 10 unités ne déclare `passive`.
- [x] `battleforthecrown-backend/src/modules/power/units-catalog.spec.ts` : fixtures attendues sans `passive`.
- [x] `battleforthecrown-pixi/src/features/army/UnitDetailModal.tsx` : fonction `passiveFor`, imports `UnitPassive` + `TroopDetailPassive`, et prop `passive` passée à la modale design-system supprimés.
- [x] `battleforthecrown-pixi/src/features/design-system/components/TroopDetailModal.tsx` : interface `TroopDetailPassive`, sous-composant `PassiveCard`, prop `passive` et son rendu supprimés.
- [x] `battleforthecrown-pixi/src/features/design-system/components/index.ts` : export `TroopDetailPassive` retiré.
- [x] `battleforthecrown-pixi/src/features/design-system/DesignSystemPreview.tsx` : fixture `passive` retiré.
- [x] `battleforthecrown-pixi/src/features/design-system/components/TroopDetailModal.constants.ts` : entrée(s) liée(s) aux passifs retirée(s) si présente(s).
- [x] `battleforthecrown-pixi/src/features/design-system/README.md` : mention(s) liée(s) aux passifs nettoyée(s) si présente(s).
- [x] `docs/gameplay/08-units.md` : colonne « Passif » du tableau retirée, sous-section « Boucles de contre fortes » réécrite sans mention de passifs (ou supprimée si redondante avec les défenses), note 💡 sur passifs modérés supprimée.

Activation des défenses différenciées :

- [x] `battleforthecrown-backend/src/modules/combat/combat-resolution.ts` : `sumDefensePower` sélectionne la stat défensive selon l'archétype de l'unité attaquante (mapping à confirmer à l'étape 3 — cf. Notes ci-dessous).
- [x] Tests pure-logic combat couvrant la sélection de défense par archétype : (a) cavalerie attaquant archer → `defenseCavalry` consommée ; (b) infanterie attaquant archer → `defenseInfantry` consommée ; (c) archer attaquant templier → `defenseArcher` consommée.
- [x] `docs/gameplay/04-combat.md` : ajout d'une mention explicite « la défense consommée dépend de l'archétype attaquant » + renvoi vers `08-units.md` pour les valeurs.

Filet :

- [x] `yarn static-check` vert (TS strict + ESLint backend + pixi, sans warnings nouveaux).
- [x] Tests backend `yarn workspace battleforthecrown-backend test` et pixi `yarn workspace battleforthecrown-pixi test` verts.
- [x] Smoke combat backend (existant ou nouveau) couvrant un cas où la sélection par archétype change le résultat vs le comportement actuel `defenseInfantry`-only.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Notes pour le run

**Mapping archétype attaquant → stat défensive consommée** (proposition à valider à l'étape 3) :

| Unité attaquante | Archétype | Stat défensive consommée |
| --- | --- | --- |
| MILITIA, SQUIRE, WARRIOR, TEMPLAR | Infanterie | `defenseInfantry` |
| CAVALRY *(non au catalogue actuel)* | Cavalerie | `defenseCavalry` |
| ARCHER | Tir à distance | `defenseArcher` |
| SPY | Scout | `defenseInfantry` *(scout-only, attaque négligeable)* |
| RAM, CATAPULT | Siège | `defenseInfantry` *(siège, pas d'archétype dédié)* |
| NOBLE | Conquête | `defenseInfantry` |

Source : `packages/shared/src/army/types.ts` (typage) + `08-units.md` (catalogue). Si l'étape 2 (cartographie) révèle qu'une unité cavalerie pure existe ou est prévue, ajuster le mapping. Sinon `defenseCavalry` reste utilisable et alimente le futur balance.

**Hors scope** :

- Aucun rééquilibrage de valeurs stat — on garde les valeurs actuelles, seul le routage change. Le rééquilibrage post-feature pourra être ouvert en ticket dédié si nécessaire.
- Aucune refonte des autres passifs (`attackVsWall`, `attackOnRaid`, `defenseOnGarrison`, `aoeDamage`, `scout`) — ils disparaissent en bloc avec le reste.
- Aucune migration DB — le catalogue shared est pure data côté code, aucun schema Prisma n'est touché.
- Aucun changement de l'interface `combat-strategy.interface.ts` ou des stratégies existantes (`barbarian-village.strategy.ts`, `player-village.strategy.ts`) sauf si la nouvelle fonction de défense l'exige.

## Décomposition initiale (rempli par le lead à l'étape 3)

- Shared : supprimer le type `UnitPassive`, le champ `UnitStats.passive`, et les déclarations `passive` du catalogue.
- Backend combat : router la défense consommée par archétype attaquant, avec pondération par puissance d'attaque pour les armées mixtes.
- Backend tests : adapter le catalogue, couvrir les trois routes défensives en pure logic, ajouter un smoke combat qui change réellement l'issue.
- Frontend/design-system : supprimer la carte passive et la prop associée de la modale de troupe.
- Docs : aligner `04-combat.md` et `08-units.md` sur le levier unique `defenseInfantry/Cavalry/Archer`.

## Progress (rempli pendant le run)

- Préflight, rules, specs et skills lus ; worktree initial clean.
- `UnitPassive` et tous les rendus/fixtures `passive` supprimés.
- Résolution combat branchée sur `defenseInfantry/Cavalry/Archer`.
- Tests unitaires et smoke combat ajoutés/modifiés.
- Docs gameplay mises à jour.
- Vérifications finales vertes.

## Décisions prises

- Mapping validé depuis la fiche : `CAVALRY` → `defenseCavalry`, `ARCHER` → `defenseArcher`, tous les autres attaquants → `defenseInfantry`.
- Armée mixte : défense effective pondérée par la puissance d'attaque de chaque archétype, pour éviter un choix arbitraire du premier ou du plus gros stack.
- Aucun rééquilibrage de valeurs stat pendant ce run.

## Rapport final

Run livré et archivé.

Changements principaux :

- Passifs supprimés du contrat shared, du catalogue, des tests catalogue, de la modale armée et du composant design-system.
- Défense différenciée activée dans `calculateCombatOutcome` via helpers purs `getDefenseStatForAttackerUnit`, `getDefenseStatWeights`, `getWeightedDefensePower`.
- Smoke ajouté : cavalerie attaquant 10 archers perd désormais contre `defenseCavalry` 20 ; avec l'ancien comportement `defenseInfantry` 6, l'attaquant aurait gagné.
- Docs `04-combat.md` et `08-units.md` alignées sur le système stats-only.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] `UnitPassive` et `UnitStats.passive` supprimés.
  - [x] Catalogue shared sans déclaration `passive`.
  - [x] UI `UnitDetailModal` et `TroopDetailModal` sans prop/carte passive.
  - [x] Docs gameplay sans colonne ni boucle de passifs.
  - [x] Résolution combat consomme la défense selon l'archétype attaquant.
  - [x] Smoke combat prouve un changement d'issue vs `defenseInfantry`-only.
- **Tests automatisés** :
  - `rtk yarn workspace @battleforthecrown/shared build` — vert.
  - `rtk yarn workspace battleforthecrown-backend test combat-resolution.spec.ts units-catalog.spec.ts` — 2 suites, 24 tests verts.
  - `rtk yarn workspace battleforthecrown-backend test` — 14 suites, 198 tests verts.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 rtk yarn workspace battleforthecrown-pixi test` — 22 suites, 124 tests verts.
  - `rtk yarn static-check` — vert.
- **Smokes lancés** :
  - `rtk yarn test:smoke:preflight` — vert.
  - `SMOKE_WORKERS=1 rtk yarn workspace battleforthecrown-backend test:smoke:run combat-attack.smoke.spec.ts --runInBand` — vert, 4 tests.
  - `rtk yarn workspace battleforthecrown-backend test:smoke:run` — vert, 22 suites, 38 tests.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/combat-attack.smoke.spec.ts` ajoute le scénario cavalerie vs archers, vérifiant payload, rapport et inventaire défenseur.
- **QA fonctionnelle agent** : couverte par smoke REST/worker réel sur `/combat/attack`, Outbox `battle.resolved`, `CombatReport`, `UnitInventory`.
- **Tests IG à faire par le user** : Aucun test IG nécessaire, raison : logique backend/data + suppression d'une carte UI passive vérifiées par type-check, tests Pixi et static-check ; pas de nouveau parcours visuel interactif.
