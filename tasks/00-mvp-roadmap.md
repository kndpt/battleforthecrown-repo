# Roadmap MVP — ordre d'implémentation des features

> 📌 **Vue stratégique, pas un découpage de tâches.** Document directeur qui pose **dans quel ordre** on attaque les chantiers gameplay non encore codés. Les tâches détaillées (tickets actionables) seront dérivées phase par phase, au moment d'attaquer chaque phase.
>
> Hypothèse de travail : tout doit être codé avant la sortie — l'ordre n'optimise donc pas un time-to-market mais le **confort de développement** : chaque feature livrée se teste IG immédiatement, on évite le retravail (coder X puis devoir y revenir parce que Y l'impacte), on voit le jeu prendre forme plutôt que d'accumuler de la plomberie invisible.

## Principes directeurs

1. **Transverses d'abord** : les fondations consommées par plusieurs features (inbox) avant les features qui en dépendent.
2. **Producteur avant consommateur** : si A produit une donnée que B affiche, coder A en premier (ex : style avant scout).
3. **UX-prérequis avant feature** : si la jouabilité d'une feature dépend d'une autre, coder la dépendance avant (ex : notifications avant conquête PvP).
4. **Plomberie de cycle à la fin** : onboarding et world lifecycle se construisent **par-dessus** un jeu déjà jouable, pas avant.
5. **Pas d'audit code dans ce document** — il sera fait **dans** la phase 1.

## Phases

### Phase 1 — Consolidation de l'existant

Objectif : auditer le code actuel contre les specs **déjà tranchées**, combler les écarts, fiabiliser ce qui sert de base aux phases suivantes.

Specs concernées : [`02`](../docs/gameplay/02-economy-and-progression.md), [`03`](../docs/gameplay/03-buildings.md), [`04`](../docs/gameplay/04-combat.md), [`06`](../docs/gameplay/06-barbarians.md), [`08`](../docs/gameplay/08-units.md), [`10`](../docs/gameplay/10-conquest.md).

Cas particulier : [`07-barbarian-spawning.md`](../docs/gameplay/07-barbarian-spawning.md) finalisée par le run [`007`](./runs/archive/007-audit-barbarian-spawning.md) (Branche A, 2026-05-10) — distribution T1-T5, anti-submersion, catchup d'arrivée. Bandeau « doc en chantier » levé.

Critère de fin : pour chaque spec ci-dessus, soit le code est conforme, soit l'écart est ticketé pour exécution **dans** cette phase. Aucune feature nouvelle ne démarre tant que la phase 1 n'est pas close.

### Phase 2 — Inbox & rapports

Spec : [`17-inbox-and-reports.md`](../docs/gameplay/17-inbox-and-reports.md) (MVP combat livré par le run [`012`](./runs/archive/012-feature-inbox-combat-reports.md), clôturé par le run [`015`](./runs/archive/015-close-phase-2-inbox-reports.md)).

Pourquoi ici : fondation transverse. Combat, scout, retour d'armée, conquête écriront tous dans l'inbox. Si on la code après ces features, on rouvre chacune pour y injecter le rapport.

Livrable MVP livré : `CombatReport` comme source persistante Phase 2, API REST minimale, invalidation WS via `battle.resolved` / `village.attacked`, écran rapports côté Pixi/HUD, badge non-lu et lu/suppression par participant.

Critère de fin : un combat qui s'achève laisse un rapport persistant lisible dans l'inbox côté joueur, marquage lu/non-lu fonctionnel.

Statut : ✅ **clos MVP combat**. Scout, conquête détaillée, push deep-link, filtres, pin, archive et rétention automatique restent hors scope Phase 2 et seront traités par leurs phases dédiées ou post-MVP.

### Phase 3 — Styles de village

Spec : [`12-village-styles.md`](../docs/gameplay/12-village-styles.md).

Pourquoi ici : couche tactique sur le combat (déjà codé), prérequis pour que le scout (phase suivante) ait quelque chose à révéler. Débloqué via la Salle du Conseil (déjà au catalogue bâtiments [`03`](../docs/gameplay/03-buildings.md)).

Livrable : choix de style par village, application des bonus dans la résolution combat, persistance, exposition côté API/WS.

Critère de fin : un village avec style « Forteresse » subit moins de pertes en défense qu'un village « Équilibré » de même compo, vérifié IG par un combat scripté.

### Phase 4 — Scouting

Spec : [`11-scouting.md`](../docs/gameplay/11-scouting.md).

Pourquoi ici : feature transverse autonome qui consomme l'inbox (phase 2) et le style (phase 3). Sans ces deux, le scout est codé incomplet.

Livrable : unité ESPION recrutable, mission scout, snapshot à l'arrivée, retour, rapport scout dans l'inbox révélant compo + stock + style, puis deux aides **MVP légères** :

- **Carnet d'intel minimal** : dernière info connue par village cible, privée, datée, liée au rapport source. Pas de partage social, pas de mise à jour magique.
- **Menace estimée avant attaque** : label `Inconnue / Faible / Moyenne / Élevée` basé sur infos publiques + dernier scout disponible. Pas de simulateur exact, pas de promesse de victoire.

Critère de fin : un joueur peut envoyer un ESPION sur un village barbare ou joueur, recevoir un rapport scout dans l'inbox, revoir la dernière intel connue depuis la cible, et obtenir une estimation non exacte avant d'envoyer une attaque.

### Phase 5 — Conquête barbare

Spec : [`13-barbarian-conquest.md`](../docs/gameplay/13-barbarian-conquest.md) (+ règles communes [`10-conquest.md`](../docs/gameplay/10-conquest.md)).

Pourquoi ici : première vraie boucle long terme **PvE**, spec complète. Permet de tester la mécanique Seigneur + période de capture **avant** d'affronter le PvP (qui ajoutera la complexité défenseur humain + fenêtres asymétriques).

Livrable : recrutement Seigneur, lancement conquête, combat de pré-conquête, période de capture variable, transfert village si tient la fenêtre, ressources reset, bâtiments hérités.

Critère de fin : un joueur peut conquérir un village barbare T2 et le voir basculer dans son royaume, vérifié IG.

### Phase 6 — Notifications push (POST MVP car pas prévu de déployer sur mobile pour l'instant)

Spec : [`16-notifications.md`](../docs/gameplay/16-notifications.md) (en chantier — catalogue à compléter en début de phase).

Pourquoi ici : prérequis UX pour la conquête PvP (phase suivante). Sans push, les fenêtres de capture (4-18 h) ne sont pas jouables — l'attaquant ne sait pas quand sa conquête a tenu, le défenseur ne sait pas qu'il doit lever une armée pendant la nuit.

Compromis acceptable : 3 catégories minimales (attaque entrante, fin de fenêtre de capture, fin de construction/entraînement), intégration FCM/APNs, fallback in-app si push refusé par l'OS.

Critère de fin : une attaque entrante déclenche un push sur l'appareil cible avec ETA correcte, vérifié IG.

### Phase 7 — Conquête PvP

Spec : [`14-pvp-conquest.md`](../docs/gameplay/14-pvp-conquest.md) (en chantier — finaliser les questions ouvertes en début de phase).

Pourquoi ici : cœur du end-game, mais s'appuie sur **toutes** les phases précédentes (combat, conquête barbare comme base, inbox, scout, notifications). Avant cette phase, le seul retravail serait absurde ; ici on récolte.

Livrable : conquête de villages joueurs, fenêtre de capture variable selon Château ennemi, garde-fous (puissance ÷ 3, bouclier débutant 48 h, anti-snowball cooldowns).

Critère de fin : deux comptes test peuvent simuler un cycle de conquête PvP complet (préparation → attaque → fenêtre → succès ou échec) avec les bonnes notifications et rapports.

### Phase 8 — Onboarding

Spec : [`15-onboarding.md`](../docs/gameplay/15-onboarding.md) (en chantier — esquisse à transformer en spec complète en début de phase).

Pourquoi ici : le tuto script **les 4 boucles** (économique, militaire, exploration, conquête). Coder le tuto avant que ces boucles soient stables = réécriture du script à chaque évolution gameplay. Tard à dessein.

Livrable : 5 étapes scriptées chaînées dès la création du premier village (1ᵉʳ upgrade éco → 1ᵉʳ raid barbare → 1ʳᵉ Watchtower → 1ᵉʳ scout → 5ᵉ étape TBD).

Critère de fin : un compte fraîchement créé est guidé étape par étape, sans pouvoir se perdre, jusqu'à compléter les 5 étapes en ≤ 10 min.

### Phase 9 — Navigation multi-village (rôles, favoris, sélecteur)

Spec : [`22-village-roles-and-navigation.md`](../docs/gameplay/22-village-roles-and-navigation.md).

Pourquoi ici (et pas Phase 11 comme prévu initialement) : dès la fin de Phase 5 (conquête barbare livrée) un joueur peut déjà posséder plusieurs villages, mais l'UX ne sait pas encore les distinguer. Surtout, la Phase 10 (Rétention quotidienne) doit pouvoir cibler **un** village pour appliquer ses récompenses — sans Phase 9, on hardcoderait une cible arbitraire (premier village, dernier consulté…) et on rouvrirait la Phase 10 plus tard. On la remonte donc avant Rétention. Elle reste isolée des boucles principales (pas de bonus de combat, pas d'effet serveur), donc pas de risque d'invalider du code déjà livré.

Livrable : étiquettes privées (`Favori`, `Capitale`, `Raid`, `Défense`, `Économie`, `Frontière`, `Conquête`) sans bonus mécanique, sélecteur de village, filtres dans la liste/carte, badges discrets, focus mobile. Pas de tags libres, pas de partage tribu, pas de preset automatique, pas de dashboard royaume consolidé (post-MVP, cf. [`lab/tickets/06-multi-village-governance.md`](../docs/gameplay/lab/tickets/06-multi-village-governance.md)).

**Décision à trancher dans cette phase, bloquante pour Phase 10** : *sur quel village une récompense (ou un effet joueur global) s'applique-t-il quand le joueur en possède plusieurs ?* Options à arbitrer : village marqué `Capitale`, village actif (dernier consulté), village choisi à la réception, ressources réparties au prorata, etc. La règle retenue devra être référencée par la spec [`05-daily-cards-and-oyez.md`](../docs/gameplay/05-daily-cards-and-oyez.md) avant d'attaquer Phase 10.

Critère de fin : un joueur multi-village peut marquer un village `Capitale` et un autre `Favori`, retrouver ces étiquettes dans le sélecteur et les filtres, et la règle « récompense → quel village » est tranchée et documentée.

### Phase 10 — Rétention quotidienne MVP

Spec : [`05-daily-cards-and-oyez.md`](../docs/gameplay/05-daily-cards-and-oyez.md).

Pourquoi ici : les boucles principales existent déjà, donc les cartes peuvent pointer vers de vraies actions sans inventer une checklist artificielle. C'est aussi le bon moment pour caler la rétention mobile avant de brancher le cycle de monde complet.

Livrable : carte quotidienne empilable, backlog limité, tâches liées aux boucles naturelles, Oyez léger qui influence la priorité du jour, récompenses modestes et non-snowballantes.

Dépendance Phase 9 : la cible d'application des récompenses (village destinataire) suit la règle tranchée en Phase 9. Ne pas re-trancher ici, ne pas hardcoder une cible avant qu'elle existe.

Hors scope MVP explicite : pass premium, progression de saison avancée, grosses récompenses de puissance, tâches artificielles.

Critère de fin : un joueur reçoit une carte quotidienne, peut la compléter en session courte, voit l'Oyez actif si présent, et récupère une récompense modérée sans avantage PvP durable, appliquée au village défini par la règle Phase 9.

### Phase 11 — World lifecycle

Spec : [`19-world-lifecycle.md`](../docs/gameplay/19-world-lifecycle.md) (spec MVP tranchée).

Pourquoi ici : c'est la cerise. À ce stade le jeu tient 120 j de session. On branche le cron de transition `PLANNED → OPEN → LOCKED → ENDED` + sous-phase retardataires + snapshot leaderboard à `ENDED` + wipe + récompenses cosmétiques permanentes.

Coût attendu : faible (1-2 jours), schéma DB et garde-fou `JoinWorldUseCase` déjà en place.

Critère de fin : un monde test fait son cycle complet (avec durées raccourcies via `WorldConfig`) et on observe les transitions, le wipe et les récompenses cosmétiques attribuées sur le compte global.

### Phase 12 — Ajouts mineurs MVP

Specs : [`20-defensive-friends.md`](../docs/gameplay/20-defensive-friends.md), [`18-inactivity-and-abandonment.md`](../docs/gameplay/18-inactivity-and-abandonment.md) (post-MVP selon la doc, mais cap des comptes-zombies utile avant lancement public — à arbitrer).

Pourquoi ici : ajouts isolés sans impact sur les boucles principales. On les case en dernier pour ne pas charger le scope MVP plus tôt. La navigation multi-village, initialement prévue ici, a été remontée en Phase 9 (cf. justification dans cette phase).

## Post-MVP (hors roadmap)

Ne pas prioriser dans cette roadmap, mais ne pas perdre de vue :

- [`21-alliances-and-tribes.md`](../docs/gameplay/21-alliances-and-tribes.md) — alliances/tribus complètes.
- [`09-power-and-rankings.md`](../docs/gameplay/09-power-and-rankings.md) § Classements hebdo/mensuels — récompenses périodiques.
- Progression de saison avancée / pass premium — lab uniquement pour l'instant, pas MVP.
- Marché royal, zones d'influence, Cachette (bâtiment), unités destructrices de bâtiments.

## Mise à jour de ce document

À mettre à jour dès qu'une phase est démarrée, terminée, ou réordonnée suite à un blocker. La justification du changement va dans le commit message (cf. `.claude/rules/git.md`).

## Liens

- [`docs/gameplay/00-game-flow.md`](../docs/gameplay/00-game-flow.md) — vue narrative end-to-end pour comprendre **ce qu'on construit**.
- [`docs/gameplay/README.md`](../docs/gameplay/README.md) — index des specs gameplay (statut MVP/post-MVP/en chantier par doc).
- [`tasks/README.md`](./README.md) — convention des tickets actionables dérivés de cette roadmap.
