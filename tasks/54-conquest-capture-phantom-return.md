# 54 — Retour fantôme pendant capture avec Seigneur

**Sévérité** : 🟡 Majeur  
**Statut** : 🆕 Ouvert  
**Spec amont** : [`docs/gameplay/10-conquest.md` § Devenir « Seigneur du village conquis »](../docs/gameplay/10-conquest.md#devenir--seigneur-du-village-conquis) + [`docs/gameplay/04-combat.md` § Mécanique générale](../docs/gameplay/04-combat.md#mécanique-générale)

## Symptôme

Quand une attaque avec Seigneur gagne le combat de pré-conquête et ouvre une fenêtre de capture, aucune troupe ne doit rentrer : le Seigneur et l'escorte survivante restent en garnison d'occupation sur le village cible.

Pourtant le frontend affiche un trajet retour sur la carte, avec le glyph `🐎`.

## Cause racine probable

Le frontend affiche ce retour parce que le backend lui donne un `returnAt`.

Dans `combat.worker.ts`, le flux capture survivante fait bien ceci :

- copie `resolution.survivingUnits` dans `returningUnits` ;
- ouvre `PendingConquest` si victoire + Seigneur survivant ;
- upsert chaque survivant dans `garrison` sur le village cible ;
- supprime chaque survivant de `returningUnits`.

Mais juste après, `returnAt` est encore calculé avec :

```ts
const returnAt =
  hasReturningUnits || hasReturningLoot
    ? new Date(Date.now() + expedition.outboundTravelMs)
    : null;
```

Donc si `returningUnits` est vide mais que `returningLoot` contient des ressources, l'expédition passe quand même en `RETURNING`, un job `combat:return` est planifié, et l'event `battle.resolved` porte un `returnAt`.

Côté frontend, `applyBattleResolved` suit ce contrat : si `payload.returnAt` existe, il bascule la snapshot en `RETURNING` après le flash de résolution. `ExpeditionVisual` affiche ensuite `🐎` pour un trajet retour. Le bug n'est donc pas un simple rendu Pixi ; il vient du contrat backend d'expédition retour.

## Comportement attendu

Sur victoire de pré-conquête avec Seigneur survivant :

- les survivants restent tous dans la garnison d'occupation ;
- aucun trajet retour visible n'est créé ;
- `Expedition.status` doit rester terminal/résolu sans `returnAt` ;
- aucun job `combat:return` ne doit être planifié ;
- `battle.resolved.returnAt` doit être `null` ;
- le loot ne doit pas créer à lui seul un retour sans troupe.

Sur victoire militaire où le Seigneur meurt :

- pas de fenêtre de capture ;
- l'escorte survivante rentre comme raid normal ;
- le loot rentre avec elle ;
- le trajet retour reste visible.

## Scope recommandé

### Backend

- Dans `combat.worker.ts`, distinguer explicitement le cas `captureWindowOpened`.
- Si une capture est ouverte avec Seigneur survivant :
  - forcer `returningLoot` à `0/0/0` ou empêcher `hasReturningLoot` de déclencher un retour ;
  - sauvegarder `loot` cohérent avec ce qui revient réellement ;
  - conserver `returnAt = null` quand `returningUnits` est vide.
- Ne pas masquer le symptôme côté frontend : le client doit continuer à suivre `battle.resolved.returnAt`.

### Tests

Ajouter ou compléter un smoke backend ciblé conquête :

1. Attaque barbare avec Seigneur survivant + loot potentiel.
2. Vérifier `PendingConquest.OPEN`.
3. Vérifier que l'escorte survivante est en `garrison` sur la cible.
4. Vérifier `Expedition.status = RESOLVED`, `returnAt = null`, `survivingUnits = {}`.
5. Vérifier aucun job `combat:return` planifié pour l'expédition.
6. Vérifier l'event `battle.resolved` avec `returnAt: null`.

Ajouter un test frontend seulement si le contrat event change. À contrat inchangé, les tests existants autour de `applyBattleResolved` couvrent déjà : `returnAt` absent => snapshot supprimée au lieu de passer `RETURNING`.

## Critères de succès

- Une capture avec Seigneur survivant n'affiche plus de cheval de retour sur la carte.
- Les troupes d'occupation restent visibles/prises en compte dans la garnison cible.
- Le retour normal continue de fonctionner pour un raid et pour le cas « Seigneur mort mais escorte survivante ».
- Le smoke conquête prouve le comportement avec vraie DB + Outbox + pg-boss.
