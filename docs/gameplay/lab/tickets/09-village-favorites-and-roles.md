# 09 — Villages favoris et rôles visibles

**Statut** : promu MVP léger dans [`22-village-roles-and-navigation.md`](../../22-village-roles-and-navigation.md)
**Ratio bénéfice / coût** : très bon côté UX

> Ce ticket est conservé pour trace. Il n'est plus source de vérité.

## Opportunité

Quand un joueur possède plusieurs villages, il doit comprendre vite à quoi sert chacun. Sans ça, le multi-village devient une liste confuse.

## Piste

Permettre au joueur de marquer ses villages :

- Capitale.
- Raid.
- Défense.
- Économie.
- Frontière.
- Conquête.
- Favori.

Première version : aucun effet gameplay, uniquement UI.

## Bénéfice joueur

Meilleure navigation, meilleurs filtres, meilleure lecture du royaume. Prépare les dashboards multi-village sans ajouter de règles.

## Garde-fous

- Pas de bonus mécanique au départ.
- Tags modifiables librement.
- Limiter le nombre de rôles affichés pour éviter le bruit.
- Ne pas remplacer les styles stratégiques : un rôle est une étiquette UX, pas un build.

## Points à trancher

- Un village peut-il avoir plusieurs rôles ?
- Liste fixe ou tags personnalisables ?
- Affichage carte, liste village, dashboard royaume ?
- Interaction future avec presets d'armée / alertes / gouvernance multi-village ?
