# 68 — Renvoyer un renfort étranger ne produit aucun trajet retour sur la WorldMap

**Sévérité** : 🟡 Majeur
**Statut** : ✅ Résolu
**Spec amont** : [`docs/gameplay/04-combat.md`](../docs/gameplay/04-combat.md) § Renforts entre ses propres villages — la spec décrit `Rappeler` (depuis l'origine) et `Renvoyer` (depuis l'hôte) comme déclenchant tous deux un trajet retour visible vers le village d'origine.

## Symptôme

Depuis `/game/army`, cliquer **« Renvoyer »** sur un renfort présent (troupes appartenant à un autre joueur qui m'ont renforcé) :

- Aucun trajet retour n'apparaît sur la WorldMap.
- Aucun trajet n'apparaît sur la mini-carte.
- Probablement précédé du toast frontend `"Impossible de rappeler ce renfort pour le moment."` (cf. `ArmyScreen.tsx:313`).

Le cas symétrique « Rappeler » depuis le village d'origine fonctionne correctement.

## Cause racine

`CombatService.initiateRecall` (`battleforthecrown-backend/src/modules/combat/combat.service.ts:351-358`) valide l'ownership sur `dto.originVillageId` :

```ts
const originVillage = await tx.village.findFirst({
  where: { id: dto.originVillageId, userId },
});
if (!originVillage) throw new NotFoundException(...);
```

Pour l'action **Renvoyer** d'un renfort étranger, l'origine appartient à un autre joueur. La requête retourne `null` → `NotFoundException` → aucune `Expedition` REINFORCE créée → aucun event Outbox `reinforcement.recalled` émis → le store frontend `useExpeditionsStore` n'est jamais hydraté → la WorldMap n'a rien à rendre.

Le bon pivot d'autorisation pour Renvoyer est l'ownership de l'**hôte** (`dto.villageId`), pas de l'origine. Le service doit accepter l'une ou l'autre des deux directions.

Le run 010 a coché la case « Renvoyer » en se basant sur le smoke `recall` (`test/reinforcements.smoke.spec.ts:154`) qui ne couvre que le cas owner-de-l'origine → bug passé sous le radar.

## Comportement attendu

- [ ] `POST /combat/recall` accepte une requête où l'user possède soit `villageId` (Renvoyer depuis l'hôte) soit `originVillageId` (Rappeler depuis l'origine).
- [ ] Une `Expedition` REINFORCE est créée avec `attackerVillageId = hôte`, `target = village d'origine étranger`, `status = EN_ROUTE`.
- [ ] L'event WS `reinforcement.recalled` arrive au client qui a cliqué, hydrate `useExpeditionsStore`.
- [ ] Un trajet REINFORCE est visible sur la WorldMap (`/game/world`) et la mini-carte jusqu'à l'arrivée.
- [ ] Le cas « Rappeler depuis l'origine » continue de fonctionner (pas de régression du smoke existant).
- [ ] Un user qui ne possède **ni** l'hôte **ni** l'origine reste rejeté (auth 403/404 conservée).

## Piste retenue

**A — Pivot d'auth élargi sur l'endpoint unique**

Conserver `POST /combat/recall`, modifier `initiateRecall` pour accepter les deux pivots d'auth : "l'user doit posséder soit `villageId` (Renvoyer depuis l'hôte) soit `originVillageId` (Rappeler depuis l'origine)".

Le reste de la logique (création expedition, event Outbox, worker `combat:resolve`) est inchangé. Le frontend n'a aucune modification à faire.

Piste B (split en deux endpoints `/recall` et `/send-back`) écartée — surface API élargie sans gain sémantique.

## Scope recommandé

### Backend
- `battleforthecrown-backend/src/modules/combat/combat.service.ts` — `initiateRecall:351-358` : refondre la branche d'auth pour accepter les deux pivots. Choisir `ForbiddenException` (403) plutôt que `NotFoundException` (404) quand ni hôte ni origine ne sont owned.

### Tests
- `battleforthecrown-backend/test/reinforcements.smoke.spec.ts` — ajouter un scénario **« Renvoyer un renfort étranger depuis l'hôte »** : userB renforce userA, puis userA clique Renvoyer ; vérifier la création de l'`Expedition` REINFORCE retour, l'event `reinforcement.recalled` ciblé sur userA, et l'arrivée au village d'origine.

### Frontend
- Aucun changement — `ArmyScreen.tsx`, `useRecallReinforcementMutation`, `applyReinforcementRecalled`, `useExpeditionsStore`, `WorldMapCanvas`, `WorldMiniMap` sont déjà câblés correctement.

### Docs
- Aucun. La spec gameplay décrit déjà le comportement attendu, aucune décision archi nouvelle.

## Points d'attention

- **Reproduction QA** : confirmer que le bug se manifeste sur un renfort **étranger**. Si le user observe le bug même sur un renfort inter-villages du même user (origine et hôte appartenant au même user), creuser une seconde piste (rendu carte / event manquant / filtre store) — improbable mais à éliminer.
- **Notification Outbox** : `notifyReinforcementRecalled` cible aujourd'hui `getUserIdByVillage(payload.villageId)` = owner de l'hôte. Sur Renvoyer, c'est correct (= user qui a cliqué). Évaluer si l'owner de l'origine doit aussi être notifié (ses unités reviennent chez lui sans qu'il ait cliqué).
- **Code d'erreur** : passer de `NotFoundException` à `ForbiddenException` quand l'auth échoue (sémantiquement plus correct, et évite de leak l'existence du village).

## Critères de succès

- [ ] Sur `/game/army`, « Renvoyer » un renfort étranger crée bien l'`Expedition` retour côté DB et déclenche l'event WS.
- [ ] Le trajet retour est visible sur la WorldMap et la mini-carte jusqu'à l'arrivée.
- [ ] Le smoke existant `recall` reste vert.
- [ ] Le nouveau smoke `send-back foreign reinforcement` est vert.
- [ ] `yarn static-check` vert.
- [ ] QA IG : reproduction du flow `userB renforce userA → userA renvoie → trajet visible côté userA → arrivée chez userB`.
