# Conquête de villages

Hub de la mécanique de **conquête**. Cette doc consolide les **règles communes** à toute conquête (joueur ou barbare). Les spécificités sont dans deux sub-docs dédiés :

- **Conquête barbare** → [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) — spec complète.
- **Conquête PvP (joueur vs joueur)** → [`14-pvp-conquest.md`](./14-pvp-conquest.md) — doc en chantier.

## Principe directeur

- La conquête est **la boucle long terme** de Battle for the Crown. Posséder plusieurs villages permet la stratégie macro multi-village (cf. [`12-village-styles.md`](./12-village-styles.md)).
- Une conquête est un **vrai effort** : elle demande un [Seigneur](#le-seigneur--recrutement-et-règles) (investissement majeur en ressources, couronnes et population), une bataille gagnée, et une période de capture pendant laquelle le Seigneur est immobilisé (durée variable selon le contexte — cf. sub-docs).
- La conquête barbare et la conquête PvP partagent ce **cadre commun**, mais diffèrent fortement sur le **contenu hérité** (bâtiments, stock, pop).

## Cadre commun — joueur ou barbare

| Élément | Décision |
| --- | --- |
| Outil de conquête | Seigneur (unité unique, sacrificielle) — cf. § Le Seigneur ci-dessous + fiche stat dans [`08-units.md`](./08-units.md) |
| Bâtiment de recrutement | **Salle du Trône** (Château 6 requis) — cf. [`03-buildings.md` § Salle du Trône](./03-buildings.md#salle-du-trône) |
| Pré-requis combat | Toutes les troupes ennemies vaincues + Seigneur survivant |
| Période de capture | **Variable selon le contexte** — par tier pour les barbares ([`13`](./13-barbarian-conquest.md)), par niveau de Château cible pour le PvP ([`14`](./14-pvp-conquest.md)). Le Seigneur s'installe et reste immobilisé toute la fenêtre. |
| Effet de la capture | Si non-attaqué pendant la fenêtre → conquête réussie, le village change de propriétaire |
| Sacrifice du Seigneur | Le Seigneur s'installe et **devient le Seigneur du village conquis**. Il n'est plus disponible pour une autre conquête. |

Les durées indiquées dans les sub-docs sont les durées de base du monde. Au runtime, elles sont divisées par `gameSpeed.capture` et figées dans `PendingConquest.captureUntil` au moment où la fenêtre s'ouvre ; une capture déjà ouverte n'est pas recalculée si la config monde change.

Mécanique détaillée du combat de pré-conquête : [`04-combat.md` § Conquête](./04-combat.md#conquête).

## Le Seigneur — recrutement et règles

Spec consolidée du Seigneur. **Source unique** pour le recrutement, les coûts, et les règles d'usage. La fiche stat (attaque/défense/mobilité) reste dans [`08-units.md`](./08-units.md#).

### Bâtiment requis : Salle du Trône

Le Seigneur n'est **pas** recruté à la Caserne. Il est recruté à la **Salle du Trône**, bâtiment dédié débloqué à **Château 6** — c'est l'**entrée du end-game**.

- 1 seul niveau au MVP, mono-construction par village.
- Coût bâtiment : 1 600 bois / 2 400 pierre / 1 200 fer / 6 pop / 6 h.
- Aucun bonus passif au MVP (les bonus annoncés dans la roadmap — vitesse d'entraînement, vitesse de noblage — arriveront avec les niveaux 2+ post-MVP).

Détail bâtiment : [`03-buildings.md` § Salle du Trône](./03-buildings.md#salle-du-trône).

### Coût de recrutement du Seigneur

| Élément | Valeur |
| --- | ---: |
| Bois | **5 000** |
| Pierre | **5 000** |
| Fer | **5 000** |
| Couronnes | **5 000** |
| Population | **15** |
| Temps d'entraînement | **8 h** |

🎯 **Lecture design** : recruter un Seigneur doit marquer une vraie décision stratégique — *« j'arrête d'agrandir mon village pour tout mettre dans le Seigneur »*. Le coût total dépasse **3 upgrades de fin de jeu cumulés**. Les 5 000 couronnes représentent **~3 jours** de production pour un joueur mid-game (Château 6, Salle du Trône fraîche), ~1-2 jours en late-game multi-villages — détail dans [`02-economy-and-progression.md` § Couronnes](./02-economy-and-progression.md#couronnes). Les 15 pop sont une ponction comparable à 7-8 Béliers.

C'est le **prix de l'expansion**. La récompense (un nouveau village = un emplacement supplémentaire, cf. [`13-barbarian-conquest.md`](./13-barbarian-conquest.md)) justifie le risque de sous-développer son village pour cet investissement.

**Mécaniques de recrutement** :
- **Annulation** : un Seigneur en cours d'entraînement est annulable comme les troupes normales — remboursement complet (ressources + couronnes + pop). Pas de cas spécial.
- **File parallèle** : la Salle du Trône a sa **propre file**, indépendante de la Caserne. Le joueur peut entraîner son escorte (Templier, Archer, etc.) en Caserne pendant que le Seigneur s'entraîne au Trône.

### Cap : 1 Seigneur par village

Un village peut posséder **1 Seigneur en garnison à la fois**. Pas de cumul. Pour avoir 2 Seigneurs simultanés, il faut 2 villages avec chacun sa Salle du Trône.

Une fois le Seigneur utilisé pour une conquête réussie (= installé dans le village conquis), le village d'origine peut **en recruter un nouveau**.

### Stockage et exposition

Un Seigneur entraîné peut rester en garnison **indéfiniment**. Il ne se rebelle pas, ne meurt pas de vieillesse.

⚠️ **Mais il est visible au scout** (cf. [`11-scouting.md`](./11-scouting.md)). Garder un Seigneur en attente sans s'en servir crée une **cible** : un voisin opportuniste peut attaquer le village pour le tuer dans le combat et **ruiner l'investissement** (cf. § Coût de recrutement ci-dessus). Ralentir la progression d'un voisin ambitieux devient une stratégie défensive valide.

🎯 **Lecture design** : pas de protection magique. Le coût stratégique ne s'arrête pas au recrutement — il continue tant que le Seigneur n'a pas été utilisé.

### Devenir : « Seigneur du village conquis »

Quand la fenêtre de capture se termine sans interruption, le Seigneur s'installe et **devient le Seigneur du village conquis**. Il n'est plus une unité du village d'origine, n'est plus disponible pour d'autres conquêtes — il administre désormais son nouveau territoire au nom du joueur (qui reste le **Roi** en haut de la chaîne, cohérent avec le titre du jeu).

Pendant toute la fenêtre, la **garnison d'occupation** est composée du Seigneur et de l'escorte survivante du combat de pré-conquête. Elle ne rentre pas au village d'origine : elle défend la capture. Si cette escorte est entièrement détruite, ou si le Seigneur meurt, la capture est interrompue.

À la fin de la fenêtre **réussie**, le Seigneur s'installe (cf. ci-dessus) et **l'escorte survivante reste sur place comme renfort du village d'origine vers le village conquis** — pas de retour automatique au village d'origine. C'est le prix du nouveau territoire : sans cette garnison initiale, le village conquis (ressources reset, population minimale) serait reconquis immédiatement. Le joueur peut ensuite rapatrier ces troupes quand il le souhaite via les outils standards de renforts inter-villages (`Renvoyer` la garnison).

La fenêtre de capture est un **signal public de carte** : tout joueur qui voit le village cible voit un indicateur visuel autour du village. Le badge HUD `Captures` reste privé au conquérant, mais le marqueur sur la cible est public pour rendre l'opportunité PvP lisible.

Tout combat contre la cible pendant la fenêtre produit un **rapport de défense** pour le joueur qui occupe la capture si sa garnison est impliquée. Même sur un village barbare, l'occupant doit comprendre quelles troupes ont été perdues et pourquoi le Seigneur ou la capture a disparu.

Si la conquête est interrompue (combat perdu pendant la fenêtre de capture), le Seigneur **meurt** avec le reste de la garnison attaquée. Pas de récupération, pas de retour au village d'origine.

### Cas particulier : armée gagne le combat de pré-conquête mais le Seigneur meurt

Si toutes les troupes ennemies sont vaincues **mais** le Seigneur fait partie des pertes de l'attaquant :

- **Conquête échouée** — pas de Seigneur survivant pour s'installer, donc pas de fenêtre de capture, pas de transfert de propriété.
- **Loot ramené** — le combat est militairement victorieux, le butin est pris comme un raid normal.
- **Escorte survivante** — rentre au village d'origine avec le loot (idem retour de raid).
- **Coût Seigneur perdu sec** — 5 000 couronnes + 15 pop + ressources d'entraînement non récupérables. Pas de remboursement, pas de loot bonus, pas de mécanique de compensation.

Le Seigneur peut mourir sur une victoire coûteuse selon le taux de pertes global de l'attaquant. Sous 50 % de pertes, il ne risque rien ; entre deux paliers, la chance est interpolée linéairement.

| Pertes attaquant | Chance mort Seigneur |
| ---: | ---: |
| < 50 % | 0 % |
| 50 % | 1 % |
| 55 % | 5 % |
| 60 % | 10 % |
| 65 % | 20 % |
| 70 % | 30 % |
| 75 % | 40 % |
| 80 % | 50 % |
| 85 % | 60 % |
| 90 % | 70 % |
| 95 % | 80 % |
| 100 % | 100 % |

🎯 **Lecture design** : c'est le **prix du risque**. Lancer une conquête sans escorte solide ou contre une cible mal évaluée doit pouvoir coûter le Seigneur sans que le joueur soit doublement puni — il garde le butin militaire, perd l'investissement stratégique. Cohérent avec § *Stockage et exposition* ci-dessus (un Seigneur est toujours une cible, jamais protégé magiquement).

## Garde-fous globaux

Sujets transversaux à toute conquête :

- **Limite de villages par joueur** : ❌ **Pas de limite dure**. Brider arbitrairement le nombre de villages frustre les top-players qui atteignent le cap et finissent par se lasser. La régulation est **naturelle** : plus on a de villages, plus c'est difficile de tout défendre simultanément (armée diluée, distances plus longues, coûts de coordination). Modèle aligné sur Kingsage. Si la régulation naturelle s'avère insuffisante en playtest, on pourra introduire post-MVP des **malus scalants** au-delà d'un certain seuil (ex. baisse de production globale, malus de vitesse Seigneur) plutôt qu'un cap dur.
- **Conquête multi-tier barbare** : un joueur low-level peut-il conquérir un T5 s'il en a les moyens militaires ? Pas de seuil prévu — la difficulté militaire fait office de filtre naturel. Voir [`13-barbarian-conquest.md`](./13-barbarian-conquest.md).
- **Conquête PvP asymétrique** : double protection des nouveaux joueurs face aux gros — **bouclier débutant 48 h** à l'arrivée sur le monde (couvre la fenêtre où la puissance est encore à ~0) puis **règle puissance ÷ 3** en continu (toute attaque d'un joueur dont la puissance défensive est < 1/3 de l'attaquant est interdite). Détail dans [`14-pvp-conquest.md` § Garde-fous anti-snowball](./14-pvp-conquest.md#garde-fous-anti-snowball).

## Liens

- [`13-barbarian-conquest.md`](./13-barbarian-conquest.md) — spec barbare complète.
- [`14-pvp-conquest.md`](./14-pvp-conquest.md) — spec PvP (en chantier).
- [`04-combat.md` § Conquête](./04-combat.md#conquête) — mécanisme général de combat de pré-conquête.
- [`08-units.md`](./08-units.md) — Seigneur (unité de conquête).
- [`02-economy-and-progression.md` § Conquête et reset](./02-economy-and-progression.md#conquête-et-reset) — règle existante de reset à la conquête.
- [`12-village-styles.md`](./12-village-styles.md) — un village conquis démarre en Équilibré ; spécialisation possible après construction de la Salle du Conseil.
