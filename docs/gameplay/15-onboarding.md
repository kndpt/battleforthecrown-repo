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

Cible confirmée après recalibration tempo : couvrir une session ≤ 10 min qui fait passer le joueur par les boucles principales (économie, militaire, exploration, attaque barbare). Les timers compressés rendent cette cible atteignable sans raccourci spécial, grâce à la cible narrative dédiée que l'onboarding pose dans le rayon de la Watchtower L1.

| # | Étape | Boucle exercée |
| ---: | --- | --- |
| 1 | Château niveau 2 terminé | Économie / vitesse de construction |
| 2 | Caserne construite | Infrastructure militaire |
| 3 | 5 Milices paysannes formées | Militaire |
| 4 | Château niveau 3 terminé | Déblocage exploration |
| 5 | Tour de guet construite | Exploration |
| 6 | Premier village barbare vaincu | Attaque PvE |

Hors scope MVP actuel : skip tutoriel, replay tutoriel, campagne solo narrative, récompenses intermédiaires par étape.

### Guidage front spécifique (par étape)

Le guidage visuel reste **front-only** (n'avance jamais l'état server-authoritative) :

- **Étapes 1 / 2 / 4 / 5** (Château L2/L3, Caserne, Tour de guet) : le CTA de la guidance ouvre directement la modale du bâtiment ciblé, depuis n'importe quel écran (cf. `onboardingViewModel.ts` → `targetBuildingType` ; signal porté par le store `pendingBuildingModal`, consommé par `VillageView`).
- **Étape 3** (5 Milices) : hint de drag & drop animé (carte milice → file) tant qu'aucune milice n'est formée ni en file ; la modale de recrutement guide vers la quantité **restante pour atteindre 5** (= `ONBOARDING_TRAIN_TROOPS_TARGET − milices au village − milices en file`) et bloque la formation hors de cette valeur exacte. Le restant est recalculé dynamiquement : annuler un batch partiel ré-ajuste la cible (ex. 1 déjà formée → la modale demande 4). Mécanique UI : [`battleforthecrown-pixi/docs/ui-onboarding-hints.md`](../../battleforthecrown-pixi/docs/ui-onboarding-hints.md).

### Déclencheurs runtime

Le tutoriel doit écouter des faits gameplay server-side plutôt que des états purement visuels :

| Étape | Event métier candidat |
| --- | --- |
| Château niveau 2 terminé | `building.completed` avec `buildingType=CASTLE`, `level>=2` |
| Caserne construite | `building.completed` avec `buildingType=BARRACKS`, `level>=1` |
| 5 Milices paysannes recrutées | `unit.trained` avec `unitType=MILITIA`, puis inventaire `MILITIA>=5` |
| Château niveau 3 terminé | `building.completed` avec `buildingType=CASTLE`, `level>=3` |
| Tour de guet construite | `building.completed` avec `buildingType=WATCHTOWER`, `level>=1` |
| Premier raid barbare victorieux | `battle.resolved` avec `targetKind=BARBARIAN_VILLAGE`, `targetOriginKind=ONBOARDING_NARRATIVE`, `isVictory=true` |

> Une victoire sur un village barbare `STANDARD` ne complète pas cette étape — seule la cible narrative dédiée compte.

### Cible barbare narrative

La construction de la Tour de guet L1 (`building.completed` `WATCHTOWER L1`) déclenche server-side la création d'une **cible barbare narrative** : un village barbare T1 d'`originKind` `ONBOARDING_NARRATIVE`, posé dans le rayon de vision de la Watchtower. Ses caractéristiques sont fixes :

- Garnison : **3 MILICE** (battables avec les `ONBOARDING_TRAIN_TROOPS_TARGET = 5` miliciens fraîchement entraînés ; la formule combat exige `attaque > défense`).
- Loot : stock initial réduit à **≈ 40 % du cap T1** (au lieu du roll standard 30-100 %).

L'idempotence est portée par `OnboardingState.narrativeTargetVillageId` (FK unique vers `Village`, SET NULL à la destruction) : un rejoin ou un replay d'Outbox ne crée pas de doublon. L'id de cette cible est exposé dans `GET /onboarding` (`narrativeTargetVillageId`) pour la guidance frontend.

À l'étape 6 (`ATTACK_BARBARIAN`), le frontend **masque tous les autres barbares** sur la carte et n'affiche que les villages du joueur + cette cible narrative (`filterEntitiesForNarrativeTarget`, `WorldMapScreen.tsx`), pour éviter que le joueur attaque le mauvais village et gâche ses 5 miliciens. Filtre purement visuel ; appliqué uniquement tant que `narrativeTargetVillageId` est connu et l'étape active.

La projection suit l'ordre du script, mais elle se réconcilie sur les faits serveur déjà atteints. Si un joueur effectue une action plus tardive avant l'étape attendue, le tutoriel rattrape automatiquement toutes les étapes satisfaites jusqu'à la première condition encore manquante.

Idempotence :

- `OnboardingState` est unique par `userId × worldId`.
- `OnboardingStepProgress` est unique par `state × step`.
- `OnboardingProgressEvent` garde un ledger par `EventOutbox.id` pour qu'un replay d'Outbox ne double pas la progression.

L'onboarding est distinct des cartes quotidiennes : il consomme certains mêmes facts Outbox, mais possède ses propres tables, son propre endpoint et son propre statut `ACTIVE|COMPLETED`.

### Cible narrative post-victoire

La cible barbare affaiblie (`ONBOARDING_NARRATIVE`) est créée lors de la construction de la Tour de guet niveau 1 et supprimée dès que l'étape `ATTACK_BARBARIAN` complète le tutoriel. La suppression libère la case de grille et émet un event `village.removed` pour resynchroniser la carte. Les villages narratifs orphelins (joueurs ayant complété avant ce cleanup) peuvent être purgés via :

```sql
DELETE FROM village
WHERE origin_kind = 'ONBOARDING_NARRATIVE'
  AND id NOT IN (
    SELECT narrative_target_village_id
    FROM onboarding_state
    WHERE narrative_target_village_id IS NOT NULL
      AND status = 'ACTIVE'
  );
```

### Écran de clôture post-victoire (front-only)

À la victoire narrative, le backend passe `COMPLETED` (la bascule **ne crédite rien** par elle-même).

Le frontend affiche alors une dernière guidance « completion » (même `OnboardingFab`, preview butin via `ONBOARDING_COMPLETION_REWARD`) dont le CTA « Récupérer le butin » :

1. **Crédite le butin de complétion garanti** : `POST /onboarding/claim-completion-reward` → `OnboardingService.claimCompletionReward` crédite `ONBOARDING_COMPLETION_REWARD` (1000 bois / 1700 pierre / 900 fer — source de vérité unique partagée backend + preview front) au premier village, plafonné par le stockage, idempotent via `OnboardingState.completionRewardApplied`. Le crédit se fait donc **au clic du CTA**, pas à la résolution du combat. C'est distinct du loot de combat (plafonné par les survivants) et du stock du barbare (`getOnboardingNarrativeLoot`) : le tutoriel garantit une récompense même si le joueur a perdu des miliciens.
2. Acquitte et masque le tutoriel : persistance front (`sessionStorage`, clé `userId × worldId`) — one-shot, pas de re-trigger au refresh/rejoin. Le front invalide `resources` à la réussite du claim pour faire apparaître le butin (`onboardingCompletion.ts`).

Si le joueur ferme la modale sans cliquer le CTA (croix), rien n'est crédité ni acquitté : la guidance « completion » se ré-affiche (le crédit n'est jamais perdu, le claim reste disponible).

## Liens

- [`01-overview.md`](./01-overview.md) — vision globale, boucles de gameplay, philosophie mobile.
- [`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) — l'autre filet d'onboarding (protection 48 h temps réel).
- [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes (rétention long terme, distincte du tuto initial).
