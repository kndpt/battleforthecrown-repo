# Conquête de villages joueurs (PvP)

> ✅ **Doc spécifiée pour le MVP.** Sections post-MVP (alliances/tribus, réputation, ré-examen éventuel du bouclier post-perte) listées en bas. Les règles communes à toute conquête (recrutement et coût du [Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles), période de capture variable) sont dans [`10-conquest.md`](./10-conquest.md). La conquête barbare est dans [`13-barbarian-conquest.md`](./13-barbarian-conquest.md).

## Pourquoi cette doc

La conquête entre joueurs est la **boucle de PvP la plus profonde** du jeu. Elle est structurellement plus complexe que la conquête barbare :

- Un village joueur a de **vrais bâtiments** à des niveaux variables (pas un mapping uniforme par tier).
- Il a un **stock de ressources réel** (pas une fourchette générée).
- Il a une **pop dérivée du Moulin existant** (pas à recalculer).
- Il a potentiellement des **alliés** ou des **voisins opportunistes** qui peuvent défendre/intervenir pendant la capture.
- Le joueur défenseur a investi du temps réel — la conquête a un **poids émotionnel** absent du barbare.

C'est aussi le sujet où les **garde-fous anti-snowball** ont le plus d'impact (un top-player qui conquiert sans limite peut tuer le serveur).

## Cadre déjà décidé (commun)

Repris depuis [`10-conquest.md`](./10-conquest.md) :

| Élément | Décision |
| --- | --- |
| Outil | [Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles) — unité unique sacrificielle, coût détaillé dans 10-conquest |
| Pré-requis | Toutes les troupes ennemies vaincues + Seigneur survivant |
| Période de capture | **Variable selon le niveau du Château de la cible** (4 / 6 / 9 / 12 / 18 h par paliers). Voir § Période de capture ci-dessous. |

## Questions à trancher

### Bâtiments hérités

**Décidé (MVP)** : le conquérant **récupère le village dans son état exact au moment T**. Niveaux hérités tels quels, **aucun dégât automatique à la conquête**.

| Élément | MVP |
| --- | --- |
| Niveaux des bâtiments à la conquête | Hérités tels quels |
| Dégât automatique infligé par la conquête | ❌ Aucun |
| Wall, Hideout | Pas de question — déjà post-MVP |

**Logique** :
- Les unités MVP n'ont pas la capacité de détruire des bâtiments → cohérent que la conquête (qui passe par un combat MVP) ne le fasse pas non plus.
- L'attaquant qui réussit une conquête PvP a déjà investi le coût complet du Seigneur (cf. [`10-conquest.md` § Le Seigneur](./10-conquest.md#le-seigneur--recrutement-et-règles)) + une fenêtre de capture vulnérable. Récompense majeure (village au niveau réel) cohérente avec l'effort.
- Le snowball est limité par : garde-fou par puissance (§ Garde-fous anti-snowball) + difficulté croissante de défense + coût Seigneur de la prochaine conquête.

**Note post-MVP** : quand les **unités destructrices de bâtiments** arriveront (siège avancé, démolisseurs, etc.), pas besoin de réintroduire un « dégât à la conquête » séparé. Ces unités s'utiliseront en **raid normal** — soit pour harceler/affaiblir un voisin sans le conquérir, soit pour préparer le terrain avant une conquête. La dégradation passe par le combat normal et la conquête hérite naturellement de l'état dégradé. **Une seule mécanique (combat → dégât) au lieu de deux**.

### Stock ressources

**Décidé : Reset complet** (0 bois / 0 pierre / 0 fer à la conquête).

**Logique** :
- **Cohérence avec la spec barbare** (cf. [`13-barbarian-conquest.md` § Stock ressources et population](./13-barbarian-conquest.md#stock-ressources-et-population)) qui acte déjà reset complet — pas de cas spécial PvP/barbare.
- **Pas de double récompense** : le joueur qui mène une conquête PvP a déjà gagné le combat de pré-conquête → il a **déjà reçu le loot maximum** dans le rapport de combat (proportionnel à la capacité de transport de son armée). Hériter du stock résiduel en plus serait un triple cadeau (combat loot + village + stock).
- **Atténue le snowball** : le défenseur perd le village, mais le stock résiduel ne tombe pas dans les mains du conquérant. Limite la capacité d'enchaîner immédiatement une prochaine conquête.
- Cohérent avec la règle existante de [`02-economy-and-progression.md` § Conquête et reset](./02-economy-and-progression.md#conquête-et-reset).

**Note tactique** : un joueur sur le point d'être conquis peut « brûler » volontairement son stock (tout dépenser en upgrades juste avant). Pas un exploit — décision tactique légitime, simplement le coût de la défaite anticipée.

### Population

**Décidé : héritée du Moulin existant**.

- Pop max recalculée à partir du niveau du Moulin du village conquis (formule identique à un village joueur normal — cf. [`03-buildings.md` § Moulin](./03-buildings.md#moulin-farm)).
- **Pop occupée par les bâtiments hérités** (mines, Caserne, Tour de guet, etc.) reste occupée comme dans n'importe quel village joueur.
- Pop **disponible** à la conquête = `(Pop max Moulin) − (Pop occupée par bâtiments hérités)`. Pas de magie, pas de bonus de bienvenue.
- Cohérent avec la spec barbare ([`13-barbarian-conquest.md` § Stock ressources et population](./13-barbarian-conquest.md#stock-ressources-et-population)).

### Vision

La **Tour de guet est héritée** comme tout autre bâtiment (cf. § Bâtiments hérités). Si le défenseur conquis avait une Watchtower, le **nouveau propriétaire en bénéficie immédiatement** — son rayon de vision contribue à la carte du conquérant dès la fin de la fenêtre de capture.

Différence avec la conquête barbare : un village barbare conquis a une vision = 0 (Tour de guet jamais matérialisée — cf. [`13-barbarian-conquest.md` § Vision propre](./13-barbarian-conquest.md#vision-propre--0-tous-tiers-barbares)). Côté PvP, comme tous les bâtiments sont hérités, la vision suit le bâtiment.

### Période de capture variable selon le niveau du Château

**Décidé** : la durée de capture est **variable selon le niveau du Château de la cible**, dans le même esprit que la courbe par tier appliquée aux barbares (cf. [`13-barbarian-conquest.md` § Période de capture variable par tier](./13-barbarian-conquest.md#période-de-capture-variable-par-tier)).

Logique : conquérir un nouveau joueur (Château bas) doit être rapide et peu punitif ; conquérir un Château 9-10 (investissement de plusieurs semaines) doit être un acte majeur, avec une vraie fenêtre pendant laquelle alliés et voisins peuvent intervenir.

**Courbe décidée** (alignement sur la courbe barbare étendue vers le haut) :

| Niveau Château cible | Période de capture | Équivalent barbare |
| ---: | ---: | :---: |
| 1-2 | 4 h | ≈ T2 |
| 3-4 | 6 h | ≈ T3 |
| 5-6 | 9 h | ≈ T4 |
| 7-8 | 12 h | ≈ T5 |
| 9-10 | 18 h | (au-delà) |

Rationale du palier 9-10 = 18 h : Château royal = effort de plusieurs semaines, mérite une fenêtre supérieure au plus haut tier barbare. Cap à 18 h (et pas 24 h+) = reste « une nuit + un peu », jouable sur mobile.

**Snapshot du niveau Château** : **figé au moment de l'installation du Seigneur** (= juste après le combat de pré-conquête victorieux). Le défenseur ne peut donc pas raccourcir la fenêtre en downgradant son Château pendant la capture. Plus simple à coder, impossible à exploiter.

**Visibilité de la durée** : **pré-affichée** sur le panneau d'info du village ennemi et dans le rapport de scout. Aligné sur la spec barbare (cf. [`13-barbarian-conquest.md` § Visibilité de la durée](./13-barbarian-conquest.md#visibilité-de-la-durée)) — pas d'asymétrie. La planification de conquête est une décision majeure ; le joueur sait à l'avance dans quelle fenêtre il s'engage.

### Interruption pendant la fenêtre

Cœur du PvP de capture. **Décidé** au MVP comme suit.

#### Acteurs autorisés à attaquer pendant la fenêtre

| Acteur | Au MVP |
| --- | :---: |
| **Défenseur d'origine** (depuis ses autres villages, ou troupes en déplacement) | ✅ Oui |
| **Voisins tiers opportunistes** (joueurs qui veulent voler ou contrer la conquête) | ✅ Oui |
| **Alliés du défenseur** | ❌ Post-MVP (pas de tribus au MVP) |
| **Renforts envoyés par l'attaquant** vers la garnison d'occupation | ❌ Post-MVP |
| **Retrait par l'attaquant** des troupes en garnison d'occupation | ❌ Post-MVP |

🎯 **Lecture design** : le tiers opportuniste est crucial — c'est lui qui rend la fenêtre PvP intéressante. Sans alliances et sans tiers, le PvP de capture serait juste « le défenseur peut-il riposter ? ». Avec lui, chaque conquête lancée est un signal sur la carte qui peut attirer des prédateurs.

#### Garnison d'occupation = ce qui reste de l'escorte

On n'envoie **jamais** un Seigneur seul. Le Seigneur (500 att / 500 déf) est puissant mais isolé, il meurt face à n'importe quelle défense ou attaque tiers. **L'escorte est obligatoire en pratique** — son dimensionnement est le cœur tactique du lancement de conquête.

La **garnison d'occupation** qui défend la fenêtre = **les survivants de l'escorte après le combat de pré-conquête**, plus le Seigneur. Pas de renfort, pas de retrait pendant la fenêtre. La décision se fait **au lancement**.

**Tension stratégique** :
- **Trop peu d'escorte** → Seigneur fragile face aux attaques tiers/défenseur → conquête ratée, investissement perdu.
- **Trop d'escorte** → village d'origine dégarni pendant 4-18 h → cible facile pour des raids opportunistes sur **toi**.

L'attaquant peut continuer à opérer ailleurs avec ses **autres villages** pendant la fenêtre (raids classiques, défense de son propre village). On n'empêche pas l'activité parallèle — on interdit juste de toucher à la garnison du village en cours de capture.

#### Effet d'une attaque réussie pendant la fenêtre

Une attaque tierce ou défensive est **réussie** si elle tue le Seigneur (qui est en garnison avec l'escorte survivante).

| Élément | Effet |
| --- | --- |
| Le Seigneur | **Meurt** dans le combat — tout l'investissement (cf. [`10-conquest.md` § Coût de recrutement](./10-conquest.md#coût-de-recrutement-du-seigneur)) + l'escorte engagée sont perdus. |
| La capture | **Annulée**. La fenêtre se ferme immédiatement. |
| Le village | **Reste au défenseur d'origine** — statu quo, comme si la conquête n'avait jamais eu lieu. |
| Ressources / bâtiments du village | Inchangés par l'annulation elle-même (mais l'attaquant tiers peut piller normalement, comme sur n'importe quel raid). |

#### Effet d'une attaque échouée pendant la fenêtre

Si l'attaque tierce ou défensive **échoue** (la garnison d'occupation tient) :

- L'attaquant tiers perd ses troupes, retour à vide (combat perdu classique).
- La capture **continue normalement** — pas de prolongation, pas de bonus pour le conquérant.
- La garnison d'occupation peut être **affaiblie** (pertes du combat) → la prochaine attaque tierce sera plus dangereuse pour la conquête. Effet boule-de-neige défensif possible si plusieurs assauts s'enchaînent.

### Garde-fous anti-snowball

Mécaniques structurelles pour empêcher qu'un top-player domine le serveur. Décidées au MVP comme suit.

#### 1. Limite de villages par joueur

❌ **Pas de cap dur**. Régulation naturelle (plus on a de villages, plus c'est dur de tout défendre). Cf. [`10-conquest.md` § Garde-fous globaux](./10-conquest.md#garde-fous-globaux).

#### 2. Garde-fou par puissance — `puissance_défenseur ≥ puissance_attaquant ÷ 3`

Mécanique principale anti-snowball. Une attaque (raid **ou** conquête) est interdite si la puissance du défenseur est **strictement inférieure à 1/3** de celle de l'attaquant.

| Détail | Décision |
| --- | --- |
| Ratio | `puissance_défenseur < puissance_attaquant ÷ 3` → **attaque interdite**. À exactement 1/3, l'attaque est autorisée. |
| Granularité | **Puissance par joueur** (cumul de tous ses villages), pas par village. Évite qu'un défenseur soit piégé par son village le plus faible. |
| Direction | **Unidirectionnel** — seul l'attaquant doit respecter le seuil. Le défenseur petit peut toujours attaquer un gros (asymétrie héroïque). |
| Périmètre | **Toute attaque** : raid classique **et** conquête PvP. La conquête barbare n'est pas concernée (les barbares n'ont pas de puissance — cf. [`06-barbarians.md`](./06-barbarians.md)). |
| Évaluation temporelle | Check effectué **au lancement de l'attaque** (clic « envoyer »), non re-vérifié ensuite. Une fois l'armée en route, peu importe l'évolution des puissances : l'arrivée se résout normalement. |
| UX joueur | Sur le panneau d'info ennemi : bouton attaque grisé + message *« Puissance trop faible — protection serveur »*. |

🎯 **Lecture design** : continue de réguler tout au long de la vie du compte (vs un bouclier débutant temporel qui expire). Pas de cliff arbitraire. Permet à un petit joueur de tenter le gros (asymétrie héroïque légitime), mais protège des farmings systématiques. **Effet de bord positif** : un top-player finit avec très peu de cibles attaquables, ce qui le force à se battre entre top-players ou à attaquer des petits qui peuvent riposter — régulation anti-snowball gratuite.

> ⚠️ **Tradeoff assumé — fuite de la puissance défensive par escalade** : un attaquant peut sonder plusieurs cibles à puissance croissante (×1, ×2, ×3…) pour borner la **puissance totale par joueur** d'un défenseur, et par soustraction de la puissance bâtiments publique, **borner sa puissance armée** (officiellement cachée — cf. [`09-power-and-rankings.md` § Visibilité](./09-power-and-rankings.md#visibilité)). On accepte ce leak : le scout ESPION reste indispensable pour la **compo précise** (qui pèse au combat), pas juste l'estimation grossière. Masquer le motif UX (« attaque interdite » sans raison) serait pire pour le joueur honnête, et ne supprimerait pas la fuite côté API.

#### 3. Bouclier débutant — 48 h à l'arrivée sur le monde

Mécanique d'onboarding pour combler l'angle mort du `puissance ÷ 3` : deux nouveaux joueurs spawnés dans la même fenêtre temporelle ont chacun une puissance proche de 0, donc le ratio ne joue pas — le first-mover peut écraser ses voisins dès H+1. Sans filet, on perd les retardataires d'une zone de spawn en une session.

**Décidé (MVP)** : tout joueur reçoit un **bouclier d'inattaquabilité de 48 h temps réel** au moment de rejoindre un monde (création du `WorldMembership` + premier village).

| Détail | Décision |
| --- | --- |
| Durée | **48 h temps réel absolu** depuis l'arrivée sur le monde. Pas de pause hors ligne (sinon un joueur peut s'auto-bunkériser indéfiniment en se déconnectant). |
| Périmètre défensif | **Toute attaque PvP entrante** : raid classique **et** conquête PvP. La conquête barbare n'est pas bloquée (mécanique d'apprentissage). Une future pression PVM barbare devra suivre la même intention : ne pas être bloquée par le bouclier débutant. Le scout PvP entrant n'est pas bloqué non plus (non-agressif, lecture seule — cf. [`11-scouting.md`](./11-scouting.md)). |
| Brisé prématurément si… | Le joueur protégé **lance une attaque PvP** (raid ou conquête vers un autre joueur). Le scout PvP sortant et toute action contre un barbare **ne brisent pas** le bouclier. |
| Évaluation temporelle | Check effectué **au lancement de l'attaque** (clic « envoyer »), comme la règle `puissance ÷ 3`. Une attaque déjà partie s'arrive normalement même si le bouclier expire pendant le trajet — symétrique avec le `puissance ÷ 3`. |
| UX joueur | Sur le panneau d'info de la cible : bouton attaque grisé + message *« Joueur protégé — bouclier débutant ({hh:mm} restantes) »*. Icône bouclier + timer restant sur la fiche publique du joueur, sur le panneau d'info du village et dans le rapport de scout (aligné sur le pattern de visibilité de la § Période de capture). |

🎯 **Lecture design** : le `puissance ÷ 3` reste le filet long terme et continu. Le bouclier débutant couvre **uniquement** la fenêtre où la puissance n'est pas encore un signal exploitable — les 48 premières heures, où tous les nouveaux sont à puissance ~0. Passé 48 h, la régulation puissance prend le relais sans cliff arbitraire pour la majorité des cas (un joueur qui a joué 48 h a typiquement déjà dépassé le seuil de protection naturelle vis-à-vis des comptes plus anciens).

**Pourquoi 48 h** : « deux soirs d'onboarding ». 24 h trop court (un joueur qui se connecte le soir n'a qu'une vraie session avant exposition) ; 72 h trop long (cible qui se développe à l'abri trop longtemps, et accumule un avantage économique injuste sur un voisin spawné le même jour mais hors fenêtre). 48 h est la valeur retenue par Tribal Wars et Kingsage sur leurs serveurs classiques.

**Pourquoi briser sur attaque PvP sortante** : sans cette règle, le bouclier devient un pacte de non-agression unilatéral exploitable — le joueur peut farmer ses voisins sans aucun risque de riposte pendant 48 h. La rupture sur première attaque PvP est l'arbitrage standard (Tribal Wars/Kingsage) : *« tu veux entrer dans le PvP ? Tu joues à armes égales »*. Pas de timer de cooldown post-rupture, pas de réactivation possible — la sortie du bouclier est définitive sur le monde concerné.

**Effet conjoint avec `puissance ÷ 3`** : un joueur sortant du bouclier à H+48 reste protégé par `puissance ÷ 3` contre les comptes très anciens. Les deux garde-fous se relayent — le bouclier couvre la fenêtre de découverte, le ratio prend le relais en continu.

#### 4. Cooldown de re-conquête

❌ **Pas de cooldown au MVP**. Un village juste conquis est immédiatement re-conquérable.

🎯 **Lecture design** : choix volontaire pour rendre le PvP plus sauvage et créer de la profondeur stratégique.

- **Côté conquérant** : la conquête reste un investissement risqué. Tu prends un village affaibli (garnison réduite aux survivants de l'escorte), c'est à toi de le défendre dès la fin de la fenêtre de capture. Pas de protection magique. Cohérent avec « le coût stratégique ne s'arrête pas au recrutement du Seigneur » (cf. [`10-conquest.md` § Stockage et exposition](./10-conquest.md#stockage-et-exposition)).
- **Côté PvP émergent** : crée un méta-jeu de **« vautours »** — quand un voisin lance une conquête publique, un autre joueur peut préparer son propre Seigneur pour rafler la mise derrière, sachant que sa cible (le village fraîchement conquis) sera moins défendue que ne l'était le défenseur d'origine. Profondeur stratégique gratuite, sans mécanique additionnelle.
- **Tension renforcée sur l'escorte** : sachant qu'il devra défendre immédiatement après la conquête, le conquérant est incité à envoyer une **escorte massive** — ce qui dégarnit d'autant plus son village d'origine pendant la fenêtre. Vraie décision stratégique au lancement.

**Référence design** : modèle directement aligné sur Kingsage / Tribal Wars, validé par plusieurs décennies de PvP MMORTS. La combinaison « pas de cooldown + garde-fou puissance ÷ 3 + dégarnissage du village d'origine + méta vautour » a fait ses preuves — on ne remet pas le modèle en question. Le hot-fix reste possible si un cas extrême apparaît, mais ce n'est pas l'hypothèse de design.

### Diplomatie et conséquences sociales

Post-MVP probablement, mais à noter :
- Les **alliances / tribus** auront un rôle (les alliés peuvent défendre).
- La **réputation** du conquérant pourrait être tracée (post-MVP).
- Les **classements** (cf. [`09-power-and-rankings.md`](./09-power-and-rankings.md)) reflètent les conquêtes ?

## Pistes envisagées, non retenues au MVP

### Bouclier post-perte (12 h)

Idée : si un joueur perd un village, ses autres villages deviennent inattaquables pendant 12 h (« évite le snowball nocturne »). 

**Non retenue** : un bouclier de protection brut **en plein milieu de partie** est anti-jeu — il interrompt le PvP en cours alors que la dynamique d'engagement vient justement d'être amorcée. La garde-fou par puissance ÷ 3 (§ 2 ci-dessus) couvre déjà la situation des « petits écrasés » de manière plus continue et plus fine.

Modèle aligné sur Kingsage / Tribal Wars qui n'utilise pas non plus de bouclier post-perte. Décision stable, pas une hypothèse à valider en playtest.

> 📌 **À ne pas confondre** avec le **bouclier débutant** (§ 3 ci-dessus), qui est retenu. Le bouclier débutant couvre **uniquement la fenêtre d'arrivée** sur le monde (48 h après le `WorldMembership`), période où le `puissance ÷ 3` est inopérant (toutes les nouvelles puissances sont à ~0). Le bouclier post-perte rejeté ici couvrirait au contraire **toute la durée de vie du compte**, ce qui interrompt le PvP en cours.

## Liens

- [`10-conquest.md`](./10-conquest.md) — règles communes à toute conquête.
- [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) — conquête barbare (référence pour comparer).
- [`04-combat.md` § Conquête](./04-combat.md#conquête) — mécanisme général.
- [`02-economy-and-progression.md` § Conquête et reset](./02-economy-and-progression.md#conquête-et-reset) — règle existante de reset.
- [`09-power-and-rankings.md`](./09-power-and-rankings.md) — classements impactés par les conquêtes.
