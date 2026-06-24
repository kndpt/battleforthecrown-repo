# Cycle de vie d'un monde

> ✅ **Spec MVP tranchée.** Les paramètres chiffrés (durée du monde, fenêtre d'inscription, etc.) sont des **defaults** marqués 🔧 — ajustables au runtime par `WorldConfig` si le playtest le justifie. Les sous-questions purement opérationnelles (UX du compte-à-rebours, leaderboard final, etc.) sont en bas dans § Questions ouvertes.
>
> 📌 **Cadre de tempo associé** : cette doc définit la **fenêtre temporelle** d'un monde (durée totale, phases d'inscription). Le **rythme intérieur** (vitesses de construction, training, capture, régen, production, couronnes) est défini par [`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md) via `WorldConfig.tempo`. Les deux sont volontairement séparés : la durée est une **borne**, le tempo est une **vitesse**.

## Vue d'ensemble

Un monde Battle for the Crown est **borné dans le temps**. Quatre status successifs (déjà en place côté schéma : `enum WorldStatus { PLANNED, OPEN, LOCKED, ENDED }`).

| Phase | Status | Durée | Inscription nouveaux joueurs | Gameplay |
| --- | --- | ---: | :---: | --- |
| Préparation | `PLANNED` | variable | ❌ | Monde créé, pas encore ouvert |
| **Ouverture** | `OPEN` (cohorte principale) | **🔧 7 j** | ✅ | Tout joueur peut rejoindre. Spawn flot massif Day 0 + arrivées progressives jusqu'à J+7. |
| **Retardataires** | `OPEN` (sous-phase) | **🔧 3 j** | ✅ avec avertissement UI | Inscription encore possible, mais le monde tourne depuis 1 semaine. L'UI signale le retard (« monde lancé il y a {N} j — voir aussi un monde plus frais ») pour que le joueur fasse un choix éclairé. |
| **Verrouillé** | `LOCKED` | **🔧 ~50 j** | ❌ | Plus d'inscription possible. Le monde tourne entre les joueurs déjà présents. PvP, conquête, snowball borné par la fin programmée. |
| Terminé | `ENDED` | — | ❌ | Wipe planifié, leaderboard final figé, attribution des récompenses cosmétiques. |

**Durée totale par défaut : 🔧 60 jours (~2 mois)**, soit 7 j d'ouverture + 3 j retardataires + 50 j verrouillés. Le serveur fait tourner **plusieurs mondes en parallèle**, décalés dans le temps — un nouveau joueur arrivé après J+10 sur un monde rejoint le suivant en phase `OPEN`.

> 💡 **Pourquoi une sous-phase « Retardataires »** : la frontière brutale à J+7 fait perdre les joueurs qui découvrent le jeu juste après le pic d'ouverture. La fenêtre retardataires de 3 j est un sas qui rattrape ces inscriptions tardives sans dégrader l'équité (l'écart de 7-10 j sur un monde de 60 j reste rattrapable, surtout en compressed-async). Au-delà de J+10, le retard devient mécaniquement trop lourd — direction monde suivant.

> 📌 **Pourquoi 60 j et pas 120 j** : décision tranchée dans [`23` § Pourquoi ce pivot](./23-world-tempo-and-multipliers.md#1-pourquoi-ce-pivot). Avec un tempo compressé ~4-5×, l'endgame multi-village s'ouvre vers J+5-J+7. Sur 60 j, ça laisse ~50 j de pur endgame — plus que suffisant. Au-delà, on observait un risque de fatigue endgame avant le wipe.

> 🛠️ **Choix d'implémentation** : la sous-phase `Retardataires` reste dans le status `OPEN` (pas de nouvelle valeur dans `enum WorldStatus`, donc pas de migration). La distinction se fait via un champ `inscriptionPhase: 'main' | 'late'` calculé à la volée à partir de `world.startedAt` et des paramètres `WorldConfig` (`inscriptionMainDays: 7`, `inscriptionLateDays: 3`). Si on a besoin d'un véritable status distinct plus tard, on pourra étendre l'enum à ce moment-là.

## Pourquoi cette structure

Décision motivée par l'audit gameplay sur le **snowball de production** (cf. [`02-economy-and-progression.md` § Production](./02-economy-and-progression.md#production-de-ressources) — courbe `1.4^n` qui crée un écart ×20 entre lvl 1 et lvl 10, amplifié à ~×30-50 effectif via pillage et conquête). Sans cadre temporel, l'écart est **non borné** ; un latecomer face à un monde mature est instantanément hors-jeu.

La structure `OPEN → LOCKED → ENDED` apporte deux choses :

1. **Snowball borné dans le temps** : le top-player ne peut pas accumuler indéfiniment. Le monde a une fin programmée que tout le monde voit.
2. **Pas de latecomer dans un monde mature** : passé `LOCKED`, plus aucun nouveau joueur n'arrive. Le matchmaking de spawn (cohorte d'arrivée groupée Day 0-10) garantit qu'on joue avec des pairs, pas contre un voisin déjà à 100× sa puissance.

C'est le modèle canonique du segment (Tribal Wars, Kingsage, Rise of Kingdoms KvK), adapté aux exigences mobile 2026 via la compression du tempo intérieur (cf. [`23`](./23-world-tempo-and-multipliers.md)).

## Paramètres MVP

| Paramètre | Default 🔧 | Rationale |
| --- | ---: | --- |
| Durée cohorte principale (`OPEN` main) | 7 j | Aligné sur la durée totale 60 j (~12 % du monde). Laisse le temps d'attirer un cohort sans figer trop tôt. |
| Durée fenêtre retardataires (`OPEN` late) | 3 j | Sas pour rattraper les inscriptions juste après le pic. Au-delà, l'écart devient mécaniquement trop lourd. |
| Durée totale (`OPEN` + `LOCKED`) | 60 j | Sweet spot compressed-async : endgame ouvert à J+5-J+7, ~50 j de pur endgame multi-village. Cf. [`23` § TL;DR](./23-world-tempo-and-multipliers.md#tldr). |
| Multi-mondes simultanés | **autorisé** | Déjà supporté côté schéma (`WorldMembership` n-à-n). Un joueur peut être sur plusieurs mondes en parallèle (mondes décalés dans le temps, choix opt-in). Pas de cap au MVP. |
| Délai entre deux mondes | 🔧 7 j | Un nouveau monde `PLANNED → OPEN` toutes les ~7 j pour qu'un latecomer trouve toujours un monde frais à rejoindre rapidement (alternative explicite au sas retardataires). |
| `gridWidth` × `gridHeight` | 500 × 500 (existant) | Pas modifié au MVP. À recalibrer si la densité de joueurs ne tient pas. |
| **Tempo intérieur** (`tempo.global` et overrides) | 1.0 (référence Standard) | Voir [`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md) pour la mécanique complète et le catalogue des multipliers. |

Les 4 paramètres durée/fenêtre/multi/délai + le sous-objet `tempo` sont stockés au niveau **`WorldConfig`** (champ `world.config: Json`), pas en hard-code — ajustables sans migration.

## Cycle de transition entre status

### `PLANNED → OPEN`

Déclenchement : manuel (admin) ou planifié via cron.

À ce moment :
- `world.startedAt = now()`
- `world.endsAt = startedAt + 60 j` (default 🔧)
- Le monde apparaît dans la liste des mondes joignables côté frontend
- Job `BarbarianSeedingCatchupWorker` actif : le seeding initial des barbares se déclenche à chaque `JoinWorldUseCase` (sync), le worker complète les chunks lointains en catchup quotidien (cf. [`07-barbarian-spawning.md`](./07-barbarian-spawning.md))

### Bascule cohorte principale → retardataires

Pas de changement de status (le monde reste `OPEN`). À `startedAt + 7 j` (default 🔧), le sous-flag `inscriptionPhase` passe de `'main'` à `'late'`. Effets :

- Le monde reste joignable mais l'UI de sélection de monde affiche un avertissement (« lancé il y a {N} j ») et propose côte à côte un monde frais en phase `main` si disponible.
- Notification serveur : « La cohorte principale est complète. Inscription encore possible 3 jours en mode retardataires. »
- Aucun impact technique côté `JoinWorldUseCase` — les inscriptions sont toujours acceptées.

### `OPEN → LOCKED`

Déclenchement : job planifié à `startedAt + 10 j` (default 🔧 — `inscriptionMainDays + inscriptionLateDays`).

À ce moment :
- Le monde disparaît de la liste publique des mondes joignables
- `JoinWorldUseCase` rejette les **nouveaux entrants** (non-membres) ; les membres existants à 0 village (éliminés) peuvent réintégrer — cf. § Membre éliminé ci-dessous
- Aucun impact sur les joueurs déjà inscrits — gameplay continue normalement
- Notification serveur : « La fenêtre d'inscription est fermée. Le monde tourne maintenant entre ses {N} joueurs jusqu'au {endsAt}. »

### Membre éliminé — retour sur le monde

Un joueur membre d'un monde peut perdre son **dernier village** par conquête PvP (cf. [`14-pvp-conquest.md` § Perte du dernier village](./14-pvp-conquest.md#perte-du-dernier-village--état-éliminé)). Son `WorldMembership` est conservé ; il se retrouve dans un état `villageCount = 0`.

**Règle** : un membre existant à `villageCount = 0` peut **réintégrer le même monde**, même si ce monde est `LOCKED`.

| Cas | Comportement |
| --- | --- |
| Membre éliminé (`villageCount = 0`) sur monde `OPEN` | ✅ Retour autorisé — nouveau village initial créé |
| Membre éliminé (`villageCount = 0`) sur monde `LOCKED` | ✅ Retour autorisé — nouveau village initial créé |
| **Non-membre** sur monde `LOCKED` | ❌ Bloqué — `LOCKED` interdit les nouvelles inscriptions |
| Tout joueur sur monde `ENDED` | ❌ Bloqué — monde non jouable |

**Invariant** : `LOCKED` bloque les **nouveaux entrants**, pas le retour d'un membre déjà inscrit. `ENDED` reste non jouable dans tous les cas.

Le retour passe par `JoinWorldUseCase` : si le membre n'a aucun village et fournit un `villageName`, un village initial est créé avec les bâtiments, ressources et population d'onboarding standards — la même source de vérité que la première arrivée sur le monde. Aucun village supplémentaire n'est créé si le membre possède encore au moins un village (garde idempotente).

### `LOCKED → ENDED`

Déclenchement : job planifié à `endsAt` (= `startedAt + 60 j`, default 🔧).

À ce moment :
- Snapshot du leaderboard final persisté dans `WorldFinalRankingSnapshot` (cf. [`24-rankings.md` § Données sources](./24-rankings.md#donnees-sources) et [`data-model.md` § Classements finaux](../architecture/data-model.md#classements-finaux)) — 3 signaux : Puissance du Royaume, Gloire d'Assaut, Gloire du Rempart. Snapshot dans la même transaction Prisma que le changement de statut (rollback atomique si échec).
- Attribution des **récompenses cosmétiques permanentes** (titre, bannière du monde, badge profil global). Pas de carry-over de ressources, couronnes, ou progression entre mondes.
- Mode lecture seule : les joueurs peuvent encore consulter leur royaume mais plus d'action (raid, upgrade, conquête). `WorldAccessService.assertWorldWritable` appliqué sur toutes les mutations joueur — `ForbiddenException` 403 `WORLD_READ_ONLY` (cf. [`backend-modules.md` § Invariant monde ENDED](../architecture/backend-modules.md#invariant-monde-ended--lecture-seule)).
- Le monde reste consultable 🔧 7 j en `ENDED` puis archivé (données conservées pour stats globales, plus accessibles depuis l'UI).

**UI lecture seule (livrée par le run 066).** Le statut `ENDED` est exposé au frontend (`PublicWorldStatus`, `WorldMembershipResponse.status`) ainsi qu'un `lifecycle.archiveAt` dérivé (= `endsAt + archiveAfterDays`, default 7 j). Conséquences côté joueur :

- `WorldSessionGate` route un monde `ENDED` vers un écran « Monde terminé — consultation uniquement » au lieu de la `GameScreen` interactive (les mutations sont donc inatteignables côté UI, en plus du 403 backend). Le helper `isWorldReadOnly(status)` est la source unique de cette décision côté front.
- La liste `/worlds` continue d'afficher le monde `ENDED` (badge « Terminé », countdown vers `archiveAt`) ; le CTA renvoie vers le classement final, jamais vers une inscription/entrée.
- Le **Hall of fame** (3 classements snapshottés) est consultable par tout joueur, même non-membre, via `GET /worlds/:worldId/rankings/final` (cf. [`backend-modules.md`](../architecture/backend-modules.md)). Reste accessible pendant la phase `ENDED` ; inaccessible une fois `ARCHIVED` (run successeur 065).
- Réception WS `world.status.changed → ENDED` en session : bascule lecture seule sans rechargement (invalidation des caches mutables + toast).

## Wipe et récompenses fin de monde

**Décidé MVP : reset complet, cosmétique permanente uniquement.** Pas de méta-progression entre mondes — chaque monde est une page blanche.

| Élément | Sort en `ENDED` |
| --- | --- |
| Royaume du joueur (villages, bâtiments, armée) | Archivé puis purgé |
| Ressources stockées (bois, pierre, fer) | Reset (perdus avec le monde) |
| Couronnes accumulées | Reset (perdues avec le monde) |
| Statistiques personnelles (raids menés, conquêtes, etc.) | Conservées sur la fiche profil globale |
| **Récompenses cosmétiques** | **Permanentes**, attachées au compte global : titre du monde (ex : « Vainqueur de Avalon-3 »), bannière, badge profil |

**Comment c'est attribué (titres)** : à la transition `LOCKED → ENDED`, dans la même transaction que le snapshot leaderboard, le top 1 de chaque signal (`POWER`, `ASSAULT_GLORY`, `RAMPART_GLORY`) reçoit un titre cosmétique permanent (table `UserWorldCosmeticAward`, cf. [`architecture/data-model.md`](../architecture/data-model.md) § Classements finaux). Un champion gloire à score 0 (aucun PvP) n'est **pas** titré ; POWER l'est toujours (≥ 1 château ⇒ score > 0). Le `worldDisplayName` est snapshotté à l'attribution, donc le titre reste lisible après purge du monde — le wipe destructeur (run 065) **doit exclure** cette table. Lu côté profil via `GET /users/me/cosmetic-awards`. Périmètre livré : **titres seuls** (libellés FR centralisés `@battleforthecrown/shared/cosmetic`) ; bannière + badge visuel = follow-up UI/UX. Cosmétique only — jamais de bonus gameplay.

**Pourquoi pas de carry-over** : la méta-progression avantage mécaniquement les vétérans sur les mondes suivants — exactement le snowball qu'on vient de borner. Le carry-over cosmétique est suffisant pour la fierté joueur et la rétention long terme.

## Articulation avec les autres mécaniques

Cette spec **débloque ou impacte** plusieurs autres docs.

| Mécanique | Impact |
| --- | --- |
| **Bouclier débutant 48 h** ([`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde)) | Inchangé en valeur absolue (48 h temps réel, pas temps de jeu — cf. [`23` § Questions ouvertes](./23-world-tempo-and-multipliers.md#9-questions-ouvertes-à-trancher-en-playtest-pas-bloquantes-pour-cette-spec)). Reste pertinent pendant toute la fenêtre `OPEN` (cohorte principale **et** retardataires) — un joueur arrivant J+9 (dernier jour retardataire) a toujours ses 48 h de protection qui finissent J+11, soit juste après le `LOCKED`. Pas de conflit. |
| **Abandon 14 j** ([`18-inactivity-and-abandonment.md`](./18-inactivity-and-abandonment.md)) | À recalibrer post-MVP. 14 j sur un monde de 60 j = ~23 % de la durée — sans doute à descendre à ~7 j sur Standard. À traiter quand le mécanisme sortira du chantier. |
| **Classements** ([`24-rankings.md`](./24-rankings.md)) | Snapshot leaderboard à `ENDED`, rewards cosmétiques permanents, et séparation entre cycles courts et classement de monde entier. |
| **Spawn barbare** ([`07-barbarian-spawning.md`](./07-barbarian-spawning.md)) | À ajuster : densité barbare cible doit tenir compte du fait que ~95 % des joueurs arriveront dans la fenêtre `OPEN` totale de 10 j (cohorte principale + retardataires) — pic de seeding sur ~7 j puis queue plus courte. |
| **Snowball production** ([`02-economy-and-progression.md`](./02-economy-and-progression.md)) | Borné par 60 j + tempo compressé. La courbe `1.4^n` reste agressive mais l'écart ne s'accumule plus indéfiniment. Pas de modification de la courbe — c'est le tempo qui change le rythme d'accumulation, cf. [`23`](./23-world-tempo-and-multipliers.md). |
| **Couronnes** ([`02-economy-and-progression.md` § Couronnes](./02-economy-and-progression.md#couronnes)) | Le calage cible (« 3 j de revenu pour 5 000 couronnes ») est exprimé à `tempo.global = 1.0`. À recalibrer dans la passe d'ajustement des chiffres absolus (cf. [`23` § Impacts à recalibrer](./23-world-tempo-and-multipliers.md#7-impacts-à-recalibrer-dans-les-autres-docs)). |
| **Tempo intérieur** ([`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md)) | Source de vérité pour les vitesses (construction, training, capture, régen, production, couronnes). Cette spec gère la **fenêtre temporelle**, le `23` gère le **rythme intérieur**. |
| **État éliminé / retour après conquête** ([`14-pvp-conquest.md` § Perte du dernier village](./14-pvp-conquest.md#perte-du-dernier-village--état-éliminé)) | Perte du dernier village → `WorldMembership` conservé, retour possible y compris en `LOCKED`. Cf. § Membre éliminé ci-dessus. |

## Questions ouvertes (à trancher en playtest, pas bloquantes pour le MVP)

| Question | Position de réflexion actuelle |
| --- | --- |
| **Annonce du wipe** | Compte-à-rebours visible côté joueur dès `LOCKED` (J+10) ? Ou seulement à T-7 j de `ENDED` pour ne pas démotiver le late-game ? Probablement compte-à-rebours permanent (transparence > suspense). |
| **Phase `ENDED` interactive** | Mode lecture seule pure, ou possibilité de "tournoi final" (genre 7 j de baroud final sans nouvelle inscription) ? Au MVP : lecture seule pure. |
| **Migration des comptes-zombies** | Que fait-on des joueurs inactifs en fin de monde ? Probablement rien (purge avec le wipe), couvert par la spec [`18-inactivity-and-abandonment.md`](./18-inactivity-and-abandonment.md). |
| **Récompenses cosmétiques** | Catalogue précis (titre seul, bannière, badge ?) à définir avec le travail UI/UX. Pas bloquant. |
| **Première dérogation** | Le **tout premier monde** lancé en MVP doit-il avoir une fenêtre d'inscription plus longue (30 j ?) pour absorber le launch organique ? À discuter au moment du go-live. |
| **Visibilité du leaderboard final** | Consultable indéfiniment depuis la fiche profil global, ou seulement pendant la phase `ENDED` ? |

## Liens

- [`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md) — **rythme intérieur** du monde (multipliers de vitesse). Complément direct de cette spec.
- [`01-overview.md`](./01-overview.md) — vision globale (à mettre à jour pour refléter la fin programmée du monde).
- [`02-economy-and-progression.md`](./02-economy-and-progression.md) — courbe de production et formule des couronnes (consommatrices indirectes de la durée du monde).
- [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) — densité barbare adaptative à recaler sur le pic de seeding J0-J7.
- [`09-power-and-rankings.md`](./09-power-and-rankings.md) — puissance.
- [`24-rankings.md`](./24-rankings.md) — classements et leaderboard final.
- [`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) — protection 48 h, indépendante du cycle de monde mais activée à chaque arrivée.
- [`14-pvp-conquest.md` § Perte du dernier village](./14-pvp-conquest.md#perte-du-dernier-village--état-éliminé) — comportement à l'élimination PvP, `WorldMembership` conservé, pas de bouclier ni self-reset.
- [`18-inactivity-and-abandonment.md`](./18-inactivity-and-abandonment.md) — abandon 14 j, à recalibrer si nécessaire post-MVP.
- Backend : `world.controller.ts` + `join-world.use-case.ts` — `ENDED` toujours bloqué ; `LOCKED` bloque les non-membres mais autorise le retour d'un membre existant. Champs `world.startedAt` / `world.endsAt` / `world.status` / `world.plannedOpenAt` en schéma. `GET /worlds/public` expose l'identité, le lifecycle dérivé, les durées de sous-phase d'inscription (`inscriptionMainDays`, `inscriptionLateDays`), la durée du bouclier débutant (`newbieShieldHours`), les dimensions publiques de carte (`gridWidth × gridHeight`) et les mondes `PLANNED | OPEN | LOCKED` pour l'écran de sélection et la page détail.
