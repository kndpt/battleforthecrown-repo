# Onboarding / tutoriel

> ✅ **Runtime MVP livré.** Cette page documente le tutoriel scripté minimal actuellement implémenté. La campagne solo plus riche reste post-MVP.

## Pourquoi un tuto guidé est obligatoire au MVP

Un MMORTS mobile sans tutoriel scripté en première session = bounce rate ≥ 70 % observé sur le segment. Le joueur arrive sur une carte, voit un village, ne sait ni quoi cliquer ni pourquoi — il ferme l'app avant de comprendre la boucle. Le couplage [bouclier débutant 48 h](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) + tuto guidé est ce qui transforme le J+1 en J+7.

L'`01-overview.md` listait initialement la « Campagne solo » comme extension **post-MVP**. Cette doc inverse la décision : un **tuto minimal scripté** entre dans le scope MVP. La campagne solo plus riche reste post-MVP.

## Cible MVP — runtime

6 étapes scriptées sont chaînées dès la création du premier village d'un joueur sur un monde. Le runtime est **server-authoritative** : le frontend n'avance jamais une étape localement, il affiche seulement la guidance correspondant à l'état exposé par `GET /onboarding?worldId=...`.

À la création du premier village `userId × worldId`, le backend crée un état onboarding unique et applique une récompense initiale unique :

- `+850 bois`
- `+850 pierre`
- `+850 fer`
- `+100 couronnes`

Cette récompense est distincte du stock initial de join (`1000/1000/1000`). Avec les valeurs par défaut, le stock immédiatement après join est donc `1850/1850/1850`, plafonné par le stockage courant.

Cible confirmée après recalibration tempo : couvrir une session ≤ 10 min qui fait passer le joueur par les boucles principales (économie, militaire, exploration, attaque barbare). Les timers compressés rendent cette cible atteignable sans raccourci spécial : la **première victoire barbare garantie** appartient à l'onboarding via une **cible narrative affaiblie**, pas au seeding global des villages barbares T1 standards.

| # | Étape | Boucle exercée |
| ---: | --- | --- |
| 1 | Château niveau 2 terminé | Économie / vitesse de construction |
| 2 | Caserne construite | Infrastructure militaire |
| 3 | 5 Milices paysannes formées | Militaire |
| 4 | Château niveau 3 terminé | Déblocage exploration |
| 5 | Tour de guet construite | Exploration |
| 6 | Premier village barbare vaincu | Attaque PvE |

Hors scope MVP actuel : skip tutoriel, replay tutoriel, campagne solo narrative, récompenses intermédiaires par étape.

### Déclencheurs runtime

Le tutoriel doit écouter des faits gameplay server-side plutôt que des états purement visuels :

| Étape | Event métier candidat |
| --- | --- |
| Château niveau 2 terminé | `building.completed` avec `buildingType=CASTLE`, `level>=2` |
| Caserne construite | `building.completed` avec `buildingType=BARRACKS`, `level>=1` |
| 5 Milices paysannes recrutées | `unit.trained` avec `unitType=MILITIA`, puis inventaire `MILITIA>=5` |
| Château niveau 3 terminé | `building.completed` avec `buildingType=CASTLE`, `level>=3` |
| Tour de guet construite | `building.completed` avec `buildingType=WATCHTOWER`, `level>=1` → crée ou révèle la cible narrative affaiblie (`isOnboardingNarrativeTarget`) dans le rayon Watchtower L1 |
| Premier raid barbare victorieux | `battle.resolved` avec `targetKind=BARBARIAN_VILLAGE`, `isVictory=true` **contre la cible narrative liée** (`OnboardingState.narrativeTargetVillageId`) |

La projection suit l'ordre du script, mais elle se réconcilie sur les faits serveur déjà atteints. Si un joueur effectue une action plus tardive avant l'étape attendue, le tutoriel rattrape automatiquement toutes les étapes satisfaites jusqu'à la première condition encore manquante.

Idempotence :

- `OnboardingState` est unique par `userId × worldId`.
- `OnboardingStepProgress` est unique par `state × step`.
- `OnboardingProgressEvent` garde un ledger par `EventOutbox.id` pour qu'un replay d'Outbox ne double pas la progression.

L'onboarding est distinct des cartes quotidiennes : il consomme certains mêmes facts Outbox, mais possède ses propres tables, son propre endpoint et son propre statut `ACTIVE|COMPLETED`.

### Cible narrative affaiblie

Quand la Tour de guet niveau 1 est terminée pendant un onboarding `ACTIVE`, le backend crée **au plus une** cible barbare narrative dédiée :

- marquée `Village.isOnboardingNarrativeTarget = true` ;
- liée à `OnboardingState.narrativeTargetVillageId` (idempotente : un rejoin ne recrée pas de doublon) ;
- placée dans l'anneau atteignable Watchtower L1 (`[rMin, portée L1]`) ;
- défense fixe affaiblie (`2` milices) pour que `5` milices paysannes gagnent de façon fiable ;
- exposée dans `GET /onboarding` (`narrativeTarget`) et dans le feed carte (`data.isOnboardingNarrativeTarget`).

Les villages barbares T1 globaux issus du seeding restent des adversaires réels (roll initial `60-100 %` du blueprint T1). L'étape `ATTACK_BARBARIAN` ne se complète **pas** sur une victoire contre un T1 global ni sur une défaite.

## Liens

- [`01-overview.md`](./01-overview.md) — vision globale, boucles de gameplay, philosophie mobile.
- [`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) — l'autre filet d'onboarding (protection 48 h temps réel).
- [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes (rétention long terme, distincte du tuto initial).
