# Run #105 — feature-scout-report-inapp-toast

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 6 — Notifications push (couche **in-app** seule, livrée en avance de phase comme les runs 086 / 094 / 098 / 104). Le push FCM/APNs reste Phase 6 / POST-MVP, **hors scope**.
- **Spec source** : `docs/gameplay/16-notifications.md:23` — catégorie 🟡 « Rapport reçu » (« Un rapport combat / scout important est créé », audience Participant, « ouvre vers l'inbox si pertinent »). La **moitié combat** est déjà câblée (toasts `applyBattleResolved` Victoire/Défaite + `applyVillageAttacked` Attaque repoussée/Village attaqué) ; la **moitié scout est manquante** — c'est le trou comblé ici. Modèles d'intention : § run 086 (l.32-40), § run 094 (l.42-53), § run 098 (l.55-62).
- **Type** : feature
- **Modules** : frontend `battleforthecrown-pixi/src/api/ws-bindings.ts` (`applyScoutReported`) + `ws-bindings.test.ts` + docs `16-notifications.md`. **Aucun** changement backend ni shared.

## Dépendances

- **Aucune bloquante.** L'event `scout.reported` est déjà émis et routé au scouteur, et son payload est **complet** : `packages/shared/src/events/types.ts` → `ScoutReportedPayload { expeditionId, reportId, villageId, targetKind, targetName: string | null, targetX, targetY, returnAt }`. Rien à modifier côté contrat ni routage.
- **Helper dédup déjà en place** : `dedupeToast(key, ttlMs = 10_000)` existe (`ws-bindings.ts:92-97`, `Set` + TTL borné via `scheduleTimeout`). Contrairement à ce que supposait la fiche run 104, **aucun helper à créer** — le run 105 le réutilise tel quel avec la clé `scout.reported:${expeditionId}`.
- **Surface persistante existante** (non bloquante) : `features/combat/useUnreadReportsCount.ts` compte déjà les scout reports non lus → badge rouge sur l'onglet Messages. Le trou est l'**alerte proactive à l'arrivée de l'event**, pas la surface d'inbox (livrée run 017).

## Critère de fin (acceptance)

- [ ] [visuel — Kelvin] À réception d'un event `scout.reported`, le scouteur voit un toast in-app « Rapport de scout reçu » **sans reload**.
- [ ] [auto — vitest] Le toast est émis (`pushToast` appelé 1×) à réception d'un `scout.reported`. Description = `payload.targetName` si présent, sinon fallback `(${targetX},${targetY})` — **les deux cas testés** (`targetName` nullable couvert).
- [ ] [auto — vitest] Double livraison WS (at-least-once, ADR-02) du **même** `expeditionId` → **un seul** toast, via `dedupeToast('scout.reported:${expeditionId}')`. `scout.reported` est **terminal** par expédition (il ne re-fire jamais légitimement), donc le TTL défaut 10 s ne masque aucun vrai rapport.
- [ ] [auto — vitest] `ws-bindings.test.ts` (describe `applyScoutReported`) couvre : toast émis + contenu `targetName`/fallback coords + doublon at-least-once inoffensif (un seul toast) + **conservation** des invalidations existantes (`invalidateCombatReports`, `invalidateOpenExpeditions`, `invalidateRetentionSummary`) **et** de l'update store expédition (phase `RESOLVED` → `RETURNING`).
- [ ] [auto — grep/vitest] **Aucun** toast « rapport de scout » émis par les handlers voisins (`applyScoutReturned`, `applyScoutSent`) — pas de doublon ni régression.
- [ ] [auto — static] `yarn static-check` vert (tsc + eslint back+pixi).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`, `bftc-workers-outbox` (routage event), `bftc-react-hud` (toasts)
- Points d'insertion confirmés :
  - `battleforthecrown-pixi/src/api/ws-bindings.ts:462-483` — `applyScoutReported` (update store + `invalidateCombatReports`/`invalidateOpenExpeditions`/`invalidateRetentionSummary`, **aucun `pushToast`**) ; registre `"scout.reported": applyScoutReported`.
  - `battleforthecrown-pixi/src/api/ws-bindings.ts:92-97` — `dedupeToast(key, ttlMs = 10_000)`, à réutiliser.
  - `battleforthecrown-pixi/src/api/ws-bindings.ts:1225` — `applyExtractionAttacked` : patron exact `dedupeToast('extraction.attacked:${expeditionId}')` puis `pushToast`.
  - Siblings toast combat de la même catégorie 🟡 : `applyBattleResolved` (`:404-409`), `applyVillageAttacked` (`:772-779`).
  - `battleforthecrown-pixi/src/stores/ui.ts` — `pushToast` (ne déduplique pas par id → dédup au niveau handler via `dedupeToast`).

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — [refinement, léger]** Figer le wording FR du toast (title « Rapport de scout reçu », description `targetName ?? (x,y)`, tone `success`, ttl ~5000 ms aligné combat) vs `bftc-react-hud` / writing-style. Arbitrer `targetKind` (barbare vs joueur) : rester simple MVP, pas de distinction sauf besoin évident. Deep-link inbox : la spec dit « si pertinent » → non bloquant ; toast simple acceptable (cohérent avec les toasts combat actuels non cliquables). Pas de code.
- **T2 — [front]** Dans `applyScoutReported`, après les invalidations existantes (**sans les retirer**) : `if (dedupeToast('scout.reported:${payload.expeditionId}')) pushToast({...})`. 1 fichier (`ws-bindings.ts`).
- **T3 — [front test]** Étendre `ws-bindings.test.ts` (describe `applyScoutReported`) : toast émis, contenu `targetName`/fallback coords, doublon at-least-once inoffensif, invalidations + update store conservés. 1 fichier.
- **T4 — [docs]** Ajouter § « Visibilité in-app du rapport de scout (livré — run 105) » à `docs/gameplay/16-notifications.md` (miroir 086/094/098/104) + acter que la catégorie 🟡 « Rapport reçu » a désormais sa surface scout. Push hors scope. 1 fichier.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : **non requise** — front-only + docs, aucun contrat cross-workspace modifié (payload `ScoutReportedPayload` déjà complet, routage déjà fait), rapport du joueur scouteur → aucun scrub fog-of-war à valider côté handler, pattern toast déjà établi 4× (086 / 094 / 098 / 104). Risque faible. À réévaluer « oui » seulement si le refinement enrichit un contrat (non prévu).
- **Tests automatisés** : `ws-bindings.test.ts` (`applyScoutReported`) + `yarn static-check`.
- **Tests IG user** : checklist Kelvin (toast rapport de scout à l'arrivée du scout, sans reload).
