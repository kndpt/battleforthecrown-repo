# 29 — Friction logistique par distance (pillage)

> **Statut** : MVP (Phase 12 « Ajouts mineurs MVP »). Livré [run 103](../../tasks/runs/archive/103-feature-distance-loot-friction.md).
> Promu depuis le lab [`lab/tickets/04-distance-logistics.md`](./lab/tickets/04-distance-logistics.md) — une seule des quatre frictions envisagées a été retenue pour le MVP.

## Intention

La distance est déjà un coût via le **temps de trajet**. Cette mécanique ajoute une friction **logistique** légère : au-delà d'un rayon, la **capacité de pillage** décroît. Objectif : renforcer les fronts locaux, faire compter les voisins, et contraindre la projection globale des pillages des top players **sans cap dur**.

## Périmètre — pillage uniquement

Le facteur s'applique **exclusivement au raid/pillage** (attaque sans Noble). Sont **exemptés**, et ne consomment jamais le facteur :

- **Renfort** — ne loote pas (aucune résolution de butin).
- **Conquête** — attaque partie avec un **Noble**. La conquête a déjà ses propres contraintes lourdes (Noble, fenêtre de capture) ; elle n'est pas nerfée par la distance.
- **Scout / caravane / extraction** — hors résolution de combat de pillage.

La conquête est déterminée **au départ** de l'expédition (présence d'un Noble dans l'armée envoyée), pas sur les survivants. Conséquence : une conquête dont le Seigneur **meurt** au combat — qui retombe en « raid victorieux normal » côté butin (cf. [`04-combat.md`](./04-combat.md)) — **reste exemptée** de la friction distance, puisque le prédicat a été évalué au départ.

## Formule

`lootDistanceFactor(distance, cfg)` renvoie un facteur multiplicatif dans `[floor, 1]` appliqué à la capacité de transport, en fonction de la **distance brute** attaquant→cible (euclidienne, `calculateDistance`) :

| Zone | Facteur |
|------|---------|
| `d ≤ radius` | `1` exactement (aucun malus — non-régression) |
| `radius < d < plateau` | décroissance **linéaire strictement** monotone : `1 − slope × (d − radius)` |
| `d ≥ plateau` | `floor` (jamais `< floor`, jamais `0` tant que `floor > 0`) |

Le plateau est atteint à `radius + (1 − floor) / slope` (pour `slope > 0` ; à `slope = 0` le facteur reste `1` partout, mécanique désactivée).

La capacité effective est `Math.floor(capacité × facteur)` — même règle d'arrondi que `getCaravanResourceCapacity`. La réduction se replie naturellement dans le capping existant (`metadata.cappedByCapacity`), lisible dans le rapport de combat ([`17-inbox-and-reports.md`](./17-inbox-and-reports.md)).

## Configuration (WorldConfig)

Section `combat.lootDistance` (`WorldConfigSchema`, source shared) :

| Champ | Rôle | Défaut |
|-------|------|--------|
| `radius` | rayon (tuiles) sans malus | `25` |
| `slope` | perte de facteur par tuile au-delà du rayon | `0.01` |
| `floor` | plancher du facteur, **strictement > 0** | `0.5` |

Défauts initiaux : facteur `1` jusqu'à 25 cases, puis −1 %/case jusqu'au plancher `0.5` atteint à 75 cases. **À calibrer** — garde-fou de calibrage : la tension pivot compressed-async ([`23-world-tempo-and-multipliers.md`](./23-world-tempo-and-multipliers.md)). `slope = 0` **ou** `floor = 1` désactivent de fait la mécanique (facteur toujours `1`).

## Source de vérité unique

Le helper `lootDistanceFactor` (`packages/shared/src/logic/loot-distance.ts`) est **partagé** :

- **Backend server-authoritative** (`loot.manager`) — produit le loot canonique. Gating conquête via `context.config._isConquest`.
- **Front** (`AttackDetailModal`) — pré-affiche la capacité réduite + le badge de malus **avant envoi**, uniquement en mode pillage. Le client refetch le loot canonique après la mutation (aucune dérive preview ↔ état canonique).

## Liens connexes

- [`04-combat.md` § Résolution](./04-combat.md) — raid victorieux, butin proportionnel à la capacité restante.
- [`10-conquest.md`](./10-conquest.md) / [`14-pvp-conquest.md`](./14-pvp-conquest.md) — conquête (exemptée du malus).
- [`lab/tickets/04-distance-logistics.md`](./lab/tickets/04-distance-logistics.md) — idée source (les 3 autres pistes restent hors scope).
