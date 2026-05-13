# Run #020 — feature-units-stats-only-wire-defense-archetype

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors phase — régularisation issue de runs 003 (passifs déclarés data-only) et 004 (audit combat ayant constaté que `defenseCavalry`/`defenseArcher` ne sont pas consommés).
- **Spec source** : [`docs/gameplay/08-units.md`](../../docs/gameplay/08-units.md), [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md).
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

- [ ] `packages/shared/src/army/types.ts` : type `UnitPassive` supprimé, champ `passive` retiré de `UnitStats`.
- [ ] `packages/shared/src/army/unit.ts` : aucune des 10 unités ne déclare `passive`.
- [ ] `battleforthecrown-backend/src/modules/power/units-catalog.spec.ts` : fixtures attendues sans `passive`.
- [ ] `battleforthecrown-pixi/src/features/army/UnitDetailModal.tsx` : fonction `passiveFor`, imports `UnitPassive` + `TroopDetailPassive`, et prop `passive` passée à la modale design-system supprimés.
- [ ] `battleforthecrown-pixi/src/features/design-system/components/TroopDetailModal.tsx` : interface `TroopDetailPassive`, sous-composant `PassiveCard`, prop `passive` et son rendu supprimés.
- [ ] `battleforthecrown-pixi/src/features/design-system/components/index.ts` : export `TroopDetailPassive` retiré.
- [ ] `battleforthecrown-pixi/src/features/design-system/DesignSystemPreview.tsx` : fixture `passive` retiré.
- [ ] `battleforthecrown-pixi/src/features/design-system/components/TroopDetailModal.constants.ts` : entrée(s) liée(s) aux passifs retirée(s) si présente(s).
- [ ] `battleforthecrown-pixi/src/features/design-system/README.md` : mention(s) liée(s) aux passifs nettoyée(s) si présente(s).
- [ ] `docs/gameplay/08-units.md` : colonne « Passif » du tableau retirée, sous-section « Boucles de contre fortes » réécrite sans mention de passifs (ou supprimée si redondante avec les défenses), note 💡 sur passifs modérés supprimée.

Activation des défenses différenciées :

- [ ] `battleforthecrown-backend/src/modules/combat/combat-resolution.ts` : `sumDefensePower` sélectionne la stat défensive selon l'archétype de l'unité attaquante (mapping à confirmer à l'étape 3 — cf. Notes ci-dessous).
- [ ] Tests pure-logic combat couvrant la sélection de défense par archétype : (a) cavalerie attaquant archer → `defenseCavalry` consommée ; (b) infanterie attaquant archer → `defenseInfantry` consommée ; (c) archer attaquant templier → `defenseArcher` consommée.
- [ ] `docs/gameplay/04-combat.md` : ajout d'une mention explicite « la défense consommée dépend de l'archétype attaquant » + renvoi vers `08-units.md` pour les valeurs.

Filet :

- [ ] `yarn static-check` vert (TS strict + ESLint backend + pixi, sans warnings nouveaux).
- [ ] Tests backend `yarn workspace battleforthecrown-backend test` et pixi `yarn workspace battleforthecrown-pixi test` verts.
- [ ] Smoke combat backend (existant ou nouveau) couvrant un cas où la sélection par archétype change le résultat vs le comportement actuel `defenseInfantry`-only.

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

_(Vide au démarrage.)_

## Progress (rempli pendant le run)

_(Vide au démarrage.)_

## Décisions prises

_(Vide au démarrage.)_

## Rapport final

_(Vide au démarrage.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [ ] _(à remplir étape 10)_
- **Tests automatisés** : _(à remplir)_
- **Smokes ajoutés/modifiés** : _(à remplir)_
- **QA fonctionnelle agent** : _(à remplir)_
- **Tests IG à faire par le user** : _(à remplir)_
