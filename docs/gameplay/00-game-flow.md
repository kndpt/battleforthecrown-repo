# Game flow — à quoi ressemble le jeu

> 📖 **Doc vivante.** Vue d'ensemble narrative du déroulement d'un monde, du lancement au wipe. Sert de **point d'entrée gameplay** pour la communication (pitch, marketing, onboarding équipe), la planification de tests / playtests, et la priorisation produit. À mettre à jour dès qu'une mécanique change ou qu'un sujet post-MVP entre dans le scope.
>
> Ce doc **ne duplique pas** les specs : il les **assemble dans l'ordre chronologique vécu par le joueur** et renvoie à la source pour chaque chiffre/formule.

## TL;DR

Un monde Battle for the Crown dure **~2 mois (60 j)** ([19](./19-world-lifecycle.md)) en **tempo compressé-async** (~4-5× plus rapide qu'un slow-MMORTS classique, cf. [23](./23-world-tempo-and-multipliers.md)). 7 j d'inscriptions massives + 3 j de retardataires + ~50 j en cohorte verrouillée. Pendant ces 60 j, chaque joueur fait tourner 4 boucles (économie, militaire, exploration, conquête, cf. [01](./01-overview.md#boucles-de-gameplay)) en sessions courtes mobile (2-5 min, plusieurs fois/jour), avec des cartes quotidiennes personnelles et des Oyez qui donnent un contexte monde léger ([05](./05-daily-cards-and-oyez.md)). À `endsAt` : wipe complet, seuls les cosmétiques restent. Le serveur enchaîne les saisons en parallèle, un nouveau monde toutes les ~7 j.

---

## 1. T-?? — Préparation (`PLANNED`)

Le monde est créé (admin ou cron). Status `PLANNED`, **invisible** dans la liste des mondes joignables. Aucun joueur, aucun barbare. Cf. [`19` § PLANNED → OPEN](./19-world-lifecycle.md#planned--open).

## 2. J0 — Ouverture (`OPEN` / cohorte principale, 7 j)

`world.startedAt = now()`, `world.endsAt = startedAt + 60 j`. Le monde apparaît dans la liste publique.

**Ce qu'un joueur fait à l'inscription** :

1. Crée son compte (`POST /auth/register`).
2. Choisit un monde dans la liste (les mondes en cohorte principale sont mis en avant).
3. Rejoint avec un nom de village (`POST /world/:id/join`) → spawn d'un premier village.
4. Bénéficie du **bouclier débutant 48 h** (intouchable PvP, cf. [`14` § Bouclier débutant](./14-pvp-conquest.md#3-bouclier-débutant--48-h-à-larrivée-sur-le-monde)).
5. Lance le **tuto guidé** (6 étapes scriptées : 1ᵉʳ upgrade éco → 1ᵉʳ raid barbare T1 → 1ᵉʳ Watchtower → 1ᵉʳ scout → TBD, cf. [`15`](./15-onboarding.md)).
6. Voit le **seeding barbare adaptatif** se générer autour de lui (T1 proches faciles, T2-T5 plus loin et plus dangereux, cf. [`07`](./07-barbarian-spawning.md)).

À l'échelle du monde : **pic d'arrivée Day 0**, queue d'inscriptions sur 7 j. Cette cohorte jouera ensemble jusqu'à `ENDED`.

## 3. J+7 → J+10 — Retardataires (`OPEN` / `inscriptionPhase = late`)

Status techniquement inchangé. La liste de mondes affiche un avertissement (« lancé il y a {N} j ») et propose un monde frais à côté. Sas de rattrapage pour les inscriptions juste après le pic. Détail : [`19` § Bascule cohorte → retardataires](./19-world-lifecycle.md#bascule-cohorte-principale--retardataires).

## 4. J+10 — Verrouillage (`LOCKED`, ~50 j)

Job planifié → le monde **disparaît** de la liste publique. `JoinWorldUseCase` rejette tout nouvel arrivant ([`19` § OPEN → LOCKED](./19-world-lifecycle.md#open--locked)). Plus aucun latecomer. Les inscrits continuent normalement.

C'est ici que **commence le vrai jeu long** : ~50 jours entre joueurs déjà connus, snowball borné par la fin programmée et accéléré par le tempo compressé (la première conquête arrive typiquement vers J+5-J+7, l'endgame multi-village s'étale donc sur la quasi-totalité de la phase `LOCKED`).

## 5. Entre J0 et J+60 — ce que les joueurs **font** réellement

4 boucles imbriquées qui tournent en parallèle, en sessions courtes mobile.

### Boucle économique

Production passive de **Bois / Pierre / Fer** par les bâtiments producteurs ; **Population** générée par le Quartier (par village, pas de pool global) ; **Couronnes** générées par la puissance bâtiments cumulée. L'**Entrepôt** plafonne le stock — plein → la production stagne. Courbe `1.4^n` par niveau de bâtiment. Détails : [`02`](./02-economy-and-progression.md), [`03`](./03-buildings.md).

### Boucle militaire

Recrutement à la **Caserne** (file unique par village, consomme Pop), envoi d'**expéditions** vers villages barbares pour piller. Combat **automatique** : stats unitaires + bonus de **style de village** (Forteresse / Raiders / Économique / Équilibré, débloqué via Salle du Conseil — cf. [`12`](./12-village-styles.md)). Mort = pop libérée immédiatement à la résolution du combat ([`02` § Population](./02-economy-and-progression.md#population)). Détails combat : [`04`](./04-combat.md), unités : [`08`](./08-units.md), barbares : [`06`](./06-barbarians.md).

### Boucle d'exploration

**Watchtower** (vision = union de disques de toutes mes tours, lvl 1 = 10 cases, lvl 10 = 55 cases). Aucune tour ne révèle tout le monde seule : voir loin exige de conquérir ou développer des villages à des positions stratégiques. Hors vision : *blip* gris anonyme pour les villages, **rien** pour les expéditions. Filtré server-side, pas seulement UI ([`01` § Exploration](./01-overview.md#exploration--brouillard-de-guerre)). **Espionnage** via l'unité ESPION pour révéler une cible spécifique ([`11`](./11-scouting.md)). Le MVP garde ensuite une dernière intel connue privée par cible et affiche une menace estimée non exacte avant attaque.

### Boucle de conquête (end-game)

Château 6 → débloque **Salle du Trône** → recrute un **Seigneur** (5 000 / 5 000 / 5 000 / 5 000 cour. / 15 pop / 8 h, cf. [`10` § Coût](./10-conquest.md#coût-de-recrutement-du-seigneur)). Escorte obligatoire en pratique. Lancement contre un village :

1. **Combat de pré-conquête**. Si toutes les troupes ennemies tombent et le Seigneur survit → installation.
2. **Période de capture variable** : 4 h (T2 / Château 1-2) → 18 h (Château 9-10), cf. [`14` § Période de capture](./14-pvp-conquest.md#période-de-capture-variable-selon-le-niveau-du-château) et [`13`](./13-barbarian-conquest.md).
3. **Fenêtre vulnérable** : défenseur d'origine + tiers opportunistes peuvent attaquer pour tuer la garnison.
4. **Survit la fenêtre** → village transféré, ressources reset, bâtiments + Quartier hérités tels quels, Seigneur sacrifié (devient Seigneur du village conquis, plus dispo pour une autre conquête).

### Rétention mobile superposée

- **Cartes quotidiennes** : 1 carte / jour, backlog limité, tâches naturelles, récompense modérée ([`05`](./05-daily-cards-and-oyez.md#cartes-quotidiennes)).
- **Oyez** : contexte monde léger qui oriente les cartes et la priorité du moment, sans bonus snowballant ([`05`](./05-daily-cards-and-oyez.md#oyez)).
- **Notifications push** : retour mobile au bon moment (attaque entrante, retour d'armée, fin de capture, etc. — cf. [`16`](./16-notifications.md)).

### Garde-fous PvP en continu

- **Bouclier débutant 48 h** à l'arrivée (cf. § J0 ci-dessus).
- **Règle puissance ÷ 3** : interdiction d'attaquer un joueur dont la puissance défensive est < 1/3 de l'attaquant. Borne le snowball top-player ([`14` § Garde-fous](./14-pvp-conquest.md#garde-fous-anti-snowball)).
- **Pas de cap dur** sur le nombre de villages — régulation naturelle par la difficulté de tout défendre ([`10` § Garde-fous globaux](./10-conquest.md#garde-fous-globaux)).

### Dynamiques de monde vivant

- **Abandon** : 14 j sans login → village abandonné, peut être repris par les barbares (*post-MVP*, [`18`](./18-inactivity-and-abandonment.md)).
- **Reprise barbare** des villages abandonnés → la carte respire, les zones évoluent ([`01` § Monde persistant](./01-overview.md#monde-persistant-et-raids)).
- **Amis défensifs** (cap 5, renforts mutuels) — candidate MVP minimaliste ([`20`](./20-defensive-friends.md)).
- **Inbox + rapports** persistants (combat, scout, retour, conquête) — esquisse MVP ([`17`](./17-inbox-and-reports.md)).
- **Notifications push** (attaque entrante, fin de capture, fin de construction) — esquisse MVP ([`16`](./16-notifications.md)).
- **Rôles privés de villages** (`Favori`, `Raid`, `Défense`, etc.) — navigation multi-village sans bonus mécanique ([`22`](./22-village-roles-and-navigation.md)).

## 6. J+60 — Fin (`LOCKED → ENDED`)

Job planifié à `endsAt` :

- **Snapshot du leaderboard final** figé.
- **Récompenses cosmétiques permanentes** sur le compte global : titre (« Vainqueur de Avalon-3 »), bannière, badge profil.
- **Mode lecture seule** : on consulte son royaume, plus aucune action.
- **Pas de carry-over** : ressources, couronnes, villages → reset. Stats personnelles conservées sur la fiche profil global.

Détail : [`19` § Wipe et récompenses](./19-world-lifecycle.md#wipe-et-récompenses-fin-de-monde).

## 7. J+67 — Archivage

Le monde reste consultable 7 j en `ENDED` puis sort de l'UI. Données conservées pour stats globales.

---

## En parallèle : plusieurs mondes simultanés

Un nouveau monde `PLANNED → OPEN` toutes les ~7 j ([`19` § Paramètres MVP](./19-world-lifecycle.md#paramètres-mvp)). Un joueur peut être inscrit sur plusieurs mondes en parallèle (mondes décalés, opt-in). Pas de cap MVP. Un latecomer trouve toujours un monde frais à rejoindre.

---

## Articulation post-MVP attendue

| Sujet | Spec | Impact game flow |
| --- | --- | --- |
| **Alliances / tribus** | [`21`](./21-alliances-and-tribes.md) | Renforts d'alliés pendant la fenêtre de capture, diplomatie, guerres coordonnées. Change radicalement le mid/late-game. |
| **Classements hebdo** | [`09` § Classements](./09-power-and-rankings.md#classements) | Récompenses périodiques pendant le monde, pas seulement à `ENDED`. |
| **Marché royal** | [`01` § Extensions](./01-overview.md#extensions-post-mvp) | Échanges entre joueurs, brise le « pas de transfert » MVP. |
| **Zones d'influence** | [`01` § Monde persistant](./01-overview.md#monde-persistant-et-raids) | Bonus déplacement entre villages proches, perdu si ennemi s'intercale. À spécifier post-playtest. |
| **Unités destructrices de bâtiments** | [`14` § Bâtiments hérités](./14-pvp-conquest.md#bâtiments-hérités) | Permettent d'affaiblir un voisin sans le conquérir. La conquête héritera naturellement de l'état dégradé. |

## Liens

Ordre chronologique de lecture pour comprendre le jeu de bout en bout :

1. [`01-overview.md`](./01-overview.md) — vision, principes, boucles.
2. [`19-world-lifecycle.md`](./19-world-lifecycle.md) + [`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md) — cycle de vie du monde (durée 60 j, fenêtres) + tempo compressé-async (multipliers `WorldConfig.tempo`).
3. [`02-economy-and-progression.md`](./02-economy-and-progression.md) — ressources, pop, couronnes.
4. [`03-buildings.md`](./03-buildings.md) — catalogue bâtiments.
5. [`08-units.md`](./08-units.md) + [`04-combat.md`](./04-combat.md) — troupes et résolution.
6. [`06-barbarians.md`](./06-barbarians.md) + [`07-barbarian-spawning.md`](./07-barbarian-spawning.md) — adversaires neutres.
7. [`10-conquest.md`](./10-conquest.md) + [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) + [`14-pvp-conquest.md`](./14-pvp-conquest.md) — boucle long terme.
8. [`05-daily-cards-and-oyez.md`](./05-daily-cards-and-oyez.md) — cartes quotidiennes et Oyez.
9. [`12-village-styles.md`](./12-village-styles.md) — styles stratégiques.
10. [`11-scouting.md`](./11-scouting.md) — espionnage.
11. [`09-power-and-rankings.md`](./09-power-and-rankings.md) — puissance, classements.
12. [`15`](./15-onboarding.md), [`16`](./16-notifications.md), [`17`](./17-inbox-and-reports.md), [`18`](./18-inactivity-and-abandonment.md), [`20`](./20-defensive-friends.md), [`21`](./21-alliances-and-tribes.md), [`22`](./22-village-roles-and-navigation.md) — esquisses MVP / post-MVP.
