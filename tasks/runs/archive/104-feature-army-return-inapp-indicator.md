# Run #104 — feature-army-return-inapp-indicator

> **Statut** : DONE
> **Démarré** : 2026-07-17
> **Terminé** : 2026-07-17

## Cible

- **Phase roadmap** : Phase 6 — Notifications push (couche **in-app** seule, livrée en avance de phase comme les runs 086 / 094 / 098). Le push FCM/APNs reste Phase 6 / POST-MVP, **hors scope**.
- **Spec source** : `docs/gameplay/16-notifications.md:22` — catégorie 🟡 « Retour d'armée » (audience Propriétaire, « relance une décision »). Modèles d'intention : § run 086 (l.32-40, attaque entrante), § run 094 (l.42-53, fenêtre de capture défenseur) et run 098 (site d'exploitation attaqué, `PLANNED`).
- **Type** : feature
- **Modules** : frontend `battleforthecrown-pixi/src/api/ws-bindings.ts` + helper dédup toast + `ws-bindings.test.ts` + docs `16-notifications.md`. **Aucun** changement backend ni shared.

## Dépendances

- **Aucune bloquante.** L'event `battle.returned` est déjà émis et routé au propriétaire du village (`return.worker.ts:157-179`, notification `'n'` = `userByVillage('villageId')`) et son payload est **complet** : `packages/shared/src/events/types.ts:84` → `BattleReturnedPayload { expeditionId, reportId, villageId, survivingUnits: UnitMap, loot: { resources: LootResources } }`. Rien à modifier côté contrat.
- **Coordination souple avec run 098 (`PLANNED`)** : les deux runs ont besoin d'une **dédup toast at-least-once par `expeditionId`**. Aucun helper réutilisable n'existe (grep : pas de `Set` TTL). Mutualiser un helper unique plutôt que dupliquer un `Set` inline — le premier des deux runs qui passe pose le helper, l'autre le réutilise. Non bloquant.

## Critère de fin (acceptance)

- [ ] [visuel — Kelvin] À réception d'un event `battle.returned`, le propriétaire voit un toast in-app « armée rentrée » **sans reload**.
- [ ] [visuel — Kelvin] Le message différencie **« retour avec butin »** (quantités bois/pierre/fer ramenées) de **« retour à vide »** (survivants seuls, `loot` à 0).
- [ ] [auto — vitest] **Condition de déclenchement explicite** : le toast est émis dès qu'un event `battle.returned` est reçu **avec** au moins un survivant (`survivingUnits` non vide) **ou** au moins une ressource de butin `> 0`. Cas `survivingUnits` vide **et** butin entièrement à 0 → **aucun toast** (le return worker ne pose de toute façon pas de `returnAt` sans survivant, cf. guard `return.worker.ts:88-96` ; ce cas reste couvert par test défensif). Les deux cas (« butin sans survivant » et « ni survivant ni butin ») sont testés.
- [ ] [auto — vitest] Double livraison WS (at-least-once, ADR-02) ne produit **qu'un seul** toast : dédup par `expeditionId` via un `Set` à **TTL borné explicite**. Fenêtre cible : couvrir la redelivery WS (poll Outbox ~1 s + rejeu à la reconnexion) — **≥ 60 s** retenu comme borne large (le retour d'un `expeditionId` est un event **terminal** : il ne re-fire jamais légitimement, donc un TTL généreux ne masque aucun vrai retour, il borne juste la croissance mémoire). Valeur exacte figée en T2.
- [ ] [auto — vitest] `ws-bindings.test.ts` (describe `applyBattleReturned`) couvre : toast émis + contenu différencié butin/vide + doublon **dans la fenêtre TTL** inoffensif (un seul toast) + livraison **après expiration TTL** conforme au comportement documenté + **conservation** des invalidations existantes (`resources`, `population`, `activeExpeditions`, `armyInventory`, `power`, `openExpeditions`).
- [ ] [auto — grep/vitest] **Aucun** toast « retour d'armée » émis par les handlers voisins (`scout.returned`, `expedition.returned` / rappel, `caravan.returned`) — pas de doublon ni régression.
- [ ] [auto — static] `yarn static-check` vert (tsc + eslint back+pixi).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-workers-outbox` (routage event), `bftc-react-hud` (toasts)
- Points d'insertion confirmés :
  - `battleforthecrown-pixi/src/api/ws-bindings.ts` — `applyBattleReturned` (store + invalidations, **aucun `pushToast`**) ; registre `"battle.returned": applyBattleReturned`.
  - `battleforthecrown-pixi/src/stores/ui.ts:70` — `pushToast` (ne déduplique pas par id → dédup au niveau handler).
  - Canal visuel butin : `refundToast.ts` + `ToastStack.tsx:17` (`refundItems` rend des icônes ressources, réutilisable — libellé à neutraliser côté ToastStack si réemployé).
  - `return.worker.ts:88-96` (guard « pas de snapshot → pas d'event ») et `:157-179` (émission `battle.returned` **uniquement si non-recalled** ; `recalled` → `expedition.returned`, SCOUT → `scout.returned`).

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — [refinement, gate]** Trancher : (a) libellés « retour avec butin » vs « retour à vide », (b) canal d'affichage du butin (réutiliser `refundItems` façon run 045 vs description texte), (c) tone (`info` vs `success`). Pas de code.
- **T2 — [front]** Introduire un helper de **dédup toast at-least-once par `expeditionId`** (Set + TTL borné, cible ≥ 60 s pour couvrir la fenêtre de redelivery WS ; figer la constante), mutualisable avec le run 098 — décider où il vit (ex. `src/lib/toastDedup.ts`). ≤2 fichiers.
- **T3 — [front]** `applyBattleReturned` pousse un toast dédupliqué (survivants + butin), **sans retirer** les invalidations existantes. 1 fichier (`ws-bindings.ts`).
- **T4 — [front test]** Étendre `ws-bindings.test.ts` : toast émis, contenu différencié, doublon at-least-once inoffensif, invalidations conservées. 1 fichier.
- **T5 — [docs]** Ajouter § « Visibilité in-app du retour d'armée — livré run 104 » à `docs/gameplay/16-notifications.md` (miroir 086/094/098) + acter la **1re catégorie 🟡** avec surface in-app. 1 fichier.

## Rapport final

**Synthèse** : Run front-only conforme au plan, avec **deux écarts assumés**. (1) T2 sans objet : le run 098 avait déjà posé le helper de dédup (`dedupeToast`, `ws-bindings.ts:92`) — la fiche l'avait manqué (grep sur `toastDedup`, pas `recentToastKeys`) ; le scénario « le premier des deux runs pose le helper, l'autre réutilise » s'est réalisé dans l'autre sens, donc aucun `src/lib/toastDedup.ts` créé (2 consommateurs, tous deux dans `ws-bindings.ts` → extraction = YAGNI), TTL passé explicitement à 60 s vs défaut 10 s. (2) Review indépendante **déclenchée** malgré la prévision « non requise » : le diff a dépassé 100 lignes (critère (c)) — et elle a payé, en rattrapant 2 bloquants invisibles depuis un vitest ciblé. Diff 5 fichiers de code + docs (~+212/-9).

### Acceptance & QA

**Critères d'acceptance vérifiés**
- [x] Toast in-app « armée rentrée » sans reload — `visuel` (reste à valider IG par Kelvin) ; binding prouvé par `ws-bindings.ts:453-463` (`pushToast` dans `applyBattleReturned`) + test `ret-loot`.
- [x] Message différencie « retour avec butin » de « retour à vide » — `visuel` + `vitest` → butin > 0 : tone `success` + `refundItems` (icônes bois/pierre/fer) ; butin nul : tone `info` + « Retour à vide — aucun butin ».
- [x] Condition de déclenchement OU (≥1 survivant **ou** ≥1 ressource > 0), les 2 cas testés — `yarn workspace battleforthecrown-pixi vitest run src/api/ws-bindings.test.ts` → tests `ret-loot-nosurv` (butin sans survivant → toast) et `ret-nothing` (ni l'un ni l'autre → 0 toast).
- [x] Double livraison WS → un seul toast, dédup par `expeditionId`, TTL borné explicite 60 s — tests `ret-dup` (2 livraisons → 1 toast) et `ret-ttl` (livraison après `BATTLE_RETURNED_TOAST_DEDUP_TTL_MS + 1` → 2e toast, comportement documenté).
- [x] `describe applyBattleReturned` couvre toast + contenu différencié + doublon + post-TTL + **conservation des 6 invalidations** — `ret-invalidate` (`armyInventory`, `openExpeditions`) + test pré-existant (`resources`, `population`, `activeExpeditions`, `power`). Les invalidations restent inconditionnelles, en amont des 2 gardes.
- [x] Aucun toast « retour d'armée » chez les handlers voisins — `grep "Armée rentrée" battleforthecrown-pixi/src` → 1 seule occurrence (`ws-bindings.ts:455`) ; `scout.returned` / `expedition.returned` / `caravan.returned` / `reinforcement.returned` sans `pushToast`. `expedition.recalled` porte « Armée rappelée » (tone `warning`) — toast pré-existant distinct, émis **au rappel** et non au retour → pas de doublon.
- [x] `yarn static-check` vert — `Done in 27.75s` (tsc backend + tsc pixi + eslint back+pixi), exit 0.

**Review indépendante** : **Déclenchée** (raison : critère (c) — diff > 100 lignes ; la fiche la prévoyait « non requise », réévaluée en cours de run). Verdict final `GO` après `BLOCK` → fix cycle 1/3. Les 2 bloquants étaient réels et invisibles depuis un vitest ciblé : (1) `SPEARMAN` n'est pas un `UnitType` (`UNIT_TYPES` = MILITIA|SQUIRE|WARRIOR|…) → 7 × TS2353, vert en vitest car le typage est effacé au runtime, rouge au `tsc` ; (2) `ToastStack.test.tsx` (**hors diff**) assertait encore les anciens aria-labels → suite rouge. Fixés (`SPEARMAN`→`WARRIOR`, 3 assertions alignées) et gates reproduites indépendamment par le reviewer. 2 mineurs assumés : assertion redondante avec une couverture existante ; valeur 60 s en clair dans la doc gameplay (info utile au lecteur, constante exportée et citée).

**Tests automatisés** : `yarn test:pixi` (suite **complète**, pas ciblée) → `Test Files 146 passed (146)` / `Tests 1171 passed (1171)`. `yarn static-check` → vert. 7 `it` ajoutés au `describe applyBattleReturned`.

**Smokes lancés** : `Non lancés localement, raison : diff strictement front (aucun fichier sous battleforthecrown-backend/src/), aucun endpoint/worker/event touché — le payload et le routage de battle.returned sont inchangés ; full smoke couvert par CI PR.`

**Smokes ajoutés/modifiés** : Aucun — aucune surface backend modifiée.

**QA fonctionnelle agent** : Non nécessaire — run front-only sans surface serveur. Le comportement est purement un mapping event WS → store UI, entièrement couvert en unit avec le vrai store Zustand (pas de mock). Aucun serveur démarré (règle QA : pas de QA IG agent).

**Tests IG à faire par le user** :
- [ ] Lancer un raid gagnant qui ramène du butin → au retour, toast vert « Armée rentrée » avec les icônes bois/pierre/fer et les bonnes quantités, **sans reload**.
- [ ] Lancer un raid qui rentre sans butin (cible vide) → toast bleu « Armée rentrée » / « Retour à vide — aucun butin ».
- [ ] Vérifier qu'un rappel d'armée affiche toujours « Armée rappelée » au moment du rappel, sans doublon « Armée rentrée » au retour.

_(Progress / Décisions : voir git history.)_
