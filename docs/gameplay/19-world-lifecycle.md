# Cycle de vie d'un monde

> ✅ **Spec MVP tranchée.** Les paramètres chiffrés (durée du monde, fenêtre d'inscription, etc.) sont des **defaults** marqués 🔧 — ajustables au runtime par `WorldConfig` si le playtest le justifie. Les sous-questions purement opérationnelles (UX du compte-à-rebours, leaderboard final, etc.) sont en bas dans § Questions ouvertes.

## Vue d'ensemble

Un monde Battle for the Crown est **borné dans le temps**. Quatre status successifs (déjà en place côté schéma : `enum WorldStatus { PLANNED, OPEN, LOCKED, ENDED }`).

| Phase | Status | Durée | Inscription nouveaux joueurs | Gameplay |
| --- | --- | ---: | :---: | --- |
| Préparation | `PLANNED` | variable | ❌ | Monde créé, pas encore ouvert |
| **Ouverture** | `OPEN` (cohorte principale) | **🔧 14 j** | ✅ | Tout joueur peut rejoindre. Spawn flot massif Day 0 + arrivées progressives jusqu'à J+14. |
| **Retardataires** | `OPEN` (sous-phase) | **🔧 7 j** | ✅ avec avertissement UI | Inscription encore possible, mais le monde tourne depuis 2 semaines. L'UI signale le retard (« monde lancé il y a {N} j — voir aussi un monde plus frais ») pour que le joueur fasse un choix éclairé. |
| **Verrouillé** | `LOCKED` | **🔧 ~99 j** | ❌ | Plus d'inscription possible. Le monde tourne entre les joueurs déjà présents. PvP, conquête, snowball borné par la fin programmée. |
| Terminé | `ENDED` | — | ❌ | Wipe planifié, leaderboard final figé, attribution des récompenses cosmétiques. |

**Durée totale par défaut : 🔧 120 jours (~4 mois)**, soit 14 j d'ouverture + 7 j retardataires + 99 j verrouillés. Le serveur fait tourner **plusieurs mondes en parallèle**, décalés dans le temps — un nouveau joueur arrivé après J+21 sur un monde rejoint le suivant en phase `OPEN`.

> 💡 **Pourquoi une sous-phase « Retardataires »** : la frontière brutale à J+14 fait perdre les joueurs qui découvrent le jeu juste après le pic d'ouverture. La fenêtre retardataires de 7 j est un sas qui rattrape ces inscriptions tardives sans dégrader l'équité (l'écart de 14-21 j sur un monde de 120 j reste rattrapable). Au-delà de J+21, le retard devient mécaniquement trop lourd — direction monde suivant.

> 🛠️ **Choix d'implémentation** : la sous-phase `Retardataires` reste dans le status `OPEN` (pas de nouvelle valeur dans `enum WorldStatus`, donc pas de migration). La distinction se fait via un champ `inscriptionPhase: 'main' | 'late'` calculé à la volée à partir de `world.startedAt` et des paramètres `WorldConfig` (`inscriptionMainDays: 14`, `inscriptionLateDays: 7`). Si on a besoin d'un véritable status distinct plus tard, on pourra étendre l'enum à ce moment-là.

## Pourquoi cette structure

Décision motivée par l'audit gameplay sur le **snowball de production** (cf. [`02-economy-and-progression.md` § Production](./02-economy-and-progression.md#production-de-ressources) — courbe `1.4^n` qui crée un écart ×20 entre lvl 1 et lvl 10, amplifié à ~×30-50 effectif via pillage et conquête). Sans cadre temporel, l'écart est **non borné** ; un latecomer face à un monde mature est instantanément hors-jeu.

La structure `OPEN → LOCKED → ENDED` apporte deux choses :

1. **Snowball borné dans le temps** : le top-player ne peut pas accumuler indéfiniment. Le monde a une fin programmée que tout le monde voit.
2. **Pas de latecomer dans un monde mature** : passé `LOCKED`, plus aucun nouveau joueur n'arrive. Le matchmaking de spawn (cohorte d'arrivée groupée Day 0–14) garantit qu'on joue avec des pairs, pas contre un voisin déjà à 100× sa puissance.

C'est le modèle canonique du segment (Tribal Wars, Kingsage, Lords Mobile à l'ouverture). Validé par décennies de PvP MMORTS.

## Paramètres MVP

| Paramètre | Default 🔧 | Rationale |
| --- | ---: | --- |
| Durée cohorte principale (`OPEN` main) | 14 j | Aligné sur le segment. Laisse le temps d'attirer un cohort sans figer trop tôt. |
| Durée fenêtre retardataires (`OPEN` late) | 7 j | Sas pour rattraper les inscriptions juste après le pic. Au-delà, l'écart devient mécaniquement trop lourd. |
| Durée totale (`OPEN` + `LOCKED`) | 120 j | Entre saison courte (90 j, trop pressant pour le late-game) et Tribal Wars classique (6+ mois, trop lent à wipe). 4 mois = ~3 sessions/jour × 100 j de jeu hors fenêtre d'inscription = cible de progression réaliste. |
| Multi-mondes simultanés | **autorisé** | Déjà supporté côté schéma (`WorldMembership` n-à-n). Un joueur peut être sur plusieurs mondes en parallèle (mondes décalés dans le temps, choix opt-in). Pas de cap au MVP. |
| Délai entre deux mondes | 🔧 7 j | Un nouveau monde `PLANNED → OPEN` toutes les ~7 j pour qu'un latecomer trouve toujours un monde frais à rejoindre rapidement (alternative explicite au sas retardataires). |
| `gridWidth` × `gridHeight` | 500 × 500 (existant) | Pas modifié au MVP. À recalibrer si la densité de joueurs ne tient pas. |

Les 4 paramètres durée/fenêtre/multi/délai sont stockés au niveau **`WorldConfig`** (champ `world.config: Json`), pas en hard-code — ajustables sans migration.

## Cycle de transition entre status

### `PLANNED → OPEN`

Déclenchement : manuel (admin) ou planifié via cron.

À ce moment :
- `world.startedAt = now()`
- `world.endsAt = startedAt + 120 j` (default 🔧)
- Le monde apparaît dans la liste des mondes joignables côté frontend
- Job `BarbarianBackfillWorker` actif : seed des barbares se déclenche à chaque `JoinWorldUseCase` (cf. [`07-barbarian-spawning.md`](./07-barbarian-spawning.md))

### Bascule cohorte principale → retardataires

Pas de changement de status (le monde reste `OPEN`). À `startedAt + 14 j` (default 🔧), le sous-flag `inscriptionPhase` passe de `'main'` à `'late'`. Effets :

- Le monde reste joignable mais l'UI de sélection de monde affiche un avertissement (« lancé il y a {N} j ») et propose côte à côte un monde frais en phase `main` si disponible.
- Notification serveur : « La cohorte principale est complète. Inscription encore possible 7 jours en mode retardataires. »
- Aucun impact technique côté `JoinWorldUseCase` — les inscriptions sont toujours acceptées.

### `OPEN → LOCKED`

Déclenchement : job planifié à `startedAt + 21 j` (default 🔧 — `inscriptionMainDays + inscriptionLateDays`).

À ce moment :
- Le monde disparaît de la liste publique des mondes joignables
- `JoinWorldUseCase` rejette les nouvelles arrivées (déjà câblé, cf. `join-world.use-case.ts:40` — `if (world.status === 'LOCKED' || world.status === 'ENDED') throw BadRequestException`)
- Aucun impact sur les joueurs déjà inscrits — gameplay continue normalement
- Notification serveur : « La fenêtre d'inscription est fermée. Le monde tourne maintenant entre ses {N} joueurs jusqu'au {endsAt}. »

### `LOCKED → ENDED`

Déclenchement : job planifié à `endsAt` (= `startedAt + 120 j`, default 🔧).

À ce moment :
- Snapshot du leaderboard final (cf. [`09-power-and-rankings.md`](./09-power-and-rankings.md) — réactivable même si les classements hebdo sont post-MVP).
- Attribution des **récompenses cosmétiques permanentes** (titre, bannière du monde, badge profil global). Pas de carry-over de ressources, couronnes, ou progression entre mondes.
- Mode lecture seule : les joueurs peuvent encore consulter leur royaume mais plus d'action (raid, upgrade, conquête).
- Le monde reste consultable 🔧 7 j en `ENDED` puis archivé (données conservées pour stats globales, plus accessibles depuis l'UI).

## Wipe et récompenses fin de monde

**Décidé MVP : reset complet, cosmétique permanente uniquement.** Pas de méta-progression entre mondes — chaque monde est une page blanche.

| Élément | Sort en `ENDED` |
| --- | --- |
| Royaume du joueur (villages, bâtiments, armée) | Archivé puis purgé |
| Ressources stockées (bois, pierre, fer) | Reset (perdus avec le monde) |
| Couronnes accumulées | Reset (perdues avec le monde) |
| Statistiques personnelles (raids menés, conquêtes, etc.) | Conservées sur la fiche profil globale |
| **Récompenses cosmétiques** | **Permanentes**, attachées au compte global : titre du monde (ex : « Vainqueur de Avalon-3 »), bannière, badge profil |

**Pourquoi pas de carry-over** : la méta-progression avantage mécaniquement les vétérans sur les mondes suivants — exactement le snowball qu'on vient de borner. Le carry-over cosmétique est suffisant pour la fierté joueur et la rétention long terme.

## Articulation avec les autres mécaniques

Cette spec **débloque ou impacte** plusieurs autres docs.

| Mécanique | Impact |
| --- | --- |
| **Bouclier débutant 48 h** ([`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde)) | Inchangé. Reste pertinent pendant toute la fenêtre `OPEN` (cohorte principale **et** retardataires) — un joueur arrivant J+20 (dernier jour retardataire) a toujours ses 48 h de protection qui finissent J+22, soit juste après le `LOCKED`. Pas de conflit. |
| **Abandon 14 j** ([`18-inactivity-and-abandonment.md`](./18-inactivity-and-abandonment.md)) | Validé. 14 j sur un monde de 120 j = ~12 % de la durée — proportion saine. À reconfirmer en post-MVP quand on traitera le mécanisme. |
| **Classements** ([`09-power-and-rankings.md`](./09-power-and-rankings.md)) | Post-MVP. Le rework des récompenses doit intégrer la fin de monde (snapshot leaderboard à `ENDED`, récompenses séparées des cycles hebdo). |
| **Spawn barbare** ([`07-barbarian-spawning.md`](./07-barbarian-spawning.md)) | À ajuster : densité barbare cible doit tenir compte du fait que ~95 % des joueurs arriveront dans la fenêtre `OPEN` totale de 21 j (cohorte principale + retardataires) — pic de seeding sur ~14 j puis queue plus longue. |
| **Snowball production** ([`02-economy-and-progression.md`](./02-economy-and-progression.md)) | Borné par 120 j. La courbe `1.4^n` reste agressive mais l'écart ne s'accumule plus indéfiniment. Pas de modification de la courbe au MVP. |
| **Couronnes** ([`02-economy-and-progression.md` § Couronnes](./02-economy-and-progression.md#couronnes)) | Calage cible de 3 j de revenu pour 5 000 couronnes (Seigneur) → 120 j permet ~40 cycles de Seigneurs au mid-game. Cohérent avec une vraie boucle de conquête. |

## Questions ouvertes (à trancher en playtest, pas bloquantes pour le MVP)

| Question | Position de réflexion actuelle |
| --- | --- |
| **Annonce du wipe** | Compte-à-rebours visible côté joueur dès J+14 ? Ou seulement à T-7 j de `ENDED` pour ne pas démotiver le late-game ? Probablement compte-à-rebours permanent (transparence > suspense). |
| **Phase `ENDED` interactive** | Mode lecture seule pure, ou possibilité de "tournoi final" (genre 7 j de baroud final sans nouvelle inscription) ? Au MVP : lecture seule pure. |
| **Migration des comptes-zombies** | Que fait-on des joueurs inactifs en fin de monde ? Probablement rien (purge avec le wipe), couvert par la spec [`18-inactivity-and-abandonment.md`](./18-inactivity-and-abandonment.md). |
| **Récompenses cosmétiques** | Catalogue précis (titre seul, bannière, badge ?) à définir avec le travail UI/UX. Pas bloquant. |
| **Première dérogation** | Le **tout premier monde** lancé en MVP doit-il avoir une fenêtre d'inscription plus longue (30 j ?) pour absorber le launch organique ? À discuter au moment du go-live. |
| **Visibilité du leaderboard final** | Consultable indéfiniment depuis la fiche profil global, ou seulement pendant la phase `ENDED` ? |

## Liens

- [`01-overview.md`](./01-overview.md) — vision globale (à mettre à jour pour refléter la fin programmée du monde).
- [`02-economy-and-progression.md`](./02-economy-and-progression.md) — courbe de production et formule des couronnes (consommatrices indirectes de la durée du monde).
- [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) — densité barbare adaptative à recaler sur le pic de seeding J0-J14.
- [`09-power-and-rankings.md`](./09-power-and-rankings.md) — classements (post-MVP) et leaderboard final.
- [`14-pvp-conquest.md` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde) — protection 48 h, indépendante du cycle de monde mais activée à chaque arrivée.
- [`18-inactivity-and-abandonment.md`](./18-inactivity-and-abandonment.md) — abandon 14 j, à recalibrer si nécessaire post-MVP.
- Backend : `world.controller.ts` + `join-world.use-case.ts` — déjà câblés pour rejeter `LOCKED`/`ENDED`. Champs `world.startedAt` / `world.endsAt` / `world.status` déjà en schéma.
