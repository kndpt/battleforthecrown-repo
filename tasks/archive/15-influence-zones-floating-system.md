# 15 — Zones d'influence : système annoncé mais non spécifié

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu 2026-05-09

## Résolution

**Décision (user)** : reporter le système de zones d'influence en **post-MVP**. Pas de promesse fantôme dans le MVP — la spec sera élaborée quand le PvP émergent sera observé sur le playtest.

**Doc mise à jour** :
- `docs/gameplay/01-overview.md` § Monde persistant : suppression de la sous-liste *« Système de zones d'influence : Bonus déplacement / Bonus dégressif / Perdu si ennemi s'intercale »* (qui n'avait aucune spec ailleurs). Remplacée par une note *« Post-MVP »* explicite avec justification.

**Choix écartés** :
- Garder spec minimale au MVP : aurait demandé de trancher 4 dimensions (rayons, bonus, ennemi intercalé, recalcul) sans observation préalable du PvP réel.
- Spec complète : scope creep majeur sur le MVP.

## Symptôme

`docs/gameplay/01-overview.md:119-122` — annonce des zones d'influence : « +15 % → +10 % → +5 %, max 30 % », perdues si un ennemi s'intercale, bonus déplacement si plusieurs villages proches.

Aucun autre doc ne reprend la mécanique : ni `04-combat.md`, ni `12-village-styles.md`, ni `13/14-conquest`, ni implementation backend.

## Question à trancher

- Bonus à quoi exactement (vitesse trajet ? dégâts ? loot ?) ?
- Définition de « proche » (rayon en cases, distance euclidienne) ?
- « Ennemi s'intercale » = village barbare ou seulement village joueur ennemi ?
- MVP ou post-MVP ? Si post-MVP : retirer de l'overview pour pas créer de promesse fantôme.
