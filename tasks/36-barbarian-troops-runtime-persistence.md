# 36 — Persistance runtime des troupes barbares + roll initial 60-100 %

🟠 **Majeur** — issue du [run 005](./runs/005-audit-barbarians.md). Spec amont : [`docs/gameplay/06-barbarians.md`](../docs/gameplay/06-barbarians.md) § Blueprint d'armée + § Génération.

## Contexte

Le run 005 a posé le **blueprint chiffré** des troupes barbares dans `packages/shared/src/world/barbarian-templates.ts` (champ `units: UnitMap` par tier — 15 / 35 / 70 / 110 / 150). Ces données sont aujourd'hui **purement statiques** : la factory `BarbarianVillageFactory` ne crée aucune entité runtime à partir de `getUnits(tier)`, et la stratégie de combat `BarbarianVillageStrategy` lit `lossesDefender = null` + `units: {}` pour le défenseur.

La spec demande explicitement un **roll initial de troupes à 60-100 % du max** par tier à la création du village barbare, indépendamment du roll ressources.

## État actuel

- `packages/shared/src/world/barbarian-templates.ts` : `getUnits(tier)` retourne le blueprint mais aucun consumer.
- `barbarian-village.factory.ts` : crée `Village`, `Building[]`, `ResourceStock`, `Population` — pas d'`ArmyUnit`.
- `barbarian-village.strategy.ts:19-20` : `lossesAttacker = {}` (MVP), `lossesDefender = null` ("Barbarians have no troops").

## Pistes à arbitrer

1. **Stockage** : table `ArmyUnit` (existante, multi-rows par villageId × type) **ou** champ JSON dénormalisé sur `Village` (équivalent du `units?` côté shared) ?
2. **Roll** : `Math.floor(units[type] × (0.6 + Math.random() × 0.4))` par type (proportions préservées), ou roll global 60-100 % puis re-distribution ? Spec dit "on roll la valeur totale puis on applique les % par type" → préférer le second.
3. **Population** : la spec dit "le joueur n'interagit pas avec les bâtiments directement" et "pas de puissance tant que barbare" — donc `Population.used` côté barbare doit-il refléter les unités ou rester à 0 ? Décision design : laisser à 0 (cohérent "pas de puissance") mais documenter.

## Cascades

- Débloque ticket #37 (régénération) — qui suppose des unités persistées à incrémenter.
- Débloque ticket #38 (combat barbare réel) — `BarbarianVillageStrategy` consomme les `units` du défenseur pour calculer les pertes attaquant.
- Impact scout (`spec 11-scouting.md`) : la mécanique de scout révèle déjà les troupes du défenseur ; sans persistance, le scout d'un barbare ne peut rien afficher.
- Impact rapport de combat (#39).

## Question ouverte

Faut-il batcher 36/37/38 dans un **chantier "barbares vivants"** unique (Phase 2) ou les livrer séquentiellement ? Hypothèse : 36+38 ensemble (couplage fort), 37 séparé (worker indépendant).
