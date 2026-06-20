# Run #078 — feature-defeat-conquest-modal-carousel

> **Statut** : DONE
> **Démarré** : 2026-06-20
> **Terminé** : 2026-06-20

## Cible

- **Phase roadmap** : Conquête PvP — UX victime manquante (cf. [`docs/gameplay/14-pvp-conquest.md`](../../docs/gameplay/14-pvp-conquest.md)). Notif temps réel + modal carrousel côté joueur qui perd un village.
- **Spec source** :
  - [`14-pvp-conquest.md` § Matrice des rapports inbox de capture](../../docs/gameplay/14-pvp-conquest.md) — ligne « Fin de fenêtre réussie » → rapport `Capture perdue` côté ancien propriétaire + events temps réel `village.conquered`.
  - [`14-pvp-conquest.md` § Perte du dernier village — état éliminé](../../docs/gameplay/14-pvp-conquest.md) — `WorldMembership` conservé, rapports conservés, retour autorisé, `villageId=null` valide.
- **Type** : feature
- **Modules** :
  - backend : `combat/conquest.service.ts`, `event/event-outbox-notification-planner.ts` (vérif), `combat/combat-report.{service,presenter,controller}.ts` (réutilisé)
  - frontend : `stores/ui.ts`, `ui/modals/` (nouveau `DefeatModal` + host), `App.tsx`, `api/ws-bindings.ts`, `api/queries.ts`, helper asset village React
  - shared : `events/schemas.ts` + `events/types.ts` (`VillageConqueredPayload`)

## Décisions tranchées au cadrage (Kelvin)

- **Acquittement = PISTE B (serveur-authoritatif)**. « Valider » marque `readByDefender=true` sur le(s) `CombatReport` `captureFinalized`. Au boot, le carrousel ne se reconstruit qu'à partir des reports `captureFinalized` **non lus** côté défenseur. Garantit l'idempotence cross-session — la modal ne réapparaît plus après refresh/reconnexion. **Aucune migration** (`readByDefender` + endpoint `PATCH /combat/report/:id/read` existent).
- **Enrichissement = oui, pas de dette**. Le payload `village.conquered` et le report `captureFinalized` doivent porter **le pseudo du conquérant** et de quoi rendre **l'asset exact du village perdu** (snapshot du niveau Château / tier visuel **au moment T**, pendant la transaction de finalisation où les bâtiments hérités sont encore lisibles). Pas de fallback générique : feature robuste.

## Dépendances

- Run archivé [047 — Rapports de capture](./archive/047-feature-capture-reports.md) (DONE) — rapport `Capture perdue` côté victime déjà livré. Volet historique en place.
- Run archivé [024 — Modal Victoire de conquête](./archive/024-feature-conquest-victory-modal.md) (DONE) — patron `VictoryModal` + host singleton `App.tsx`. **Réutiliser le patron, PAS la FIFO** (cf. point d'attention carrousel).
- Run archivé [048 — Map focus links](./archive/048-feature-map-focus-links.md) (DONE) — `useWorldMapNavigation().navigateToWorldMapFocus({x,y})`. CTA « pointer sur la map » réutilisé tel quel.
- Aucune migration DB.

## Critère de fin (acceptance)

- [ ] [auto: smoke] Finalisation capture sur village joueur → le `previousOwner` reçoit `village.conquered` (non-régression du routing existant).
- [ ] [auto: unit/grep] `applyVillageConquered` pousse un item « défaite » quand `userId === previousOwnerId`, et **ne pousse jamais** quand `userId === newOwnerId` (le conquérant ne voit pas la modal défaite).
- [ ] [auto: unit store] Pousser un 2ᵉ item alors que la modal est ouverte **ajoute** l'item au carrousel sans fermer la modal ni réinitialiser `activeIndex` (ajout à chaud).
- [ ] [auto: unit store] Dédup : deux `village.conquered` pour le même `villageId` → un seul item carrousel.
- [ ] [auto: unit] Au boot/reconnexion, le client charge les `CombatReport` `captureFinalized` **non lus côté défenseur** et reconstruit le carrousel ; dédup avec un éventuel event WS live (id stable `reportId`/`villageId`).
- [ ] [auto: smoke/curl] « Valider » appelle `PATCH /combat/report/:id/read` (role defender) → `readByDefender=true` → la modal ne réapparaît plus après refresh.
- [ ] [auto: unit] Chaque item expose : asset exact du village perdu, nom du village, message de perte, **pseudo du conquérant**, et un CTA qui appelle `navigateToWorldMapFocus({x,y})`.
- [ ] [auto: smoke/unit] Le payload `village.conquered` et le report `captureFinalized` portent le pseudo conquérant + le snapshot d'asset (niveau Château / tier visuel au moment T).
- [ ] [visuel/gameplay — Kelvin] Modal dans l'esprit « Salle du Conseil / Voie du village » (réf. run 029), carrousel lisible sur mobile.
- [ ] [visuel/gameplay — Kelvin] Perte du **dernier village** : modal s'affiche normalement, aucune erreur avec `villageId=null`, joueur reste sur un état « éliminé » valide.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-workers-outbox` (events/Outbox), `bftc-react-hud` (store/modal), `bftc-prisma` (report), `bftc-tests-policy`, `bftc-qa`

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1 — [shared+back] Enrichir le contrat.** `VillageConqueredPayload` (`events/schemas.ts` + `types.ts`) : ajouter `newOwnerName` (pseudo) + snapshot asset (`castleLevel`/`visualTier` au moment T). `conquerVillageInTx` + `writeCaptureFinalReportInTx` (`conquest.service.ts`) : résoudre le pseudo via `newOwnerId`, lire le niveau Château avant transfert, l'inscrire dans `details.captureFinalized` et le payload. Rebuild `@battleforthecrown/shared`. (≤4 fichiers)
- **T2 — [store] Slice `defeatCarousel`** dans `stores/ui.ts` : `items[]`, `activeIndex`, `pushDefeatItem` (ajout à chaud + dédup par `villageId`), `acknowledge`/`dismiss`. Tests unitaires store. (≤2 fichiers)
- **T3 — [front bind] Brancher la victime** : `applyVillageConquered` (`ws-bindings.ts`) → si `userId === previousOwnerId` : `pushDefeatItem`. Garder `pushVictoryModal` pour `newOwnerId`. Test bindings. (≤2 fichiers)
- **T4 — [UI] `DefeatModal` + `DefeatModalHost`** (calqués sur `VictoryModal*`), carrousel interne (asset + nom + message perte + pseudo conquérant + CTA map), monté 1× dans `App.tsx`. (≤4 fichiers)
- **T5 — [boot/query] Hydratation + acquittement** : query `CombatReport` `captureFinalized` non lus côté défenseur (`queries.ts`) → hydrate le carrousel au démarrage ; « valider » = `PATCH /combat/report/:id/read`. (≤3 fichiers)
- **T6 — [asset] Helper React** de résolution de l'asset village par tier visuel pour l'item carrousel (équivalent React de `aliasFor`, dérivé de `villageVisualTierFromCastleLevel` + snapshot T1). (≤2 fichiers)
- **T7 — [tests] Smoke backend** non-régression routing victime + acquittement `readByDefender`. (≤2 fichiers)

## Rapport final

Synthèse : payload `village.conquered` + report `captureFinalized` enrichis (pseudo conquérant `newOwnerName` + snapshot castle level `villageCastleLevel` lu pré-transfert) ; slice store `defeatCarousel` (hot-add + dédup villageId + backfill reportId + ack index) ; `DefeatModal`/`DefeatModalHost` carrousel monté 1× dans `App.tsx` ; acquittement PISTE B via `PATCH /combat/report/:id/read` + hydratation boot des rapports non lus. Champs d'enrichissement rendus optionnels sur le wire (Zod + interface) pour décoder les rows Outbox antérieures au deploy (fix du finding majeur reviewer).

### Acceptance & QA

**Critères d'acceptance vérifiés :**

- [x] [smoke] previousOwner reçoit `village.conquered` (village joueur) — `yarn workspace battleforthecrown-backend test:smoke:run -- conquest-finalize.smoke` → `payload.previousOwnerId===victim.userId`, 3/3 pass.
- [x] [unit] `applyVillageConquered` push défaite si `userId===previousOwnerId`, jamais si `newOwnerId` — `yarn workspace battleforthecrown-pixi test run src/api/ws-bindings.test.ts` → assert `defeatItems` length 0 (conquérant) / 1 (victime).
- [x] [unit store] 2e item à chaud n'ferme pas la modal ni ne reset `defeatActiveIndex` — `… test run src/stores/ui.test.ts` → index préservé à 1.
- [x] [unit store] Dédup deux `village.conquered` même `villageId` → 1 item — idem ui.test.ts.
- [x] [unit] Boot reconstruit depuis rapports `captureFinalized` non lus défenseur + dédup live (id stable) — `… test run src/features/combat/useDefeatCarouselHydration.test.tsx`.
- [x] [smoke] « Valider » → `PATCH /combat/report/:id/read` (defender) → `readByDefender=true` — conquest-finalize.smoke (PATCH réel + reread DB `readByDefender===true`).
- [x] [unit] Item expose asset/nom/message/pseudo conquérant/CTA map — `DefeatModal.tsx` + ws-bindings.test.ts `toMatchObject({newOwnerName, castleLevel, x, y})`.
- [x] [smoke/unit] Payload + report portent pseudo conquérant + snapshot castle T — smoke (`payload.villageCastleLevel===3`, `details.captureFinalized.castleLevel===3`).
- [ ] [visuel — Kelvin] Modal esprit « Salle du Conseil », carrousel lisible mobile — `visuel` → QA IG.
- [ ] [visuel — Kelvin] Perte du **dernier** village : modal OK, aucune erreur `villageId=null`, état éliminé valide — `visuel` (logique : `setContext({villageId:null})` couvert) → QA IG.

- **Review indépendante** : Déclenchée (raison : back+front + payload shared multi-surfaces + diff >100 lignes + invariant durable). Verdict initial **BLOCK** (1 majeur : champs Zod `required` → hot-loop possible sur rows Outbox `village.conquered` en file pré-deploy). **Résolu** : champs rendus `.optional()` (schéma + interface) + fallbacks consumer (`newOwnerName ?? 'Un seigneur ennemi'`, `villageCastleLevel ?? null`) — mitigation exacte prescrite par le reviewer ; mineur villageAsset (`Math.max` redondant) simplifié ; mineur ack-sans-reportId accepté (conforme PISTE B, fenêtre ~1s backfillée par hydratation). Re-test vert.
- **Tests automatisés** : `yarn static-check` ✓ ; pixi `503 passed` (dont ui/ws-bindings/hydration +12) ; backend `event-outbox-notification-planner` `17 passed`.
- **Smokes lancés** : `test:smoke:preflight` ✓ puis `test:smoke:run -- conquest-finalize.smoke` → `3 passed`. **Ciblés** (diff conquest isolé ; full smoke = CI PR).
- **Smokes ajoutés/modifiés** : `conquest-finalize.smoke.spec.ts` — nouveau test village joueur : enrichissement payload+report (pseudo + castle snapshot=3) + acquittement `PATCH /read` → `readByDefender=true`.
- **QA fonctionnelle agent** : smoke = serveur réel + REST PATCH + lecture Outbox/DB. OK.
- **Tests IG à faire par le user** : checklist Kelvin ci-dessous. Serveurs **non démarrés** (run autonome planifié, pas d'utilisateur présent).
  1. Perdre un village joueur → modal « Village perdu » s'affiche avec l'asset du village + pseudo du conquérant.
  2. Perdre 2 villages rapprochés → carrousel (flèches/points), ajout à chaud sans fermer la modal.
  3. « Valider » → modal disparaît ; après F5 elle ne réapparaît pas.
  4. « Voir sur la carte » → recentre la carte sur le village perdu.
  5. Perte du **dernier** village → modal OK, aucune erreur, état « éliminé » cohérent.
