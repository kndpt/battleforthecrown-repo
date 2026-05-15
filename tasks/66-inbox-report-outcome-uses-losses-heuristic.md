# 66 — Inbox combat : tag VICTOIRE/DÉFAITE faux dans la liste

**Sévérité** : 🟡 Majeur
**Statut** : 🆕 Ouvert
**Spec amont** : Aucune (logique canonique : `packages/shared/src/combat/utils.ts` — `isVictoryForAttacker`)

## Symptôme

Dans l'inbox combat, un rapport est tagué `VICTOIRE` (badge vert) alors que c'est une défaite. Cliquer sur la carte ouvre bien le modal `DÉFAITE` correct — le mismatch est limité au rendu liste.

Cas reproduit : attaquant envoie 16 archers + 20 épéistes (36), perd les 36 → wipe complet. Défenseur perd 49 unités sur 146. L'inbox affiche `VICTOIRE`, le modal `DÉFAITE`.

## Cause racine

Les deux composants de liste calculent localement `isVictory` via une heuristique « qui a perdu le plus d'unités au total » :

- `battleforthecrown-pixi/src/features/combat/ReportCard.tsx:40-42`
- `battleforthecrown-pixi/src/features/combat/ReportsList.tsx:51-53`

```ts
const isVictory = report.isAttacker
  ? defenderLosses >= attackerLosses
  : attackerLosses >= defenderLosses;
```

Le modal, lui, passe par `combatReportOutcome()` (`features/combat/combatReportView.ts:96-106`) qui s'appuie sur `isVictoryForAttacker()` du shared : **l'attaquant gagne ssi ≥ 1 unité attaquante a survécu**. C'est la règle canonique, déjà utilisée côté backend résolution combat.

→ Heuristique liste ≠ règle canonique → divergence visible quand l'attaquant wipe en infligeant des pertes plus lourdes (cas typique : ratio défavorable mais grosse cible).

## Comportement attendu

- Une défaite (attaquant wipe) affiche `DÉFAITE` dans la liste.
- Une victoire (≥ 1 attaquant survivant) affiche `VICTOIRE` dans la liste.
- La liste et le modal sont **toujours** d'accord (même source).
- Côté défenseur, la mention liste correspond à `!attackerWon`.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/features/combat/ReportsList.tsx` : remplacer le calcul local par `combatReportOutcome(report).isVictory` (déjà exporté depuis `combatReportView.ts`).
- `battleforthecrown-pixi/src/features/combat/ReportCard.tsx` : même fix, **ou** suppression si le composant n'est plus monté nulle part après la migration design-system (à vérifier par grep `<ReportCard` / import).

### Tests

- `battleforthecrown-pixi/src/features/combat/combatReportView.test.ts` : couvrir explicitement deux cas si pas déjà fait :
  - attaquant wipe → `isVictory: false` côté attaquant, `true` côté défenseur.
  - attaquant survit avec lourdes pertes → `isVictory: true` côté attaquant.

### Docs

- Aucune doc archi impactée. La règle canonique vit déjà dans `packages/shared`.

## Critères de succès

- [ ] Inbox : un rapport « attaquant wipe » s'affiche `DÉFAITE` côté attaquant et `VICTOIRE` côté défenseur.
- [ ] Inbox et modal toujours cohérents pour le même rapport.
- [ ] Heuristique locale supprimée des deux composants liste (plus aucun `defenderLosses >= attackerLosses` dans `features/combat/`).
- [ ] Test unit couvrant le cas wipe attaquant vert.
- [ ] `yarn static-check` vert.
