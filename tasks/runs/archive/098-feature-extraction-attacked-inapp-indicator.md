# Run #098 — extraction-attacked-inapp-indicator

> **Statut** : DONE
> **Démarré** : 2026-07-14
> **Terminé** : 2026-07-14

## Cible

- **Phase roadmap** : Phase 6 — Notifications push (couche **in-app** seulement, livrée en avance de phase comme runs 086/094 ; push FCM/APNs reste Phase 6 / POST-MVP).
- **Spec source** : [`docs/gameplay/16-notifications.md`](../../docs/gameplay/16-notifications.md) l.17-21 — catégorie 🔴 Critique « Site d'exploitation attaqué » (audience Exploitant). Précédents à calquer en intention : § run 086 (l.32-40) et § run 094 (l.42-53).
- **Type** : feature
- **Modules** : backend `combat`/extraction lifecycle (émetteur event) | frontend `api/ws-bindings` + tests | shared `events` (payload + schéma Zod)

## Objectif

Livrer la **seule couche in-app manquante** des 3 catégories 🔴 Critiques MVP de la spec 16 : « Site d'exploitation attaqué ». Les 2 catégories sœurs ont leur surface in-app (086 « Menaces », 094 « Sièges ») ; l'extraction n'a **aucune** traduction UI. Quand l'escorte d'une équipe d'exploitation est interceptée (`extraction.attacked`), l'exploitant doit être averti in-app sans reload. Push hors scope (Phase 6 / POST-MVP), comme 086/094.

**Cause racine** : `applyExtractionAttacked` (`battleforthecrown-pixi/src/api/ws-bindings.ts:1184-1196`) se limite à invalider `worldEntities` (+ état extraction si `interrupted`). Aucun toast/badge, contrairement à `applyVillageAttacked` (`ws-bindings.ts:759-766`) qui pousse un toast défenseur. Le routage backend est **déjà correct** (`event-outbox-notification-planner.ts:272` → `'extraction.attacked': userByVillage('villageId')` route à l'exploitant) : le trou est côté présentation front, éventuellement bridé par la pauvreté du payload.

## Dépendances

- **Avant (DONE, requis)** : [`091-feature-resource-extraction-sites`](./archive/091-feature-resource-extraction-sites.md) — feature extraction + event `extraction.attacked`.
- **Connexe (patron partiel, à ne PAS calquer littéralement)** : [`086-feature-incoming-attack-indicator`](./archive/086-feature-incoming-attack-indicator.md), [`094-feature-capture-window-defender-visibility`](./archive/094-feature-capture-window-defender-visibility.md).

## Décision de cadrage (à trancher étape 1 du run)

⚠️ **`extraction.attacked` est un event DISCRET (fait accompli), pas un état persistant.** Contrairement à 086 (`attack.incoming` → expéditions `EN_ROUTE` listables) et 094 (fenêtres `OPEN` listables), il n'existe **aucun état « exploitation menacée » requêtable** : l'interception s'émet une fois puis l'extraction continue (défaite attaquant) ou rentre (interruption). Le patron « endpoint `targeting-me` + onglet countdown » **ne se transpose donc pas**. Les extractions **actives** sont déjà visibles dans l'onglet « Expéditions » (`kindEXTRACTION` mappé, `kingdomActivitiesViewModel.ts:56-70`). Le vrai trou = une **alerte in-app (toast)** à l'arrivée de l'event.

Pistes (trancher à l'étape 1) :

- **Chemin A (recommandé, MVP-léger)** : enrichir `ExtractionAttackedPayload` avec `resourceType` (+ éventuel label site) et pousser un toast informatif dans `applyExtractionAttacked`, calqué sur `applyVillageAttacked`. Aucun endpoint, aucun onglet. Cross-workspace (shared + back + front).
- **Chemin B (front-only strict)** : toast sans enrichir le payload (message générique + `stolen` si présent). Zéro back/shared, moins informatif.
- **Chemin C (déconseillé)** : endpoint + onglet type `targeting-me` — bloque sur l'absence d'état persistant ; introduirait une persistance injustifiée en MVP-léger.

## Critère de fin (acceptance)

- [ ] `[visuel]` À la réception d'un event `extraction.attacked`, l'exploitant voit une alerte in-app (toast) sans reload.
- [ ] `[visuel]` L'alerte distingue « escorte défaite / récolte volée » (`interrupted=true`) de « attaque repoussée » (`interrupted=false`).
- [ ] `[visuel]` Quand `stolen > 0`, les quantités volées (bois/pierre/fer) sont affichées.
- [ ] `[automatisable]` L'alerte n'expose aucune identité/origine de l'attaquant (fog-safe) — le payload n'en porte pas ; test asserte l'absence.
- [ ] `[automatisable]` `ws-bindings.test.ts` couvre le nouveau comportement (toast émis + invalidations existantes conservées).
- [ ] `[automatisable]` Une double livraison WS (at-least-once) ne produit **pas** de toast ni d'état dupliqué : le toast est dédupliqué par `expeditionId` (ex. `Set` récent à TTL court), conformément à [ADR-02](../../docs/architecture/decisions.md) (« le client doit dédupliquer si pertinent » — un toast est un side-effect, cas pertinent, contrairement à l'invalidation TanStack naturellement idempotente).
- [ ] `[automatisable]` (si chemin A) le champ `resourceType` est présent dans le payload émis par `extraction-lifecycle.service.ts` et validé par le schéma Zod miroir.
- [ ] `[automatisable]` `yarn static-check` vert (tsc + eslint back+pixi).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-workers-outbox` (event Outbox → WS), `bftc-react-hud` (toast/store UI)

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — [refinement, gate]** Trancher chemin A/B/C : payload enrichi (`resourceType`/site) ou non. Pas de code.
- **T2 — (si A) shared** : ajouter `resourceType` (+ label site optionnel) à `ExtractionAttackedPayload` (`packages/shared/src/events/types.ts:362-369`) + schéma Zod miroir (`packages/shared/src/events/schemas.ts`) ; rebuild `@battleforthecrown/shared`. ≤3 fichiers.
- **T3 — (si A) back** : renseigner les nouveaux champs dans `createOutboxEvent('extraction.attacked', …)` (`extraction-lifecycle.service.ts:447-459`). 1 fichier.
- **T4 — front** : `applyExtractionAttacked` pousse un toast (interrupted vs repoussé, `stolen`) via le store UI, **sans retirer** les invalidations existantes. 1 fichier.
- **T5 — front test** : étendre `ws-bindings.test.ts` (describe `applyExtractionAttacked` ~l.2012+) — toast émis, contenu fog-safe, doublon at-least-once non nuisible. 1 fichier.
- **T6 — docs** : ajouter à `docs/gameplay/16-notifications.md` une § « Visibilité in-app du site d'exploitation attaqué — livré run 098 » (miroir des § 086/094) + acter la catégorie 3 in-app close. 1 fichier.

## Review indépendante

**REVIEW_INDÉPENDANT_REQUIS : oui** (dégradable à « non » si l'étape 1 collapse au chemin B front-only, aucun contrat modifié).

Raison : si chemin A retenu → modification d'un contrat d'event cross-workspace (shared payload + back émetteur + front consommateur) sur une catégorie 🔴 critique, avec exigence fog-of-war explicite (miroir des scrubs 086/094). Critère skill (a) back+front satisfait.

## Points d'attention

- **CRITIQUE** : `extraction.attacked` = event discret, pas d'état persistant → ne PAS créer d'endpoint `targeting-me`-like sans introduire une persistance (déconseillé ; l'interception n'écrit volontairement aucun `CombatReport`, dette future-ticketée cf. `extraction-lifecycle.service.ts:333-335`).
- Ne pas dupliquer une surface « extractions en cours » : les extractions actives sont déjà dans l'onglet « Expéditions » (`kindEXTRACTION`).
- Payload actuel pauvre (`{expeditionId, worldId, villageId, siteId, interrupted, stolen{wood,stone,iron}}`) : pas de `resourceType`/nom/coords → toast peu informatif sans enrichissement.
- Idempotence at-least-once (**obligatoire, non optionnel**) : le toast est un side-effect → une double livraison Outbox ne doit PAS produire 2 toasts. Dédup **requise** par `expeditionId` (identifiant stable déjà porté par le payload ; ex. `Set` récent à TTL court). Exigence tranchée par [ADR-02](../../docs/architecture/decisions.md) (« dédupliquer si pertinent ») — cf. critère d'acceptance WS ci-dessus. Ne pas laisser cette dédup à l'appréciation du run.
- Après toute modif de `packages/shared` → rebuild `@battleforthecrown/shared` avant de croire tests/smokes.
- Vérifier que l'invalidation conditionnelle `if (payload.interrupted)` (`ws-bindings.ts:1191`) reste correcte après ajout du toast.

## Rapport final

**Synthèse** : Chemin A retenu — payload `ExtractionAttackedPayload` enrichi de `resourceType` (rendu **optionnel** shared type+Zod pour éviter le hot-loop Outbox sur rows pré-deploy, hazard run 078) ; `applyExtractionAttacked` pousse un toast fog-safe (error+quantités volées si `interrupted`, success « Attaque repoussée » sinon), dédupliqué par `expeditionId` (Set TTL court, ADR-02), lookup site défensif (guard `typeof`). Diff 7 fichiers (~194 insertions).

### Acceptance & QA

**Critères d'acceptance vérifiés**
- [x] Toast in-app sans reload à réception `extraction.attacked` — `yarn workspace battleforthecrown-pixi test --run src/api/ws-bindings.test.ts` → 64 passed (tests toast interrupted/repoussé).
- [x] Distinction escorte défaite/volé vs attaque repoussée — `visuel` + tests tone `error`/`success`.
- [x] Quantités volées affichées si `stolen>0` — test `toContain('Bois 100')`/`'Fer 40'`.
- [x] Fog-safe (aucune identité/origine attaquant) — test `.not.toMatch(/attaquant|origine|\(\d+,\s*\d+\)/i)` ; payload sans champ attaquant.
- [x] Dédup at-least-once par `expeditionId` — test « no second toast » (1 toast après double livraison, invalidation idempotente false→true).
- [x] `resourceType` présent dans payload émis + validé Zod — `test:smoke:run -- extraction.smoke` → 10 passed (assert `resourceType === 'WOOD'`) + compat legacy testée `.not.toThrow()`.
- [x] `yarn static-check` vert — Done in 27.77s (tsc + eslint back+pixi).

**Review indépendante** : Déclenchée (raison: (a) back+front, (c) diff >100 lignes). Verdict final `GO` après BLOCK→fix (2 majeurs cycle 1 : hazard Outbox requis→`.optional()` + cast non validé→guard défensif ; puis durcissements test/typeof). 1 « major » CR résiduel sur code pré-existant (`createOutboxEvent` direct, 15 usages) → hors scope, ticket follow-up `task_cbfa064e`.

**Tests automatisés** : `test --run src/api/ws-bindings.test.ts` → 64 passed. `yarn static-check` → vert.

**Smokes lancés** : `test:smoke:preflight` OK + `test:smoke:run -- extraction.smoke` → 10 passed. Ciblés (diff backend = 1 ligne payload dans émetteur existant, couvert par ce smoke d'interception).

**Smokes ajoutés/modifiés** : `extraction.smoke.spec.ts` — assertion `resourceType` sur le payload émis (interception).

**QA fonctionnelle agent** : couverte par smoke (event Outbox émis + payload) + tests front (binding toast). Pas de démarrage serveur nécessaire.

**Tests IG à faire par le user** :
- [ ] Déclencher une interception d'escorte d'exploitation (perdante) → vérifier le toast rouge « Site d'exploitation attaqué » avec quantités volées + label site.
- [ ] Interception repoussée (escorte gagnante) → toast vert « Attaque repoussée ».

_(Progress / Décisions : voir git history.)_
