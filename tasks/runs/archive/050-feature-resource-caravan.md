# Run #050 — feature-resource-caravan

> **Statut** : DONE
> **Démarré** : 2026-06-09
> **Terminé** : 2026-06-09

## Cible

- **Phase roadmap** : Intégrée au **scope MVP** (décision user 2026-06-07). Remplace l'entrée post-MVP « Marché royal » de [`tasks/00-mvp-roadmap.md`](../00-mvp-roadmap.md) (ligne ~151). À acter dans la roadmap comme feature MVP (placement séquentiel à confirmer en étape 1, mais hors gating des phases existantes — aucune dépendance bloquante).
- **Spec source** : [`docs/gameplay/02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) § Contraintes (l.33 « Pas de transfert direct entre villages joueur — marché prévu post-MVP » → à remplacer) + § Population (l.45-65, pop par village `used`/`max`, libération). Flux analogue : [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) § Renforts entre ses propres villages.
- **Type** : `feature`
- **Modules backend** : `combat` (`combat.service.ts` send/recall, `combat.worker.ts` dispatch arrivée, `return.worker.ts` libération pop + crédit) + `population` (écriture `used` en transaction) + `prisma/schema.prisma` (enum `ExpeditionKind`)
- **Modules frontend** : `features/world/SelectedEntityPanel.tsx`, nouveau `CaravanLaunchModal`, `api/queries.ts`, `api/ws-bindings.ts`, `pixi/entities/ExpeditionVisual.ts`
- **Modules transverses** : `packages/shared/src/` → `combat/dtos.ts`, `logic/travel-time.ts`, `events/{schemas,types}.ts`, `resources/storage.ts` (réutilisation)

## Décisions design (validées avec le user — NE PAS rouvrir)

1. **Pas de bâtiment dédié.** Expédition physique `CARAVAN` réutilisant le système de trajets : distance euclidienne × **vitesse marchande fixe**, **pas d'interception** (règle globale combat), **rappel possible pendant l'aller**, restitution gérée par `return.worker`.
2. **Coût = porteurs = population du village expéditeur A**, verrouillée le temps de l'aller-retour, **rendue au retour** (opportunity cost vs armée/construction de A).
3. **Volume** : le joueur choisit V. `porteurs = ceil(V / CARRY_PER_PORTER)`. `CARRY_PER_PORTER` est **le seul knob de volume** (constante shared). Pop libre A insuffisante → action refusée, aucun débit.
4. **Plafond arrivée** = espace libre Entrepôt de B (`getWarehouseStorageLimit`). **Excédent perdu** (non crédité) si B plein — décision user 2026-06-07. Comportement déterministe à documenter.
5. **Gratuit** : aucune fee couronnes à aucune étape.
6. **Pas de spillage** : pop + temps de trajet suffisent comme limiteurs. NE PAS implémenter de perte par distance.
7. **Invariant anti-dégénérescence** (à documenter) : le transfert lève le gate **ressources** mais jamais le gate **temps de construction** (intransférable, par village) → empêche le pattern « village nourricier unique » qui réduirait le jeu à du farming.
8. **Vitesse marchande** : `CARAVAN_SPEED` fixe, **plus lente que la cavalerie** (ressources lourdes). Caler sur la vitesse cavalerie de référence (`UNIT_STATS.speed`) en refinement — ne pas inventer la valeur, la proposer au user.

## Dépendances

- Aucune dépendance de phase bloquante — tout le socle existe (`Expedition`, `travel-time.ts`, `Population.used/max`, `return.worker`, Outbox, `ExpeditionVisual`).
- Prérequis runtime avant smoke : migration Prisma (ajout membre `ExpeditionKind.CARAVAN`) appliquée + `prisma generate` + rebuild `@battleforthecrown/shared`.

## Critère de fin (acceptance)

- [ ] `POST /combat/caravan` avec A et B tous deux possédés crée une `Expedition` `kind=CARAVAN` `status=EN_ROUTE` ; B non possédé → 403. _(auto : curl/smoke)_
- [ ] `porteurs = ceil(V / CARRY_PER_PORTER)` ; pop disponible de A < porteurs → refus (400), aucun débit ressources ni pop. _(auto)_
- [ ] Au départ : ressources débitées de A (clamp ≥ 0) **et** `Population.used` de A incrémenté de `porteurs`. _(auto : SQL/smoke)_
- [ ] À l'arrivée : ressources créditées sur B sans dépasser `getWarehouseStorageLimit(niveau Entrepôt B)` ; **excédent NON crédité (perdu)**. _(auto)_
- [ ] Au retour (`return.worker`) : `Population.used` de A décrémenté de `porteurs` ; **aucune unité ajoutée à `unitInventory`** ; expedition supprimée. _(auto)_
- [ ] Rappel en route avant arrivée : `status RETURNING`, ressources **restituées intégralement à A** au retour, pop rendue, **aucun crédit sur B**. _(auto)_
- [ ] `calculateTravelTime` caravane > cavalerie même distance (`CARAVAN_SPEED` < vitesse cavalerie). _(auto : test pur)_
- [ ] Aucune fee couronnes débitée à aucune étape. _(auto)_
- [ ] Un flux `CARAVAN` s'affiche sur la WorldMap avec un glyphe **distinct** de l'attaque/renfort + dans la liste des mouvements. _(visuel/gameplay IG)_
- [ ] Le modal d'envoi refuse visuellement un volume nécessitant plus de pop libre que disponible dans A. _(visuel/gameplay IG)_
- [ ] Docs patchées (02-economy, 04-combat, 01-overview, realtime, data-model si champ ajouté, roadmap). _(grep/relecture)_

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

> Draft de cartographie (run-planner). À raffiner à l'étape 3 du `$bftc-run`.

- **T1 — Shared** : `ExpeditionKind 'CARAVAN'`, `CaravanCommand` DTO, constantes `CARAVAN_SPEED` + `CARRY_PER_PORTER` (`travel-time.ts`), events `caravan.{sent,recalled,arrived,returned}` (`events/{schemas,types}.ts`). _(≤5 fichiers)_
- **T2 — Prisma** : ajout `CARAVAN` à enum `ExpeditionKind` + migration ; trancher en refinement si champ dédié nécessaire (porteurs / payload ressources) vs réutilisation du champ JSON `loot`. `prisma generate`.
- **T3 — Backend send** : `combat.service.ts initiateCaravan()` (clone `initiateReinforce:233`) — ownership A+B possédés, calcul porteurs, vérif pop libre A, débit ressources A clampé, increment `Population.used` A, create Expedition, outbox `caravan.sent`, schedule avec `CARAVAN_SPEED`. + DTO Zod + route controller.
- **T4 — Backend arrivée** : `combat.worker.ts` branche `CARAVAN` dans dispatch (cf. l.130 REINFORCE) → `handleCaravanArrival` : crédit ressources B clampé `getWarehouseStorageLimit` (excédent perdu), set `status RETURNING` + `returnAt`, outbox `caravan.arrived`, `resourcesChanged(B)`.
- **T5 — Backend retour** : `return.worker.ts` gérer `kind CARAVAN` — décrémenter `Population.used` A de porteurs, **ne pas toucher `unitInventory`**, restituer ressources à A si recalled, supprimer expedition, outbox `caravan.returned`. ⚠️ diverge nettement du chemin loot→attackerVillage existant.
- **T6 — Frontend action+modal** : `SelectedEntityPanel.tsx` action « Envoyer ressources » (village possédé non-soi) + `CaravanLaunchModal` (volume, sélection village cible possédé, preview porteurs/pop) + `useInitiateCaravanMutation` (POST `/combat/caravan`).
- **T7 — Frontend feed temps réel** : `ws-bindings.ts` apply `caravan.*` + `ExpeditionVisual.ts` glyphe `CARAVAN` distinct + intégration liste mouvements.
- **T8 — Docs** : `02-economy` (§33-34 marché→caravane + invariant gate temps construction intransférable + excédent perdu), `04-combat` (flux `CARAVAN` à côté `REINFORCE`), `01-overview` (boucle éco), `realtime.md` (events `caravan.*`), `data-model.md` (si champ Expedition ajouté), `00-mvp-roadmap.md` (**requalifier « Marché royal » post-MVP → Caravane MVP**, ajouter la feature au scope MVP).

## Points d'attention

- **`return.worker` diverge** : il restitue `unitInventory` + loot puis supprime l'expedition. La caravane n'a pas d'unités et son transfert va vers B (pas restitution à A en nominal). La branche CARAVAN doit être designée explicitement (T5), pas clonée aveuglément.
- **Stockage des ressources transportées** : réutiliser le champ JSON `loot` de l'Expedition (parsé par `parseCombatLoot`/codecs) ou champ dédié ? Décision archi à trancher en refinement (impacte T2 + `data-model.md`).
- **Pop verrouillée** : `population.service` est lecture seule ; écriture directe `tx.population.update({ used: { increment/decrement } })` dans la transaction (comme partout). Vérifier qu'aucune invariante (`construction.worker`, `recruit`) ne suppose que `used` ne bouge que via build/train.
- **`CARAVAN_SPEED`** : proposer une valeur calée sur la vitesse cavalerie (`UNIT_STATS.speed`) en refinement, validée par le user.
- **Excédent perdu** : tranché (user). Documenter explicitement le comportement déterministe côté spec + UI (avertir le joueur si l'envoi dépasse l'espace libre de B ? à décider en T6).
- **Rétention** : `DailyCardTaskType` a `SEND_REINFORCEMENT` mais pas d'équivalent caravane — hors scope par défaut, mentionner si une tâche « envoyer une caravane » est souhaitée.

## Progress (rempli pendant le run)

- 2026-06-09 — Préflight effectué, branche `run/050-feature-resource-caravan` créée depuis `origin/main`, PR requise confirmée.
- 2026-06-09 — Shared/backend/front/docs implémentés : `ExpeditionKind.CARAVAN`, route `POST /combat/caravan`, events `caravan.*`, workers arrivée/retour, modal Pixi, activité royaume, rendu carte et docs.
- 2026-06-09 — Filets ajoutés : smoke backend caravane, tests WS Pixi caravane, test view-model activité caravane, test pur vitesse caravane.
- 2026-06-09 — Review indépendante déclenchée, verdict `GO`; deux mineurs corrigés (roadmap MVP + test activité `CARAVAN`).
- 2026-06-09 — Static-check, tests ciblés et smoke caravane verts.

## Décisions prises

- `CARAVAN_SPEED = 20`, plus lent que la cavalerie (`35`) et proche d'une vitesse de fantassin lourd.
- `CARRY_PER_PORTER = 500`, porteurs dérivés par `ceil(totalResources / CARRY_PER_PORTER)`.
- Ressources transportées stockées dans `Expedition.loot.resources` plutôt que dans un champ Prisma dédié.
- Les débits ressources/pop sont atomiques via `updateMany` conditionnel pour éviter les doubles envois concurrents.
- Events dédiés `caravan.sent`, `caravan.arrived`, `caravan.recalled`, `caravan.returned`; pas de réutilisation du generic `expedition.recalled` pour les caravanes.
- Le reviewer spécialisé a échoué côté modèle indisponible; relance effectuée avec agent indépendant standard, même consigne d'isolement, verdict `GO`.

## Rapport final

Caravane de ressources livrée en vertical slice complet. Le backend accepte un transfert entre deux villages du même joueur, verrouille les porteurs sur la population du village source, débite les ressources au départ, crédite la destination à l'arrivée dans la limite de l'Entrepôt, perd l'overflow, puis libère les porteurs au retour. Le rappel en route restitue les ressources à l'origine et ne crédite pas la cible.

Côté front, la carte propose l'action "Envoyer ressources" sur un autre village possédé, ouvre un modal avec volumes/porteurs/population libre, POST `/combat/caravan`, affiche les événements temps réel dans les activités du royaume et rend un glyphe Pixi distinct. Les docs gameplay, architecture realtime/data-model, roadmap MVP et `SPEC.md` sont alignés.

Aucun ticket follow-up ouvert.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] `POST /combat/caravan` crée une `Expedition` `CARAVAN`; cible non possédée refusée — `yarn workspace battleforthecrown-backend test:smoke:run -- caravan.smoke.spec.ts` → 3/3 verts.
  - [x] Portage `ceil(V / CARRY_PER_PORTER)`, refus pop insuffisante sans débit — `caravan.smoke.spec.ts` → vert.
  - [x] Départ débite A + incrémente `Population.used` A — `caravan.smoke.spec.ts` → vert.
  - [x] Arrivée crédite B sans dépasser Entrepôt, overflow perdu — `caravan.smoke.spec.ts` → vert.
  - [x] Retour libère les porteurs, aucune unité ajoutée, expedition supprimée — `caravan.smoke.spec.ts` → vert.
  - [x] Rappel restitue A, ne crédite pas B — `caravan.smoke.spec.ts` → vert.
  - [x] Caravane plus lente que cavalerie — `yarn workspace battleforthecrown-backend test -- src/modules/combat/travel-time.spec.ts` → 21/21 verts.
  - [x] Aucune fee couronnes — `caravan.smoke.spec.ts` → vert.
  - [x] Flux `CARAVAN` dans WorldMap + activités — `yarn workspace battleforthecrown-pixi test -- src/features/combat/kingdomActivitiesViewModel.test.ts src/api/ws-bindings.test.ts` → 44/44 verts.
  - [x] Modal refuse visuellement une pop libre insuffisante — couvert par validation UI + à vérifier IG.
  - [x] Docs patchées — `docs/gameplay/*`, `docs/architecture/*`, `tasks/00-mvp-roadmap.md`, `SPEC.md`.
- **Review indépendante** : `Déclenchée (raison: back+front, SPEC.md modifié, diff > 100 lignes, invariant durable)` → verdict `GO`; findings mineurs corrigés.
- **Tests automatisés** :
  - `yarn workspace @battleforthecrown/shared build` → vert.
  - `yarn workspace battleforthecrown-backend prisma generate` → vert.
  - `yarn workspace battleforthecrown-backend test -- src/modules/combat/travel-time.spec.ts` → 21/21 verts.
  - `yarn workspace battleforthecrown-pixi test -- src/features/combat/kingdomActivitiesViewModel.test.ts src/api/ws-bindings.test.ts` → 44/44 verts.
  - `yarn static-check` → vert.
- **Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/caravan.smoke.spec.ts` couvre nominal, pop insuffisante et rappel.
- **QA fonctionnelle agent** : `yarn workspace battleforthecrown-backend test:smoke:preflight` → vert; `yarn workspace battleforthecrown-backend test:smoke:run -- caravan.smoke.spec.ts` → 3/3 verts.
- **Tests IG à faire par le user** :
  - Ouvrir un village possédé autre que le village actif sur la WorldMap, vérifier l'action "Envoyer ressources".
  - Entrer un volume qui dépasse la pop libre et vérifier le blocage visuel.
  - Envoyer une petite caravane, vérifier le glyphe distinct sur la carte et la carte "CARAVANE" dans les activités.
  - Rappeler la caravane avant arrivée et vérifier qu'elle repart vers l'origine.
