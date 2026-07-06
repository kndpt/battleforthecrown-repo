# 03 — Qualité du renseignement

**Statut** : ✅ implémenté (run 090) — mécanique canonique dans [`docs/gameplay/11-scouting.md`](../../11-scouting.md) § Qualité du renseignement  
**Ratio bénéfice / coût** : moyen

## Opportunité

Le scout peut devenir plus stratégique qu'un simple tout-ou-rien, sans ajouter un système d'espionnage complexe.

## Piste

La précision du rapport dépend du nombre d'ESPIONS envoyés :

- 1 espion : estimation vague.
- 3 espions : fourchettes par type d'unité.
- 10 espions : rapport précis.

## Bénéfice joueur

L'information devient une ressource. Le joueur choisit entre scout rapide, scout fiable, ou attaque à l'aveugle.

## Points à trancher _(tranchés — run 090)_

- Seuils fixes ou scaling selon puissance cible ? → **fixes** (3 / 10).
- Approximation par tranches ou bruit numérique ? → **tranches déterministes** (buckets, zéro RNG).
- Même logique pour stock, armée et style ? → stock + armée floutés ; **style masqué** sous le palier RANGED ; Rempart toujours exact.
- Risque de perte ESPION toujours post-MVP ? → **oui, hors scope**.

