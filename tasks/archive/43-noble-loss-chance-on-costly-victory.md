# 43 — Risque de mort du Seigneur sur victoire coûteuse

**Sévérité** : 🟠 Majeur (règle spec atteignable en théorie, impossible avec l'algo actuel)
**Statut** : ✅ Résolu 2026-05-11 par $run @tasks/43-noble-loss-chance-on-costly-victory.md
**Spec amont** : [`docs/gameplay/10-conquest.md` § Cas particulier escorte-survivante](../docs/gameplay/10-conquest.md#cas-particulier--armée-gagne-le-combat-de-pré-conquête-mais-le-seigneur-meurt) + [`04-combat.md` § Conquête](../docs/gameplay/04-combat.md#conquête)

## Symptôme

Avec l'allocation actuelle des pertes attaquant en victoire :

```ts
losses[unitType] = Math.floor(quantity * lossRatio)
```

Un Seigneur unique (`quantity = 1`) ne peut jamais mourir tant que l'attaquant gagne, car `lossRatio < 1` et `floor(1 * lossRatio) = 0`.

Conséquence : le cas spec « l'armée gagne mais le Seigneur meurt » est impossible, alors que le hook `noble.killed` existe depuis #42.

## Règle cible

Si l'attaquant gagne mais subit une victoire coûteuse, le Seigneur peut mourir selon le taux de pertes global de l'attaquant.

| Pertes attaquant | Chance mort Seigneur |
| ---: | ---: |
| < 50 % | 0 % |
| 50 % | 1 % |
| 55 % | 5 % |
| 60 % | 10 % |
| 65 % | 20 % |
| 70 % | 30 % |
| 75 % | 40 % |
| 80 % | 50 % |
| 85 % | 60 % |
| 90 % | 70 % |
| 95 % | 80 % |
| 100 % | 100 % |

Interpolation attendue entre paliers : à trancher au démarrage.

## Scope d'implémentation

- Extraire une logique pure de risque Seigneur dans le module combat.
- L'appliquer uniquement si :
  - l'attaquant gagne ;
  - l'armée au départ contient un `NOBLE` ;
  - les pertes attaquant globales sont `>= 50 %`.
- Si le tirage tue le Seigneur :
  - ajouter `NOBLE: 1` dans `lossesAttacker` ;
  - retirer `NOBLE` de `survivingUnits` ;
  - laisser le flux #42 émettre `noble.killed` et ne pas ouvrir `PendingConquest`.
- Ne pas affecter les défaites : en défaite, l'armée est déjà détruite.

## Tests

- Pure-logic :
  - `< 50 %` → 0 %.
  - chaque palier de la table retourne la probabilité attendue.
  - interpolation entre paliers selon décision.
  - seed/tirage contrôlé : tue ou épargne le Seigneur de manière déterministe en test.
- Smoke backend :
  - victoire avec pertes élevées + tirage fatal → pas de `PendingConquest`, event `noble.killed`, escorte survivante rentre avec loot.

## Question à trancher

1. Entre deux paliers, interpolation linéaire ou palier inférieur ?
   - Recommandation : interpolation linéaire, plus naturelle et évite les cliffs.
