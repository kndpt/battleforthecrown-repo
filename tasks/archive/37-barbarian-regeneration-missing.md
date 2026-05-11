# 37 — Régénération barbare (troupes + ressources) absente

🟠 **Majeur** — issue du [run 005](./runs/005-audit-barbarians.md). Spec amont : [`docs/gameplay/06-barbarians.md`](../docs/gameplay/06-barbarians.md) § Régénération.

## Contexte

La spec § Régénération définit deux flux indépendants côté villages barbares :

- **Troupes** : T1 = 0,5 %/h, T2 ≈ 0,6 %, T3 ≈ 0,75 %, T4 ≈ 0,9 %, T5 = 1 %/h du max initial.
- **Ressources** : T1 = 1 %/h, T2 ≈ 1,25 %, T3 ≈ 1,5 %, T4 ≈ 1,75 %, T5 = 2 %/h du cap.

🎯 Intention design : un village barbare vidé devient **farmable bien avant** de redevenir militairement dangereux — créer une rotation vivante de cibles.

## État actuel

Grep `regen|regenerate|tick` côté `world/` et `combat/` : **aucun mécanisme**. `ProductionWorker` ne distingue pas les villages barbares (il tourne sur tous les `Village`, mais les barbares n'ont pas de `Building` qui produit côté joueur — à vérifier que ses calculs ne s'appliquent pas mal).

Aucun worker pg-boss dédié, aucune logique lazy-on-read côté `combat.service` ou `scout`.

## Décisions design à trancher

1. **Worker pg-boss périodique** vs **lazy-on-read** (au scout / à l'attaque) ?
   - Worker : plus simple à raisonner, charge serveur prévisible, mais work pour rien sur les barbares jamais visités.
   - Lazy : zéro charge sur les villages oubliés, mais complexifie chaque code path qui lit l'état (combat, scout, fetch carte). Risque drift.
   - **Hypothèse recommandée** : lazy-on-read avec `lastRegenTs` sur `Village` côté barbare. Cohérent avec le pattern `lastUpdateTs` de `ResourceStock` joueur (ProductionWorker = catchup, pas calcul live).

2. **Stockage des chiffres** : ajouter `regenTroopsPerHour: number` et `regenResourcesPerHour: number` à `TierTemplate` shared, ou les calculer via formule ? Spec donne les bornes T1=0,5/T5=1 et T1=1/T5=2 — interpolation linéaire suffisante pour T2-T4.

3. **Cap de régénération** : la spec impose un plafond au max initial (troupes) et au cap stockage (ressources). Pas de re-roll, pas de dépassement.

## Dépendances

- Bloqué par ticket #36 (persistance runtime des troupes — impossible de régénérer ce qui n'existe pas).
- Indépendant côté ressources : `ResourceStock` existe déjà sur les villages barbares.

## Question ouverte

Si lazy-on-read retenu, vérifier que le scout (`spec 11`) trigger bien le catchup avant de retourner la photo — sinon le scout devient menteur.
