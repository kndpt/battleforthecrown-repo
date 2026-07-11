# Run #100 — feature-village-resettlement

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors phase feature dédiée — écart spec↔code sur [`02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) (crown-sink « Déplacer un village / resettlement » documenté, non câblé). Rattachable Phase 1 (consolidation existant) mais **feature-sized**, pas un simple audit.
- **Spec source** : [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) § Couronnes → Dépenses (table L133-138, ligne « Déplacer un village / resettlement | 200 »). **Aucune section mécanique dédiée n'existe → à écrire.** Contrainte durable liée : [`docs/gameplay/27-village-natural-traits.md`](../../docs/gameplay/27-village-natural-traits.md) (trait lié à la tile) → à amender (exception recompute sur relocation).
- **Type** : feature
- **Modules** :
  - backend : `modules/village/` (nouveau use-case `relocateVillage`), `modules/crowns/crowns.service.ts` (débit + `createCrownsChangedEvent`, pattern à réutiliser), `modules/world/village-placement.service.ts` (tile libre, `zoneCapacity`, unique `worldId_x_y`), `modules/strategy/village-strategy.service.ts` (**référence** du pattern débit atomique + cooldown + Outbox — à copier, pas modifier), vision/world-entities (recompute disque + blip), `event/` Outbox (`village.moved` ou réutilisation `crowns.changed`+`resources.changed`).
  - frontend : `battleforthecrown-pixi/` panneau village / sélecteur multi-village (surface déclencheur) + modale confirmation (coût 200 + **avertissement changement de trait**) + éventuelle sélection de tile destination sur la carte + invalidations TanStack (`villages`/`resources`/`crowns`) + réconciliation carte sur event WS.
  - shared/docs : `packages/shared/src/village/traits.ts` (`deriveNaturalTrait`, recompute), `packages/shared/src/crowns` (coûts), DTO relocate request/response (`village|world/dtos.ts`), doc gameplay (nouvelle section 02 + amendement 27).
  - Prisma : a priori **pas de migration** (x,y et `naturalTrait` déjà colonnes) — à confirmer. Colonne cooldown seulement si garde-fou cooldown retenu.

## Dépendances

- Traits naturels (run 088) : **livré** — pas un prérequis de code mais un **contrat design à étendre** (recompute sur relocation).
- Navigation multi-village (runs [021](archive/021-feature-village-labels-navigation.md) / [031](archive/031-feature-multi-village-bottom-sheet-selector.md)) : **livrés** — fournissent la surface UI d'où déclencher l'action.
- Aucune dépendance runtime bloquante. Bloqué uniquement par une **décision produit** (désirabilité MVP + destination + garde-fous) à trancher en étape 3 du `$bftc-run`.

### Liens détectés (préflight `$bftc-plan`)

- **Doublon** : Aucun (`rg 'resettle|relocate|déplacer un village'` sur `tasks/` = 0 hit).
- **À faire avant (contrat design)** : [`27-village-natural-traits.md`](../../docs/gameplay/27-village-natural-traits.md) — le trait est recomputé depuis `(worldId,x,y)` à ~7 endroits (combat/return worker, projection stratégie, intel, `village.service`). Une relocation **doit** recompute+persister `naturalTrait`, sinon toutes les projections de prod deviennent incohérentes. Règle à acter dans la spec 27 (exception à « jamais modifié »).
- **Connexe** : runs 021/031 (surface UI) ; [`26-private-map-markers.md`](../../docs/gameplay/26-private-map-markers.md) (markers tile-based — vérifier orphelins sur l'ancienne tile).
- **Keywords scannés** : `[resettlement, déplacer, village, couronnes/crowns, relocate, tile]`.

## Critère de fin (acceptance)

- [ ] **[auto: curl/SQL/test]** `POST` relocate débite **exactement 200 couronnes** de façon atomique (`updateMany WHERE balance >= 200`) ; solde insuffisant → 400 **sans** débit.
- [ ] **[auto: SQL]** Après move, `Village.(x,y)` = tile cible, ancienne tile libérée, contrainte `worldId_x_y` respectée (aucune collision).
- [ ] **[auto: test/SQL]** `Village.naturalTrait` post-move == `deriveNaturalTrait(worldId, newX, newY)`.
- [ ] **[auto: outbox/smoke]** `crowns.changed` émis après débit + `resources.changed` porte les nouvelles prod rates (trait recomputé).
- [ ] **[auto: smoke]** Relocation refusée si tile occupée / hors bornes / viole le spacing de placement.
- [ ] **[auto: smoke]** Relocation refusée si garde-fous violés (attaque entrante en vol / file de construction non vide / armée ou caravane en vol / capture en cours) — set exact selon PISTE 2.
- [ ] **[auto: test guard]** `naturalTrait` toujours absent du payload `world-entities` public après move (non-régression fog spec 27).
- [ ] **[visuel/gameplay]** Action atteignable depuis le panneau village / sélecteur ; modale de confirmation affichant coût 200 + avertissement changement de trait **avant** validation.
- [ ] **[visuel + partiel auto]** Carte : blip et disque de vision déplacés à la nouvelle position, ancienne position purgée.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-prisma`, `bftc-workers-outbox`, `bftc-react-hud`, `bftc-pixi-scene`
- Review indépendante : **REQUISE** — 4 déclencheurs présents (a) back+front, (b) modifie/crée SPEC, (c) diff > 100 lignes, (d) invariant durable (recompute trait + garde-fous anti-esquive).

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers ; ordre indicatif)_

- **T1 — [SPEC/décision]** Écrire la section mécanique resettlement (doc 02) : coût, destination, garde-fous, effet trait ; amender spec 27 (exception recompute). **Trancher la désirabilité MVP + PISTE 1/2 avec Kelvin** (bloqueur amont réel).
- **T2 — [back]** Use-case `relocateVillage` : validation tile libre (réutiliser `VillagePlacementService`), garde-fous, orchestration transaction (calquer `changeStrategy`).
- **T3 — [back]** Débit 200 couronnes atomique + `createCrownsChangedEvent` (pattern strategy service, `WHERE balance >= cost`).
- **T4 — [back]** Recompute+persist `naturalTrait` via `deriveNaturalTrait`, update `(x,y)`, émettre `resources.changed` (nouvelles rates) + event `village.moved` Outbox.
- **T5 — [back]** Carte/vision : recompute disque de vision, mise à jour world-entities/blip, réconciliation `zoneCapacity` (ancienne vs nouvelle zone).
- **T6 — [shared]** DTO relocate request/response + payload event ; contrat exporté lecture seule frontend.
- **T7 — [front]** Surface déclencheur (panneau/sélecteur) + sélection tile destination (si PISTE 1b) + modale confirmation (coût + warning trait).
- **T8 — [front]** Invalidations TanStack (villages/resources/crowns) + réconciliation carte sur `village.moved`.

### Pistes de design à trancher (étape 3 `$bftc-run`)

1. **Destination** : (a) tile aléatoire allouée par le système (réutilise `findVillagePosition`, zéro UI carte, MVP-cheap) ; (b) le joueur choisit une tile libre sur la carte (plus riche, gros surcoût front + validation). **Impact scope majeur.**
2. **Garde-fous MVP-safe proposés** : village « au repos » uniquement — interdit si attaque entrante, file de construction non vide, armée/caravane en vol, ou capture en cours ; tile libre only ; **aucun bonus** au déménagement ; cooldown optionnel (réutiliser le pattern cooldown de `villageStrategyConfig`).
3. **Trait** : **acté recompute** (nouvelle tile = nouvelle identité, cohérent spec 27 « lié à la tile »). Alternative rejetée : figer le trait d'origine (romprait l'invariant tile-derived).
4. **Villages éligibles** : capitale seulement ? conquis inclus ? barbares exclus (déjà gardé côté strategy). À trancher.

## Points d'attention

- **Désirabilité MVP** : resettlement absent des phases feature de la roadmap ; ligne de table sans marqueur post-MVP. **Trancher avec Kelvin AVANT de coder** — possiblement post-MVP.
- **Ligne stale voisine** : « Activer un bonus temporaire (bénédiction) | 150 » dans la même table = système supprimé (cf. `05-daily-cards-and-oyez.md` L24 + `tasks/archive/17-blessings-temporal-effects.md`). À nettoyer/annoter en passant.
- **Recompute trait = gain/perte de bonus éco** : doit être communiqué en confirmation ; contredit littéralement « jamais modifié » de spec 27 → formaliser l'exception.
- **Esquive d'attaque entrante** : confirmer que les expéditions référencent `villageId` (pas coords) — sinon une attaque en vol pourrait être esquivée par un move → garde-fou « pas de relocation sous attaque entrante » obligatoire.
- **Barbarian spawning** autour de l'arrivée : NON re-déclenché a priori (`barbarian-village.factory`) — à valider (sinon re-spawn de voisins hostiles au déménagement).
- **Markers/intel tile-based (spec 26)** : vérifier les orphelins laissés sur l'ancienne tile.
- **Capitale dérivée** : basée sur `conqueredAt`/`createdAt` (pas x,y) → un move ne change PAS la capitale ; à confirmer côté sélecteur.
- **ESTIMATION_SCOPE : large** — segmentation possible : livrer T1 (spec + décisions) comme ticket séparé avant le run d'implémentation si PISTE 1b retenue. Évaluer `$bftc-slice` au démarrage.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

_(Vide au démarrage. Rempli en fin de run.)_
