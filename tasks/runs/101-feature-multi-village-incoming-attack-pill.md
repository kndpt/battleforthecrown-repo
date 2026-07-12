# Run #101 — multi-village-incoming-attack-pill

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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
- **T2 — Donnée** : (A) 7e fan-out `incomingAttacks` dans `useMultiVillageData.ts` via `useQueries` + `combine` → `Map`, gated `villageSheetOpen` ; OU (B) endpoint agrégat + service + schema + query.
- **T3 — Dérivation** : étendre `deriveVillageStateAlert` (`multiVillageSheet.ts`) pour émettre `kind:'attack'` en tête de priorité (attack > entrepôt plein > file inactive), ETA = `arrivalAt` la plus proche formatée compact ; ajouter `incoming` au runtime de `buildMultiVillageSheetItems`.
- **T4 — Câblage** : propager la `Map` incoming dans `buildSortedMultiVillageSheetItems` + memo `villageSheetItems` (nouvelle dépendance).
- **T5 — Rendu** : vérifier/ajuster la branche `isAttack` de `MultiVillageBottomSheet.tsx` (libellé, ETA, style rouge) — activation de code existant, pas de nouveau composant.
- **T6 — Tests** : `multiVillageSheet.test.ts` — cas attack présent, priorité attack > entrepôt plein > file inactive, ETA correcte, invariant fog (aucun champ attaquant).
- **T7 — Docs** : fermer le gap spec 22 (§ Alertes d'état ~L83 + retirer de § Évolutions post-MVP ~L94) + note de run.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

_(Vide au démarrage. Rempli en fin de run.)_

- [ ] `<critère>` — `<cmd>` → `<résultat>`
- **Review indépendante** : requise (invariant fog-of-war + activation branche de rendu morte + ordre de priorité des alertes ; review légère centrée sur ces 3 points).
- **Tests automatisés** : `multiVillageSheet.test.ts` (attack/priorité/ETA/fog), `yarn static-check`, `yarn test:pixi`.
- **Tests IG user** : checklist visuelle (pastille rouge sur village ciblé, absence ailleurs, apparition live via WS, disparition à résolution).
