# 18 — Cycle de vie d'un village barbare totalement vidé

**Sévérité** : 🟠 Moyenne
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Décision (user)** : statu quo — pas de suppression auto. Le village vidé reste indéfiniment, la régénération naturelle finit par le remplir. Pas de pollution carte attendue avec le faible volume de villages 0/0 + la régen.

**À ré-évaluer post-MVP** : si l'observation playtest révèle de l'accumulation de fantômes, on ajoutera un délai d'inactivité (7-14 j → suppression).

**Flux distincts** : *« barbares reprennent village joueur abandonné »* (cf. 01-overview.md) est un **flux séparé** — un village joueur qui redevient barbare, pas un village barbare vidé qui se ressuscite. Pas de chevauchement.

**Doc mise à jour** :
- `docs/gameplay/06-barbarians.md` § Vidage total : ajout d'un paragraphe *« Pas de suppression auto »* qui acte le statu quo + porte de sortie post-MVP.
- `docs/gameplay/07-barbarian-spawning.md` § Cycle de vie post-génération : 3 questions ouvertes → décisions tranchées avec lien explicite vers les docs sœurs.

## Symptôme

`docs/gameplay/06-barbarians.md:139` — village vidé reste à 0, régénère lentement, pas de respawn auto.

`docs/gameplay/07-barbarian-spawning.md:56` — « peut-il être supprimé au bout d'un délai pour libérer la place ? » → décision non prise.

Conséquence : risque de **pollution carte** par villages barbares à zéro qui ne respawn pas et qui ne se suppriment pas. Sur monde âgé, accumulation de fantômes.

## Question à trancher

- Village vidé : durée avant suppression auto (jours) ?
- Place libérée → ré-éligible au spawn par algo `07` pour un nouvel arrivant ?
- Articulation avec « barbares peuvent reprendre village joueur abandonné » (`01-overview.md` § Monde persistant) — flux séparé ou unifié ?
