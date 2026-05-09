# Génération des villages barbares

> ⚠️ **Doc en chantier — gameplay à définir.** Ce fichier capture la décision-cadre déjà prise et la liste des questions à explorer. La spec complète de l'algorithme de génération adaptatif **reste à écrire**.

## Pourquoi cette doc

Les villages barbares (cf. [`06-barbarians.md`](./06-barbarians.md)) doivent être **générés à l'arrivée d'un nouveau joueur** dans le monde, autour de sa zone de spawn. Conséquences :

- Pas de pool fixe au lancement du monde.
- Pas de spawn déconnecté des joueurs.
- Un joueur qui rejoint un monde **trouve toujours des cibles barbares à proximité**, même si le monde est ancien.
- **Mais** : il ne faut pas submerger le monde au fil des arrivées de joueurs (sinon la carte devient une mer de barbares, le PvP se dilue, l'identité des zones disparaît).

L'algorithme doit donc s'adapter en temps réel à **deux variables vivantes** :

1. Le **volume de barbares déjà présents** dans la zone visée (pour éviter la sursaturation).
2. Le **volume et la position des joueurs voisins** (pour éviter de générer dans une zone PvP active où les barbares n'ont plus de raison d'être, ou de générer trop près d'un joueur établi).

## Cadre déjà décidé

| Élément | Décision |
| --- | --- |
| Déclencheur | Arrivée d'un nouveau joueur dans le monde |
| Zone visée | Autour de la zone de spawn du nouveau joueur |
| Distribution des tiers | Concentrique — cf. [`06-barbarians.md` § Distribution sur la carte](./06-barbarians.md#distribution-sur-la-carte) (T1-T2 proches du joueur, T4-T5 plus loin) |
| Plafond global | Le monde ne doit jamais être "submergé" par les barbares (notion à quantifier) |
| Adaptation | Algorithme qui tient compte du volume de barbares existants ET des joueurs voisins |

## Questions à trancher

### Densité cible

- Combien de villages barbares un joueur fraîchement arrivé doit-il avoir **dans son rayon de vision initial** (Watchtower lvl 1 = 5 cases) pour que la première session ait du contenu ?
- Combien dans un rayon plus large (≈ rayon Watchtower lvl 5–10) pour soutenir la mid-game ?
- Existe-t-il une **densité maximale** de villages barbares par unité de surface, au-delà de laquelle on ne génère plus, peu importe les joueurs qui arrivent ?

### Rayon et placement

- Quel rayon autour du nouveau spawn pour la zone de génération ?
- Comment garantir une **distance minimale** entre un nouveau village barbare et un village joueur existant (anti-collision visuelle, anti-aggro injuste) ?
- Comment garantir une distance minimale **entre villages barbares** eux-mêmes ?

### Anti-submersion

- Si la zone autour du nouveau joueur est déjà saturée de barbares (autres joueurs récents proches), on en génère **moins**, voire zéro ?
- Faut-il **recycler** les barbares morts/abandonnés d'autres zones plutôt que d'en créer de nouveaux ?
- Si un joueur voisin a déjà "nettoyé" une zone (vidé plusieurs villages barbares), faut-il en re-spawner pour le nouvel arrivant ou laisser la zone pacifiée ?

### Stratégie de spawn — décision provisoire (à approfondir)

**Spawn UNIQUEMENT à la 1ère arrivée du joueur dans le monde** :
- ✅ À l'inscription au monde (1ère connexion + création du village initial) → génération du pool barbare dans le rayon du joueur.
- ❌ Pas de spawn à la conquête d'un village (l'attaquant prend un barbare existant, n'en crée pas).
- ❌ Pas de spawn à la migration d'un village (déplacement, cf. [`02-economy-and-progression.md` § Couronnes — Dépenses](./02-economy-and-progression.md#dépenses)).
- ❌ Pas de cron périodique de régulation.

**Justification** :
- Cohérent avec la **raréfaction progressive volontaire** des barbares (cf. [`13-barbarian-conquest.md` § Conséquences concrètes](./13-barbarian-conquest.md#conséquences-concrètes)) : la carte se vide au fil des conquêtes, le PvP émergent prend le relais.
- **Anti-exploit** : empêche un joueur de multiplier ses villages pour multiplier le pool barbare farmable.
- MVP minimal : pas d'orchestration récurrente, comportement déterministe.

> ⚠️ **Décision provisoire** — l'arbitrage final (notamment la pertinence d'un **cron de régulation centralisé** vs **recyclage à l'arrivée** pour les zones saturées) demande une analyse plus profonde qui prend en compte tout le gameplay. À reprendre en pré-launch quand les boucles principales seront stabilisées et que le playtest aura donné des signaux concrets.

### Distribution des tiers à la génération

- Le ratio T1/T2/T3/T4/T5 est-il **fixe** par génération (ex : 50/30/15/4/1 %) ou **adapté au niveau** du nouveau joueur ?
- Un joueur level 1 a-t-il droit aux T5 dans sa zone (visible mais infranchissable), ou seulement T1-T3 dans son rayon ?

### Cycle de vie post-génération

**Décidé** : un village barbare vidé reste sur la carte **indéfiniment**. Pas de suppression auto, pas de libération de slot. La régénération naturelle ([`06-barbarians.md` § Régénération naturelle](./06-barbarians.md#régénération-naturelle)) finit toujours par le remplir — pas de pollution carte attendue. À ré-évaluer post-MVP si l'observation playtest révèle de l'accumulation (déclenchement d'un délai de suppression de 7-14 j d'inactivité).

**Articulation avec [`01-overview.md` § Monde persistant](./01-overview.md#monde-persistant)** : *« Les barbares peuvent reprendre un village abandonné »* est un **flux séparé** — c'est un village joueur abandonné qui redevient barbare, pas un village barbare vidé qui se ressuscite. Les deux flux ne se chevauchent pas.

### Variables d'entrée de l'algorithme

À spécifier formellement quand on rédigera l'algo :

- Position du nouveau joueur.
- Niveau du nouveau joueur (probablement 1, mais à confirmer pour les rejoins après wipe).
- Liste des villages barbares dans un rayon R autour de la zone.
- Liste des villages joueurs dans le même rayon R.
- État du monde global (densité moyenne, "pression PvP" éventuelle).

## Liens

- [`06-barbarians.md`](./06-barbarians.md) — vision design des villages barbares (consommateur principal de cette doc).
- [`01-overview.md` § Monde persistant](./01-overview.md#monde-persistant) — règle existante sur les barbares qui reprennent les villages abandonnés (à articuler avec l'algo de spawn).
