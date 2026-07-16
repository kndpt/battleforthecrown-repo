# Run #104 — feature-army-return-inapp-indicator

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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
- [ ] [auto — vitest] Double livraison WS (at-least-once, ADR-02) ne produit **qu'un seul** toast : dédup par `expeditionId` (Set récent à TTL court). Un toast = side-effect non idempotent → dédup obligatoire.
- [ ] [auto — vitest] `ws-bindings.test.ts` (describe `applyBattleReturned`) couvre : toast émis + contenu différencié butin/vide + doublon inoffensif + **conservation** des invalidations existantes (`resources`, `population`, `activeExpeditions`, `armyInventory`, `power`, `openExpeditions`).
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
- **T2 — [front]** Introduire un helper de **dédup toast at-least-once par `expeditionId`** (Set + TTL court), mutualisable avec le run 098 — décider où il vit (ex. `src/lib/toastDedup.ts`). ≤2 fichiers.
- **T3 — [front]** `applyBattleReturned` pousse un toast dédupliqué (survivants + butin), **sans retirer** les invalidations existantes. 1 fichier (`ws-bindings.ts`).
- **T4 — [front test]** Étendre `ws-bindings.test.ts` : toast émis, contenu différencié, doublon at-least-once inoffensif, invalidations conservées. 1 fichier.
- **T5 — [docs]** Ajouter § « Visibilité in-app du retour d'armée — livré run 104 » à `docs/gameplay/16-notifications.md` (miroir 086/094/098) + acter la **1re catégorie 🟡** avec surface in-app. 1 fichier.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : **non requise** — front-only + docs, aucun contrat cross-workspace modifié (payload déjà complet, routage déjà fait), armée du joueur → aucun scrub fog-of-war à valider, pattern toast déjà établi (086 / 094 / 045). Risque faible. À réévaluer « oui » seulement si le refinement enrichit un contrat (non prévu).
- **Tests automatisés** : `ws-bindings.test.ts` (`applyBattleReturned`) + `yarn static-check`.
- **Tests IG user** : checklist Kelvin (toast retour d'armée avec/sans butin, sans reload).
