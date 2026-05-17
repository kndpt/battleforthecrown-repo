# 64 — Supprimer la table miroir `WorldEntity` devenue morte

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Source** : `tasks/archive/63-foreign-players-invisible-on-world-map.md`

## Contexte

`/world/:worldId/entities` lit maintenant les villages joueurs et barbares depuis la table canonique `Village`. La table `WorldEntity` reste dans Prisma pour compatibilité historique, mais aucune écriture lifecycle n'existe plus dans `src/`.

## Problème

Garder `WorldEntity` dans le modèle peut pousser un futur changement à réintroduire une écriture miroir fragile au lieu de consommer `Village`.

## Scope recommandé

- Vérifier qu'aucun runtime actif ne dépend encore de `world_entity`.
- Supprimer le model Prisma `WorldEntity` et la relation `World.worldEntities`.
- Ajouter une migration non destructive seulement si la table est confirmée vide ou si une stratégie de conservation est décidée.
- Retirer les lectures legacy `prisma.worldEntity.findMany` de `WorldEntitiesQueryService`.

## Critères de succès

- `WorldEntitiesQueryService` utilise uniquement les sources canoniques vivantes.
- Aucune régression sur les smokes vision/world map.
- Migration validée sans reset DB.
