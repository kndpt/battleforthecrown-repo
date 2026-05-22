# Run #030 — feature-world-map-village-sprites-by-castle-level

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — polish UX WorldMap (cf. archive [`27-barbarian-tier-sprites-redesign`](../archive/27-barbarian-tier-sprites-redesign.md) qui a posé l'équivalent côté barbares).
- **Spec source** : Pas de spec dédiée. Référence implicite : [`docs/gameplay/03-buildings.md` § Château](../../docs/gameplay/03-buildings.md) (niveaux 1..10).
- **Type** : `feature`
- **Modules backend** : `world-entities` (query qui sert `/world/:worldId/entities`) — exposer `castleLevel` brut sur le DTO village joueur. Pas de migration DB (le level Château est déjà persisté).
- **Modules shared** : `packages/shared` — nouvel helper pur `villageVisualTierFromCastleLevel(level: number): 1..6` + (selon arbitrage 2) helper de résolution d'asset `villageSpriteAssetForCastleLevel(level)`. **Le mapping vit dans shared** parce que d'autres features (HUD, inbox, panels, minimap) afficheront aussi le bon sprite de village et doivent consommer la même source de vérité.
- **Modules frontend** : `battleforthecrown-pixi/src/pixi/scenes/WorldMapScene.ts` (sprite resolver), `battleforthecrown-pixi/src/pixi/assets/manifest.ts` (preload des 6 sprites), `battleforthecrown-pixi/src/features/world/buildMapEntities.ts`, `battleforthecrown-pixi/src/api/world-types.ts`. Évaluer aussi `WorldMiniMap.tsx` et `SelectedEntityPanel.tsx` pour cohérence visuelle.

## Dépendances

- Aucune dépendance bloquante. Archive [`63-foreign-players-invisible-on-world-map`](../archive/63-foreign-players-invisible-on-world-map.md) a déjà migré la query entities sur la table canonique `Village` ; les niveaux de bâtiments sont accessibles via la relation Village → buildings.
- Cohabitation à respecter avec archive [`65-own-vs-foreign-villages-map-distinction`](../archive/65-own-vs-foreign-villages-map-distinction.md) (palette d'ownership) et [`61-active-village-map-indicator`](../archive/61-active-village-map-indicator.md) (halo doré pulsé sur village actif).

## Critère de fin (acceptance)

- [ ] `villageVisualTierFromCastleLevel(level: number): 1..6` existe dans `packages/shared`, exporté et testé unitairement (bornes 1, 10, hors-bornes, mapping complet).
- [ ] Le DTO `/world/:worldId/entities` expose le `castleLevel` (1..10) sur les villages joueurs, sans N+1 (vérifier via plan d'exécution ou logs Prisma).
- [ ] Sur `WorldMapScene`, un village Château 1 affiche `village-tier1.png` ; un village Château 10 affiche `village-tier6.png` ; les paliers intermédiaires suivent le mapping retenu (Piste A ou Piste B — à trancher au refinement).
- [ ] Les 6 textures `village-tier1.png` … `village-tier6.png` sont préchargées via `manifest.ts` (pas de pop visuel au premier render).
- [ ] Reconciliation Pixi : sur level-up Château (refresh ou event WS), le sprite swap **sans** recréer l'entité (zIndex, halo doré du village actif, ring d'ownership préservés).
- [ ] La distinction visuelle mes villages vs étrangers (cf. archive 65) reste lisible par-dessus le sprite tier.
- [ ] `yarn static-check` vert. Tests unit shared verts. Tests backend pertinents verts.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Arbitrages à trancher à l'étape 1 (clarification)

1. **Mapping niveau Château (1..10) → tier sprite (1..6)** : choisir entre Piste A (douce) et Piste B (early variety).

   | Niveau Château | Piste A — douce | Piste B — early variety |
   |---:|:---:|:---:|
   | 1 | T1 | T1 |
   | 2 | T1 | T2 |
   | 3 | T2 | T3 |
   | 4 | T2 | T4 |
   | 5 | T3 | T4 |
   | 6 | T3 | T5 |
   | 7 | T4 | T5 |
   | 8 | T5 | T6 |
   | 9 | T6 | T6 |
   | 10 | T6 | T6 |

   - Piste A : progression régulière, T6 réservé endgame, feedback visuel échelonné.
   - Piste B : le joueur voit son village évoluer visuellement plus tôt (récompense onboarding), plateau visuel mid/late.

2. **Backend expose `castleLevel` brut OU `visualTier` déjà mappé ?**
   Recommandation : exposer `castleLevel` brut, faire vivre le mapping dans `packages/shared` (consommé côté front Pixi + HUD + autres représentations). Un seul endroit où changer la courbe si playtest demande un rééquilibrage.

3. **Propagation temps-réel d'un level-up Château** : push WS dédié ou poll/refresh existant suffit ?
   Recommandation : si l'event `village.updated` (ou équivalent) repush déjà l'entité après upgrade, ne rien ajouter — le sprite se mettra à jour au prochain payload. Sinon, tolérer la latence du poll WorldMap (level-up Château est rare, pas critique temps-réel).

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Helper shared testé — `yarn workspace @bftc/shared test` (ou équivalent) → résultat à reporter.
  - [ ] DTO entities expose `castleLevel` — `curl http://localhost:15001/world/<worldId>/entities` (avec JWT) → vérifier présence du champ.
  - [ ] `yarn static-check` vert.
  - [ ] Sprite correct sur WorldMapScene — visuel/gameplay (QA IG).
- **Review indépendante** : `Déclenchée (raison: a — back+front simultané, contrat DTO traversant shared)` — verdict à reporter.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : à statuer (probablement aucun — feature visuelle).
- **QA fonctionnelle agent** : `curl` sur l'endpoint entities pour vérifier la présence de `castleLevel` ; lecture SQL via `bftc-db` pour confirmer un upgrade Château se reflète dans la query.
- **Tests IG à faire par le user** :
  - Ouvrir la WorldMap sur un compte avec un village Château 1 → confirmer affichage `village-tier1.png`.
  - Upgrader le Château jusqu'à un palier qui change de tier (selon mapping retenu) → confirmer swap visible.
  - Repérer un village d'un joueur étranger sur la carte → confirmer que la distinction d'ownership (ticket 65) reste lisible par-dessus le sprite tier.
  - Vérifier que le halo doré du village actif (ticket 61) cohabite correctement avec le nouveau sprite.
