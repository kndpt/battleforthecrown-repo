# 07 — Sites d'exploitation de ressources

**Statut** : livré (run 091)  
**Ratio bénéfice / coût** : bon si le système reste rare et lisible

> **Promu et implémenté au run 091.** Modèle `ResourceExtractionSite` (cf. [`docs/architecture/data-model.md` § Sites d'exploitation de ressources](../../../architecture/data-model.md#sites-dexploitation-de-ressources)). Arbitrages retenus sur les points à trancher ci-dessous : pas de tiers de sites (la durée choisie à l'envoi — 2/4/8 h — détermine le volume extrait, plafonné par la capacité restante) ; cap d'escorte fixe (nombre d'unités identique pour tous les sites, pas de variation par puissance/population) ; respawn à une position aléatoire valide dans le monde à l'épuisement ; l'occupant n'est **jamais** exposé dans la vision — seuls la position, le type de ressource et l'activité (équipe en exploitation ou non) sont visibles. Interception combat : vol partiel plafonné à 50 % du stock non sécurisé accumulé (pas de jackpot sur la capacité totale du site).

## Opportunité

Créer des points de friction sur la carte sans déclencher une guerre totale ni attendre la conquête.

## Piste

Sites rares, en nombre inférieur au nombre de joueurs d'une zone :

- Bosquet royal : bois.
- Carrière ancienne : pierre.
- Mine abandonnée : fer.

Règles de base :

- visibles uniquement dans la vision Watchtower ;
- pas visibles globalement ;
- 1 site actif max par joueur par défaut ;
- envoi de villageois / population occupée + escorte optionnelle ;
- équipe attaquable tant qu'elle exploite ;
- ressources sécurisées seulement au retour ;
- capacité finie, puis épuisement et respawn ailleurs ;
- pas d'attaque barbare au départ ;
- durées longues : 2 h / 4 h / 8 h.

## Bénéfice joueur

La carte vit entre les guerres. La vision, la proximité et les villages avancés ont plus de valeur.

## Garde-fous

- Pas de slot supplémentaire via boutique.
- Cap d'escorte par site pour éviter le verrouillage par top-player.
- Vol partiel seulement : interruption + partie du stock non sécurisé, pas jackpot total.
- Rendement utile mais inférieur à un bon pillage actif.

## Points à trancher

- Tiers de sites ou seulement taille/durée ?
- Cap d'escorte par puissance, population ou nombre d'unités ?
- Respawn aléatoire, régional, ou lié aux zones peu actives ?
- Le site affiche-t-il l'occupant dans la vision, ou seulement une activité ?

