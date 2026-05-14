# Onboarding / tutoriel

> 🚧 **Doc en chantier.** Spec à détailler plus tard. Cette page existe pour acter que l'onboarding est un sujet **MVP** et non post-MVP — l'analyse design viendra dans une seconde passe.

## Pourquoi un tuto guidé est obligatoire au MVP

Un MMORTS mobile sans tutoriel scripté en première session = bounce rate ≥ 70 % observé sur le segment. Le joueur arrive sur une carte, voit un village, ne sait ni quoi cliquer ni pourquoi — il ferme l'app avant de comprendre la boucle. Le couplage [bouclier débutant 48 h](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) + tuto guidé est ce qui transforme le J+1 en J+7.

L'`01-overview.md` listait initialement la « Campagne solo » comme extension **post-MVP**. Cette doc inverse la décision : un **tuto minimal scripté** entre dans le scope MVP. La campagne solo plus riche reste post-MVP.

## Cible MVP — esquisse

5 étapes scriptées, chaînées dès la création du premier village. Cible : couvrir une session ≤ 10 min qui fait passer le joueur par les 4 boucles principales (cf. [`01-overview.md` § Boucles de gameplay](./01-overview.md#boucles-de-gameplay)).

| # | Étape | Boucle exercée |
| ---: | --- | --- |
| 1 | Premier upgrade de bâtiment (typiquement Bois 2 ou Pierre 2) | Économie |
| 2 | Premier raid barbare T1 (cible la plus proche, victoire scriptée) | Militaire |
| 3 | Première Watchtower construite (passage de blip → entité visible) | Exploration |
| 4 | Premier scout sur un village joueur ou barbare T2 | Renseignement |
| 5 | (TBD — probablement première construction de Caserne ou premier upgrade Château) | — |

Récompenses, déclencheurs UI, tolérance aux raccourcis (skip-tuto, replay), modélisation de la progression — **à trancher plus tard**.

### Déclencheurs runtime candidats

Le tutoriel doit écouter des faits gameplay server-side plutôt que des états purement visuels :

| Étape | Event métier candidat |
| --- | --- |
| Premier upgrade terminé | `building.completed` |
| Première unité recrutée | `unit.trained` |
| Premier raid résolu | `battle.resolved` |
| Premier scout résolu | `scout.reported` |

## Liens

- [`01-overview.md`](./01-overview.md) — vision globale, boucles de gameplay, philosophie mobile.
- [`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) — l'autre filet d'onboarding (protection 48 h temps réel).
- [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes (rétention long terme, distincte du tuto initial).
