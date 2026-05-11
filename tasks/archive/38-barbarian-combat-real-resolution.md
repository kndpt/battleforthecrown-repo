# 38 — `BarbarianVillageStrategy` : résolution combat réelle

🟠 **Majeur** — issue conjointe des [run 004](./runs/archive/004-audit-combat.md) (écart #1-2 transmis) et [run 005](./runs/005-audit-barbarians.md). Spec amont : [`docs/gameplay/06-barbarians.md`](../docs/gameplay/06-barbarians.md) § Identité + [`docs/gameplay/04-combat.md`](../docs/gameplay/04-combat.md) (résolution générique).

## Contexte

Aujourd'hui `BarbarianVillageStrategy.resolve()` est un raccourci MVP :

```ts
const lossesAttacker: UnitMap = {};                  // pertes attaquant = 0
const lossesDefender: UnitMap | null = null;         // "Barbarians have no troops"
const survivingUnits = { ...context.attacker.units };
```

→ L'attaquant ne perd jamais rien en raidant un barbare. Aucune décision tactique réelle, contraire à l'identité spec : *"ce ne sont pas des coffres au trésor avec une étiquette de difficulté, ce sont des adversaires"*.

## État dépendant

- Le run 005 a posé le **blueprint chiffré** côté `barbarian-templates.ts` (data-only).
- Le ticket #36 doit livrer la **persistance runtime** des troupes barbares (table `ArmyUnit` ou JSON).
- Une fois #36 livré, `BarbarianVillageStrategy` lit `context.defender.units` et délègue à la résolution de combat générique (cf. spec 04, formules de pertes).

## Travail à faire

1. Une fois #36 livré, supprimer la branche stub `lossesAttacker = {}` / `lossesDefender = null` ; appeler la même résolution que `PlayerVillageStrategy` (probablement extraire un helper commun).
2. Vérifier que le loot reste calculé via `LootManager` (cohérent avec spec § Génération > stocks initiaux).
3. Cas limite : si `context.defender.units` est vide (village vidé par un raid précédent), `lossesAttacker = {}` reste valide — pas de combat, juste raid pur.

## Cascades

- Permet une vraie escalade de difficulté T1→T5 ressentie par le joueur.
- Brique nécessaire avant le ticket #39 (rapport asymétrique victoire/défaite).
- Aligne barbares et joueurs sur la même mécanique de combat — supprime un dual-mode actuellement source de drift.

## Bloqué par

- #36 (persistance troupes barbares).
