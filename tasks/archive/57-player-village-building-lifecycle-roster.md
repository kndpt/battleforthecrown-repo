# 57 — Source canonique du lifecycle des bâtiments joueur

**Sévérité** : 🟡 Majeure  
**Statut** : ✅ DONE (2026-05-14)

## Problème

Ajouter un nouveau bâtiment activé est aujourd'hui plus large qu'un simple ajout dans `BUILDING_TYPES` / `BUILDING_DEFINITIONS`.

Il faut aussi décider :

- comment il est créé pour un nouveau village joueur ;
- comment il apparaît après conquête d'un village barbare ;
- comment les villages déjà existants en DB reçoivent la nouvelle row.

Si ces décisions restent réparties entre `JoinWorldUseCase`, `ConquestService`, tests, et migrations ponctuelles, on recrée le même risque d'oubli que le ticket 55 : un bâtiment existe dans le catalogue mais pas dans certains villages.

## Cause racine

Le roster de bâtiments d'un village joueur n'est pas une source métier canonique.

Aujourd'hui :

- `JoinWorldUseCase.INITIAL_BUILDINGS` définit les rows créées au join ;
- `ConquestService` définit séparément les bâtiments matérialisés après conquête ;
- les backfills historiques sont des migrations ad hoc ;
- la documentation architecture mentionne l'invariant, mais le code ne force pas encore une décision complète à chaque nouveau bâtiment activé.

## Objectif

Créer une source canonique de lifecycle des bâtiments joueur, consommée par les flows de création et de conquête.

Exemple d'intention :

```ts
{
  type: BUILDING_TYPES.WATCHTOWER,
  initialPlayerLevel: 0,
  barbarianConquest: 'unbuilt',
}
```

Cette source doit exprimer une décision métier, pas masquer le problème par une dérivation trop magique depuis tous les `BUILDING_TYPES`.

## Scope recommandé

### Backend / shared

1. Créer une source canonique typée du roster des bâtiments joueur.
2. Faire consommer cette source par `JoinWorldUseCase`.
3. Faire consommer cette source par `ConquestService`.
4. Garder les bâtiments désactivés (`WALL`, `HIDEOUT`) explicitement hors roster joueur.
5. Ajouter un test qui échoue si un bâtiment activé n'a pas de politique lifecycle.
6. Ajouter un test qui prouve que join et conquête couvrent le même roster, avec des niveaux adaptés au contexte.

### Données existantes

Documenter explicitement que l'ajout d'un nouveau bâtiment activé implique une décision de backfill pour les villages déjà créés :

- migration/backfill non destructif ;
- ou exclusion assumée des villages existants ;
- ou autre mécanisme volontaire, mais jamais implicite.

### Documentation architecture

Mettre à jour `docs/architecture/` pour documenter ce sujet comme une règle durable :

- où vit la source canonique du lifecycle ;
- quel flow la consomme (`JoinWorldUseCase`, `ConquestService`) ;
- quelle décision est obligatoire pour les villages déjà existants ;
- pourquoi `GET /village/buildings` ne doit pas synthétiser silencieusement des bâtiments manquants.

## Critères de succès

- Un nouveau bâtiment activé sans entrée lifecycle fait échouer un test.
- `JoinWorldUseCase` ne maintient plus une liste indépendante oubliable.
- `ConquestService` ne maintient plus une liste indépendante oubliable.
- Les bâtiments activés mais non matérialisés après conquête sont créés en `level 0` selon la politique canonique.
- La documentation `docs/architecture/` explique clairement la règle et la décision de backfill historique.
