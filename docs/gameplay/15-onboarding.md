# Onboarding / tutoriel

> ✅ **Runtime MVP livré.** Cette page documente le tutoriel scripté minimal actuellement implémenté. La campagne solo plus riche reste post-MVP.

## Pourquoi un tuto guidé est obligatoire au MVP

Un MMORTS mobile sans tutoriel scripté en première session = bounce rate ≥ 70 % observé sur le segment. Le joueur arrive sur une carte, voit un village, ne sait ni quoi cliquer ni pourquoi — il ferme l'app avant de comprendre la boucle. Le couplage [bouclier débutant 48 h](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) + tuto guidé est ce qui transforme le J+1 en J+7.

L'`01-overview.md` listait initialement la « Campagne solo » comme extension **post-MVP**. Cette doc inverse la décision : un **tuto minimal scripté** entre dans le scope MVP. La campagne solo plus riche reste post-MVP.

## Cible MVP — runtime

5 étapes scriptées sont chaînées dès la création du premier village d'un joueur sur un monde. Le runtime est **server-authoritative** : le frontend n'avance jamais une étape localement, il affiche seulement la guidance correspondant à l'état exposé par `GET /onboarding?worldId=...`.

À la création du premier village `userId × worldId`, le backend crée un état onboarding unique et applique une récompense initiale unique :

- `+850 bois`
- `+850 pierre`
- `+850 fer`
- `+100 couronnes`

Cette récompense est distincte du stock initial de join (`1000/1000/1000`). Avec les valeurs par défaut, le stock immédiatement après join est donc `1850/1850/1850`, plafonné par le stockage courant.

Cible confirmée après recalibration tempo : couvrir une session ≤ 10 min qui fait passer le joueur par les boucles principales (économie, militaire, exploration, attaque barbare). Les timers compressés rendent cette cible atteignable sans raccourci spécial, grâce au prérequis livré par le run 035 : une Watchtower niveau 1 révèle au moins un village barbare T1 attaquable.

| # | Étape | Boucle exercée |
| ---: | --- | --- |
| 1 | Château niveau 2 terminé | Économie / vitesse de construction |
| 2 | Caserne construite | Infrastructure militaire |
| 3 | Première troupe formée | Militaire |
| 4 | Tour de guet construite | Exploration |
| 5 | Premier village barbare vaincu | Attaque PvE |

Hors scope MVP actuel : skip tutoriel, replay tutoriel, campagne solo narrative, récompenses intermédiaires par étape.

### Déclencheurs runtime

Le tutoriel doit écouter des faits gameplay server-side plutôt que des états purement visuels :

| Étape | Event métier candidat |
| --- | --- |
| Château niveau 2 terminé | `building.completed` avec `buildingType=CASTLE`, `level>=2` |
| Caserne construite | `building.completed` avec `buildingType=BARRACKS`, `level>=1` |
| Première unité recrutée | `unit.trained` avec `completedQty>0` |
| Tour de guet construite | `building.completed` avec `buildingType=WATCHTOWER`, `level>=1` |
| Premier raid barbare victorieux | `battle.resolved` avec `targetKind=BARBARIAN_VILLAGE`, `isVictory=true` |

La projection est séquentielle : un event ne complète que l'étape courante. Si un joueur effectue une action plus tardive avant l'étape attendue, elle ne saute pas le script.

Idempotence :

- `OnboardingState` est unique par `userId × worldId`.
- `OnboardingStepProgress` est unique par `state × step`.
- `OnboardingProgressEvent` garde un ledger par `EventOutbox.id` pour qu'un replay d'Outbox ne double pas la progression.

L'onboarding est distinct des cartes quotidiennes : il consomme certains mêmes facts Outbox, mais possède ses propres tables, son propre endpoint et son propre statut `ACTIVE|COMPLETED`.

## Liens

- [`01-overview.md`](./01-overview.md) — vision globale, boucles de gameplay, philosophie mobile.
- [`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) — l'autre filet d'onboarding (protection 48 h temps réel).
- [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes (rétention long terme, distincte du tuto initial).
