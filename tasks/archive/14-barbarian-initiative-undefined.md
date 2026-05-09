# 14 — Initiative barbare non spécifiée

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Décision (user)** : initiative barbare **OFF au MVP**, assumer dans la doc. Les villages barbares restent des cibles passives. Pression défensive du joueur = raids globaux événementiels (3-5 j) + PvP émergent (raids + conquêtes + vautour autour des fenêtres).

**Justification** : ajouter une initiative barbare propre demande de trancher 3 dimensions (déclencheurs, choix de cible, calage fréquence) qui interagissent avec le PvP. On observe d'abord la pression PvP réelle au playtest ; si elle s'avère insuffisante, on rouvrira en post-MVP.

**Doc mise à jour** :
- `docs/gameplay/06-barbarians.md` § Tableau Trait : *« Initiative : Peuvent attaquer (à définir) »* → *« Initiative : ❌ Aucune au MVP »* avec lien vers la nouvelle section.
- `docs/gameplay/06-barbarians.md` : nouvelle section § Initiative barbare au MVP — décision actée + sources de pression défensive alternatives + lecture design + statut MVP stable.
- Suppression de la sous-section *« Mécaniques structurantes »* dans § Questions ouvertes (initiative barbare était la seule entrée).

## Symptôme

`docs/gameplay/06-barbarians.md:201` — « Initiative barbare : … gelé volontairement pour l'instant ».

Pilier manquant de la pression défensive. Sans ça, la boucle militaire **défensive** du joueur ne tient que sur les raids barbares **globaux** (événement, 3-5 j) et la conquête PvP.

`docs/gameplay/06-barbarians.md:16` — table dit « Peuvent attaquer des joueurs proches (mécanisme à définir) ». Promesse non tenue.

## Question à trancher

Au MVP : initiative barbare ON ou OFF ?
- Si ON : déclencheurs (proximité ? richesse joueur ? cooldown ?), choix de cible, fréquence, taille du groupe envoyé.
- Si OFF : assumer explicitement dans la doc et compenser par d'autres pressions défensives.
