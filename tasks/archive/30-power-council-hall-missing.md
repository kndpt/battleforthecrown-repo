# 30 — Salle du Conseil : poids défini en spec, bâtiment absent du modèle

**Sévérité** : 🟡 Majeure
**Statut** : ✅ Résolu 2026-05-10 par [run 002 audit-buildings](../runs/archive/002-audit-buildings.md) — Piste A appliquée (Council Hall implémentée comme bâtiment 1 niveau, poids 25, unlock Château 4).

## Symptôme

La spec [`09-power-and-rankings.md` § Système de poids des bâtiments](../docs/gameplay/09-power-and-rankings.md#système-de-poids-des-bâtiments) liste la **Salle du Conseil** avec :

- Poids 25 (bâtiment 1 niveau, poids unique fixe).
- Multiplicateur stratégique ×1.0.
- Référence à [`12-village-styles.md`](../docs/gameplay/12-village-styles.md) — c'est par cette salle que le joueur choisit son [style stratégique](../docs/gameplay/12-village-styles.md).

Mais côté code :

- `packages/shared/src/village/buildings.ts:1-12` — `BUILDING_TYPES` ne contient **pas** d'entrée Council Hall (`CASTLE`, `WOOD`, `STONE`, `IRON`, `WAREHOUSE`, `HIDEOUT`, `FARM`, `BARRACKS`, `WATCHTOWER`, `WALL` uniquement).
- `packages/shared/src/power/weights.ts` — pas de poids `COUNCIL_HALL` (ni avant, ni après le fix M1 du run 000). Si le bâtiment était jamais créé, il tomberait sur `DEFAULT_BUILDING_POWER_WEIGHT = 5`, soit 5× moins que la spec.
- `packages/shared/src/village/buildings.ts:35-…` — pas de `BUILDING_DEFINITIONS.COUNCIL_HALL` (donc pas de coûts, pas de temps, pas de niveau).

Conséquence : le système de [styles stratégiques](../docs/gameplay/12-village-styles.md) — qui dépend de la Salle du Conseil pour le choix — n'a pas de bâtiment vecteur côté backend. Le mécanisme actuel d'attribution de style passe sans doute par un autre canal (à confirmer).

## État actuel

- **Spec** : Salle du Conseil = bâtiment de choix de style, poids unique 25.
- **Code** : aucune référence (ni type, ni définition, ni poids).
- **Impact gameplay** : la mécanique de style stratégique n'est pas matérialisée par un bâtiment ; aucune indication visible du backend au frontend qu'il existe une "Salle du Conseil" à construire ou consulter.

## Pistes

### Piste A — Implémenter la Salle du Conseil comme bâtiment 1 niveau

1. Ajouter `COUNCIL_HALL: 'COUNCIL_HALL'` dans `BUILDING_TYPES`.
2. Ajouter `BUILDING_DEFINITIONS.COUNCIL_HALL` avec un seul niveau (1) — coûts à calibrer (réf : Salle commune des MMORTS = ~ farm-tier, mais c'est à trancher).
3. Ajouter `BUILDING_POWER_WEIGHTS.COUNCIL_HALL: 25`.
4. Synchroniser `12-village-styles.md` pour expliciter le flux : construire la Salle du Conseil → débloquer le choix de style.
5. Tester : `power.service.spec.ts` peut couvrir le cas Salle du Conseil niveau 1 = +25 puissance.

**Tradeoff** : Cohérent avec la spec ; demande un design léger (coût + déblocage Château N) et impacte le frontend (UI bâtiment, écran de choix de style).

### Piste B — Retirer la Salle du Conseil de la spec power

Si le mécanisme de style stratégique passe par un canal non-bâtiment (action API directe, choix unique au démarrage du village, etc.), supprimer la ligne « Salle du Conseil » de la spec § Système de poids et clarifier dans `12-village-styles.md` que ce n'est pas un bâtiment. Garder cohérence : un poids n'a de sens que pour un bâtiment réel.

**Tradeoff** : Plus simple ; rompt l'esthétique "tout choix structurant = un bâtiment dédié" ; à valider contre l'intention design.

### Piste C — Hybride : action liée au Château

Le choix de style devient une action exposée par le Château à un certain niveau (ex : niveau 4, comme [ticket 24](./archive/24-style-without-conquest-window.md) le suggère). Pas de Salle du Conseil dédiée. La spec power n'a alors plus à la mentionner.

**Tradeoff** : Combine A et B ; nécessite révision croisée avec ticket 24 (fenêtre de choix de style).

## Question à trancher

- La Salle du Conseil **est-elle un bâtiment** dans la vision MVP, ou un proxy doc pour un mécanisme implémenté autrement ?
- Si bâtiment : Piste A (implémenter) ou Piste C (déléguer au Château) ?
- Si pas un bâtiment : Piste B (retirer de la spec power).

## Référence audit

Run pilote 000 — `## Décisions prises § T3` (écart MAJ3 / INV-8 Salle du Conseil).
