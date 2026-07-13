# Run #101 — multi-village-incoming-attack-pill

> **Statut** : DONE
> **Démarré** : 2026-07-13
> **Terminé** : 2026-07-13

## Cible

- **Phase roadmap** : Phase 9 — Navigation multi-village (successeur différé de run 095, connexe Phase 6 / run 086 notifications attaque entrante)
- **Spec source** : `docs/gameplay/22-village-roles-and-navigation.md` (§ « Alertes d'état (MVP-léger, présentationnel) » ~L83 + § « Évolutions post-MVP » ~L94) ; connexe `docs/gameplay/16-notifications.md` (catégorie « Attaque entrante » 🔴, agrégat multi-village hors scope 086)
- **Type** : feature
- **Modules** : frontend (Pixi/React) principalement ; backend uniquement si piste B retenue en refinement

## Dépendances

- Aucune bloquante. Backend données + WS déjà livrés par run 086 (endpoint `GET /combat/:villageId/incoming`, event `attack.incoming`). Base pastilles `warning` livrée par run 095.

## Critère de fin (acceptance)

- [ ] [auto] `deriveVillageStateAlert` retourne `{ kind: 'attack' }` dès ≥1 attaque entrante non résolue pour le village (test unitaire `multiVillageSheet.test.ts`).
- [ ] [auto] Priorité respectée : un village avec attaque **et** entrepôt plein émet `attack` (attack > entrepôt plein > file inactive) (test).
- [ ] [auto] L'ETA de la pastille `attack` = `arrivalAt` la plus proche, format compact (test).
- [ ] [auto] Invariant fog-of-war : aucun champ attaquant/compo/origine dans le chemin front — le DTO reste les 5 champs `IncomingAttackDto` (`expeditionId, targetVillageId, targetX, targetY, arrivalAt`) (grep + review du runtime).
- [ ] [auto] Invariant 031/095 préservé : jamais d'alerte inventée quand la donnée incoming n'est pas chargée (`null`).
- [ ] [auto] Test d'intégration du câblage complet (pas seulement la dérivation pure) : `incomingAttacks → buildMultiVillageSheetItems`, pastille `attack` présente **uniquement** sur le village ciblé (isolation inter-village), + scénario d'invalidation via l'event WS `attack.incoming` confirmant que le sélecteur est recalculé et l'état de la pastille mis à jour.
- [ ] [auto] Contrat état monde `ENDED` : les pastilles `attack` ne sont actives qu'en `OPEN`/`LOCKED` ; en `ENDED` (après `endsAt`) le sélecteur ne traite **jamais** une attaque comme alerte active — snapshot en lecture seule, arrêt du rafraîchissement incoming, aucune action associée. Le chemin ne réintroduit pas d'alerte active post-wipe.
- [ ] [auto] `yarn static-check` + `yarn test:pixi` verts.
- [ ] [visuel/IG] Pastille rouge `attack` visible dans le sélecteur sur le village ciblé, absente sur les autres, disparaît à résolution/expiration.
- [ ] [visuel/IG] L'event WS `attack.incoming` fait apparaître la pastille sans reload (invalidation de la clé `incomingAttacks`).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-react-hud`, `bftc-workers-outbox`
- Runs connexes : `tasks/runs/archive/095-feature-multi-village-state-alerts.md` (base pastilles `warning`), `tasks/runs/archive/086-feature-incoming-attack-indicator.md` (source données incoming + event WS), `tasks/runs/archive/031-feature-multi-village-bottom-sheet-selector.md` (shell sélecteur, invariant « ne jamais inventer d'alerte sans data »)
- Fichiers de référence :
  - `battleforthecrown-pixi/src/features/layout/multiVillageSheet.ts` (`deriveVillageStateAlert` ~L119)
  - `battleforthecrown-pixi/src/features/layout/useMultiVillageData.ts` (6 fan-outs `useQueries` gated `villageSheetOpen`)
  - `battleforthecrown-pixi/src/features/design-system/components/MultiVillageBottomSheet.tsx` (`MultiVillageAlertKind` L14, branche `isAttack` ~L393)
  - `battleforthecrown-pixi/src/features/layout/multiVillageSheet.test.ts`
  - `battleforthecrown-pixi/src/api/queries/combat.ts` (`useIncomingAttacksQuery` ~L92)
  - `battleforthecrown-pixi/src/api/ws-bindings.ts` (~L350, invalidation `attack.incoming`)
  - `battleforthecrown-backend/src/modules/combat/combat.service.ts` (`getIncomingAttacks` ~L1313)
  - `battleforthecrown-backend/src/modules/combat/combat.controller.ts` (`@Get(':villageId/incoming')` ~L150)
  - `packages/shared/src/events/types.ts` (`IncomingAttackDto` ~L48)

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — Refinement (décision archi)** : trancher piste **A** (fan-out front-only : N `useQueries` sur `:villageId/incoming`, gated `villageSheetOpen`, combinés en `Map<villageId, IncomingAttackDto[]>` — zéro backend, hérite de l'invalidation WS per-village existante) **vs piste B** (nouvel endpoint agrégat `GET /combat/incoming?worldId=`, miroir de `captures/targeting-me` — 1 requête, mais nouveau back + service + schema shared + câblage invalidation WS agrégat). **Défaut recommandé : A** (présentationnel MVP-léger, cohérent 095, réutilise l'infra WS). Clarifier aussi le point d'ambiguïté ci-dessous (pastille active sheet fermée ?).
- **T2 — Donnée** : (A) 7e fan-out `incomingAttacks` dans `useMultiVillageData.ts` via `useQueries` + `combine` → `Map`, gated `villageSheetOpen` ; OU (B) endpoint agrégat + service + schema + query. **Contrainte ADR-10** (`docs/architecture/decisions.md` § ADR-10 « un store Zustand par domaine ») : router le snapshot incoming par un store Zustand dédié plutôt que garder la `Map` directement dans le hook ; si une exception (Map in-hook) est retenue au refinement, documenter explicitement les garanties d'invalidation (clé per-village `incomingAttacks`) et de navigation avant de figer l'archi.
- **T3 — Dérivation** : étendre `deriveVillageStateAlert` (`multiVillageSheet.ts`) pour émettre `kind:'attack'` en tête de priorité (attack > entrepôt plein > file inactive), ETA = `arrivalAt` la plus proche formatée compact ; ajouter `incoming` au runtime de `buildMultiVillageSheetItems`.
- **T4 — Câblage** : propager la `Map` incoming dans `buildSortedMultiVillageSheetItems` + memo `villageSheetItems` (nouvelle dépendance).
- **T5 — Rendu** : vérifier/ajuster la branche `isAttack` de `MultiVillageBottomSheet.tsx` (libellé, ETA, style rouge) — activation de code existant, pas de nouveau composant.
- **T6 — Tests** : `multiVillageSheet.test.ts` — cas attack présent, priorité attack > entrepôt plein > file inactive, ETA correcte, invariant fog (aucun champ attaquant).
- **T7 — Docs** : fermer le gap spec 22 (§ Alertes d'état ~L83 + retirer de § Évolutions post-MVP ~L94) + note de run.

## Rapport final

Piste A (front-only, zéro backend) : 7e fan-out `incomingAttacks` dans `useMultiVillageData` (gated `villageSheetOpen`, `Map` TanStack in-hook comme ses 6 frères — pas de store Zustand, cache REST hors ADR-10), factory `incomingAttacksQueryOptions` extraite (DRY). `deriveVillageStateAlert` émet `kind:'attack'` en tête de priorité (attack > entrepôt plein > file inactive), ETA = `arrivalAt` future la plus proche. Branche de rendu `isAttack` déjà présente (activée, pas recréée). Contrat ENDED tenu par construction (`WorldSessionGate` court-circuite avant la sheet).

### Acceptance & QA

**Critères d'acceptance vérifiés :**
- [x] C1 `kind:'attack'` dès ≥1 incoming — `yarn workspace battleforthecrown-pixi test run src/features/layout/multiVillageSheet.test.ts` → « emits an attack alert as soon as one incoming attack is present » vert.
- [x] C2 priorité attack > entrepôt plein > file inactive — test « prioritises attack over warehouse full and idle queue » vert.
- [x] C3 ETA = `arrivalAt` la plus proche, compact — tests « uses the nearest arrivalAt… » + « ignores an already-elapsed arrival… » (eta 5:00) verts.
- [x] C4 fog-of-war (5 champs DTO, seul l'ETA affiché) — test « surfaces only the ETA » (`Object.keys` = [eta,kind,msg]) + rendu `MultiVillageBottomSheet.tsx:394-401` ne lit que `msg`/`eta`.
- [x] C5 invariant 031 (jamais d'alerte inventée) — tests « ignores an empty incoming list » + « returns null when every incoming arrival has already elapsed » verts.
- [x] C6 intégration câblage complet + invalidation WS — `useMultiVillageData.test.tsx` (QueryClient réel + `applyAttackIncoming` réel + spy HTTP) : `attack.incoming` → refetch → pastille attack sur v1 uniquement, v2 `null`. Moitié invalidation aussi en unit `ws-bindings.test.ts:1867`.
- [x] C7 contrat ENDED — par construction : `WorldSessionGate.tsx:56-60` court-circuite vers `EndedWorldView` avant montage sheet+fan-out ; backend `getIncomingAttacks` ne renvoie que `EN_ROUTE` + `arrivalAt > now`.
- [x] C8 `yarn static-check` + `yarn test:pixi` — `yarn static-check` clean ; `yarn workspace battleforthecrown-pixi test` → 1081 passed / 138 files.

**Review indépendante** : Déclenchée (raison: invariant fog-of-war + activation branche rendu morte + ordre priorité alertes). Verdict `GO` (cycle 1) — 2 bloquants cycle 0 (ETA masquée par attaque expirée ; couverture C6) fixés et re-testés verts ; findings restants non-bloquants (faux positif typing vs convention 7 factories sœurs, test optionnel).

**Tests automatisés** : `yarn workspace battleforthecrown-pixi test` → 1081 passed / 138 files. `yarn static-check` → clean.

**Smokes lancés** : Aucun (diff strictement frontend Pixi, zéro `battleforthecrown-backend/src/`).

**Smokes ajoutés/modifiés** : Aucun (front-only).

**QA fonctionnelle agent** : couverte par le test d'intégration `useMultiVillageData.test.tsx` (chaîne WS→invalidation→recompute réelle). Pas de serveur requis.

**Tests IG à faire par le user** :
- [ ] Pastille rouge « Attaque entrante » + ETA visible dans le sélecteur multi-village sur le village ciblé.
- [ ] Absente sur les autres villages (isolation).
- [ ] Apparaît sans reload à réception de l'event WS `attack.incoming`.
- [ ] Disparaît à résolution/expiration de l'attaque.
- [ ] Filtre « Alertes » du sélecteur inclut bien le village sous attaque.
