# Scout / Espionnage

Mécanique de **scout** : observer une cible avant de l'attaquer pour révéler sa composition d'armée et son stock de ressources. Feature **transversale** : s'applique à tout type d'entité (villages joueurs, villages barbares, et futures entités).

> Cette doc spécifie le scout côté gameplay. La mécanique d'unité ESPION elle-même est définie dans [`08-units.md`](./08-units.md). Le combat de résolution (cas où la cible se défend) suit l'infra de [`04-combat.md`](./04-combat.md).

## Cadre

| Élément | Valeur |
| --- | --- |
| Outil | Unité **ESPION** (cf. [`08-units.md`](./08-units.md)) |
| Caserne requise | **3** (early-mid game, en même temps que ARCHER / GUERRIER) |
| Cibles supportées | Toute entité visible : village joueur, village barbare, autres types futurs |
| Information révélée | Composition d'armée + stock de ressources + **style stratégique** du village (snapshot au moment T) |
| Risque MVP | Aucun — la mission réussit toujours |
| Risque post-MVP | Combat ESPION vs ESPION ou défense via Cachette (cf. § Évolutions post-MVP) |

## Mécanique

Le scout réutilise l'infrastructure combat existante (déplacement euclidien, mobilité, rapport).

```
1. Joueur depuis la Caserne → action "Envoyer espion(s)"
2. Choisit la cible (toute entité visible sur sa carte)
3. ESPION(s) parcourt la distance à mobilité 100 (≈ instantané pour cibles proches)
4. Arrive à destination :
   • MVP : succès auto, peu importe la cible
   • Post-MVP : résolution selon défense d'espionnage de la cible
5. Snapshot de la cible au moment T → rapport généré
6. ESPION(s) revient à la même mobilité
7. Joueur consulte le rapport (UI similaire au rapport de combat)
```

**Caractéristiques du rapport** :
- **Snapshot, pas temps réel** : l'info reflète l'état de la cible au moment où l'ESPION y est arrivé. Si l'attaque réelle a lieu plus tard, l'état peut avoir changé (production passive, autres pillards, régen barbare).
- **Pas de péremption explicite** : le rapport reste consultable, mais le joueur sait qu'il vieillit.
- **Style stratégique** : le scout est le seul moyen de connaître le style d'un village ennemi (Forteresse / Raiders / Économique / Équilibré) — info essentielle pour calibrer une attaque, cf. [`12-village-styles.md`](./12-village-styles.md).

## Cohérence avec les autres mécaniques

### Avec le combat (rapport de combat)

Cf. [`06-barbarians.md` § Rapport de combat](./06-barbarians.md#rapport-de-combat) : un combat **gagné** révèle déjà la compo et le stock. Donc le combat est un **scout a posteriori** — gratuit en cas de victoire, mais coûteux en cas de défaite (pertes sèches + aucune info).

Le scout ESPION est un **scout préalable** : moins risqué, moins coûteux, mais asynchrone. Les deux coexistent et se complètent.

| | Scout ESPION | Combat |
| --- | --- | --- |
| Coût | 1 ESPION + temps de trajet | Toute l'armée engagée + ses pertes |
| Info révélée | Compo + stock (snapshot) | Compo + stock + pertes ennemies (si victoire) |
| Risque | Aucun (MVP) | Pertes réelles |
| Rythme | Asynchrone (avant attaque) | Synchrone (résolution combat) |

### Avec la lisibilité barbare

Cf. [`06-barbarians.md` § Lisibilité joueur](./06-barbarians.md#lisibilité-joueur) : le **tier** d'un village barbare est visible (sprite + couleur, label texte au clic). Le **scout révèle l'état actuel** au sein de ce tier (combien d'unités effectivement présentes, quel stock).

### Avec le PvP

Le scout fonctionne identiquement sur les villages joueurs. Couplé au système de **puissance cachée** (`04-combat.md` § Système de puissance / Visibilité), le scout est le **moyen privilégié** de révéler l'armée d'un autre joueur — l'info publique se limite à la puissance bâtiments.

## Évolutions post-MVP (à noter, pas à implémenter)

Ces points sont **explicitement repoussés** au-delà du MVP, mais notés ici pour ne pas être perdus :

### Risque de perte ESPION

À terme, l'ESPION peut **mourir en mission** :
- Si la cible (joueur) a des ESPIONs en garnison → combat ESPION vs ESPION. Le perdant (compte le moins d'ESPIONs) perd ses unités sans rapport.
- Si la cible a une **Cachette** active (cf. [`03-buildings.md` § Cachette](./03-buildings.md#cachette-hideout)) → bonus défensif (à spécifier : pourcentage de détection, niveau requis, etc.).
- Cibles barbares : pas d'ESPION dans leur blueprint, donc toujours réussite (sauf nouvelle règle future).

### Cachette (bâtiment, désactivé MVP)

La Cachette était prévue avec deux rôles : **défense d'espionnage** (réduire le succès des scouts ennemis) et **espionnage offensif** (bonus aux missions ESPION du propriétaire). À spécifier quand on réactive le bâtiment.

### Variantes de mission

Idées à creuser plus tard :
- **Scout multiple** : envoyer N ESPIONs pour augmenter la chance de succès (post-Cachette).
- **Mission ciblée** : choisir l'info à révéler (armée seule = moins cher, complète = plus cher).
- **Sabotage** : variante où l'ESPION fait un effet négatif (vol de ressources, retardement) au lieu d'observer.

## Questions ouvertes (MVP)

- **UI d'envoi** : interface dédiée ("Envoyer espion") ou réutilisée à partir de l'écran d'attaque (bouton "Scout" en plus de "Attaquer") ?
- **UI rapport** : section dédiée dans l'inbox du joueur, ou intégrée à l'écran cible ?
- **Persistance** : combien de rapports sont stockés ? Suppression auto après N jours ?
- **Cohérence couronnes** : le scout coûte-t-il **uniquement** la production de l'ESPION, ou faut-il un coût en couronnes par mission (modèle "frais d'opération") ?

## Liens

- [`08-units.md`](./08-units.md) — unité ESPION (stats, coût, passif).
- [`04-combat.md`](./04-combat.md) — infra combat réutilisée par le scout.
- [`06-barbarians.md`](./06-barbarians.md) — lisibilité joueur et rapport de combat barbare.
- [`03-buildings.md` § Cachette](./03-buildings.md#cachette-hideout) — futur bâtiment d'espionnage défensif (post-MVP).
- [`12-village-styles.md`](./12-village-styles.md) — styles stratégiques de village (consommateur du scout pour révélation).
