# 10 — Notes et marqueurs de carte

> **Promu (run 085).** Source de vérité : [`docs/gameplay/26-private-map-markers.md`](../../26-private-map-markers.md). Ce ticket n'est plus canonique — conservé comme trace de l'idée d'origine.

**Statut** : promu — MVP léger  
**Ratio bénéfice / coût** : très bon

## Opportunité

Le joueur a besoin de mémoire stratégique sur la carte : cible à scout, voisin dangereux, spot futur, site contesté. Aujourd'hui cette mémoire vit hors jeu.

## Piste

Marqueurs privés sur la carte :

- À scout.
- Cible.
- Danger.
- Futur village.
- Site intéressant.
- Note libre courte.

Première version : privé uniquement, sans partage tribu.

## Bénéfice joueur

Meilleure planification. Moins de charge mentale. Très bon fit mobile si l'UX est rapide.

## Garde-fous

- Pas de gameplay caché.
- Pas de partage social au départ.
- Limite raisonnable de marqueurs par monde.
- Icônes simples, pas une couche de carte illisible.

## Points à trancher

- Marqueur sur tile libre, village, site d'exploitation, ou tout ?
- Note texte libre ou tags fixes seulement ?
- Visible dans mini-map ?
- Suppression automatique si l'entité disparaît ?

