# 27 — Sprites barbares à refaire : 5 tiers, 3 sprites distincts

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu (spec) 2026-05-09 — production d'assets à venir

## Résolution

**Décision (user)** : 5 variantes d'un **même asset de base** (campement paléo). Layers d'accents progressifs (palissade T2, watchtower T3, donjon T4, remparts T5) + escalade chromatique gris-marron → rouge-or sombre.

**Avantages** :
- Cohérence narrative (même type de campement qui se développe).
- Coût de production réduit (1 asset de base + couches).
- Animations partageables.

**Doc mise à jour** :
- `docs/gameplay/06-barbarians.md` § Lisibilité joueur > Brief sprites : remplacement de la todo *« à refaire »* par un **brief asset complet** — tableau tier-par-tier des accents + palette de couleurs progressive + justification design.
- Suppression de l'entrée *« Identité visuelle des tiers (refonte) »* dans § Détails UX (plus de question ouverte).

**Suite** : production d'assets à briefer pour artiste / IA générative (suivi hors de ce ticket).

**Consommation runtime** : `tasks/archive/084-barbarian-tier-readability-t4-t5.md` branche le mapping 5 paliers (taille + couleur + ring distincts T1→T5) côté rendu Pixi (`worldMapEntityStyle.ts`), refermant l'écart entre ce brief spec et la carte tactique.

## Symptôme

`docs/gameplay/06-barbarians.md:162-165` — 3 variantes de sprites existantes pour 5 tiers, pas assez différenciables.

Conséquence : la lisibilité du tier est le **seul indicateur de difficulté pré-clic** sur la carte tactique. Tant que les sprites ne distinguent pas les 5 tiers, la boucle « repère cible → adapte armée » est cassée.

## Question à trancher

Refonte sprites :
- Silhouettes / tailles distinctes par tier.
- Palette de couleurs progressive (signal de difficulté).
- 5 sprites uniques, ou 5 variantes d'un même asset (taille, accents, étendard) ?

Asset task à briefer pour artiste / IA générative. Cible : différenciation au premier coup d'œil sur la carte.
