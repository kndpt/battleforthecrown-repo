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

## Progress

_(git history)_

## Décisions prises

_(git history)_

## Rapport final

Modal défaite carrousel livrée full-stack : payload `village.conquered` + report `captureFinalized` enrichis (`newOwnerName`/`conquerorName` + `lostVillageVisualTier`/`visualTier`, snapshot au moment T), slice store `defeatCarousel` (ajout à chaud + dédup `villageId`), `DefeatModal`/`DefeatModalHost` montés dans `App.tsx`, hydratation boot des reports non lus côté défenseur + acquittement serveur-authoritatif via `PATCH /combat/report/:id/read` (résolution `reportId` par refetch impératif pour les items live). Aucune migration.

### Acceptance & QA

- [x] Finalisation capture village joueur → previousOwner reçoit `village.conquered` — `test:smoke:run -- conquest-finalize` → 3/3, assert `previousOwnerId === victim.userId`.
- [x] `applyVillageConquered` pousse défaite si `userId===previousOwnerId`, jamais si `newOwnerId` — `vitest run src/api/ws-bindings.test.ts` → vert ([ws-bindings.ts:635](battleforthecrown-pixi/src/api/ws-bindings.ts)).
- [x] 2ᵉ item pendant modal ouverte → append sans reset `defeatActiveIndex` — `vitest run src/stores/ui.test.ts` → vert.
- [x] Dédup : deux pushes même `villageId` → 1 item carrousel — `vitest run src/stores/ui.test.ts` → vert.
- [x] Boot/reconnexion charge reports `captureFinalized` non lus défenseur + dédup live — `vitest run src/ui/modals/DefeatModalHost.test.tsx` → tests (a)/(a bis) verts.
- [x] « Valider » → `PATCH /combat/report/:id/read` → `readByDefender=true` (ne réapparaît plus) — smoke assert `readByDefender===true` ; host tests (b)/(d) verts (refetch résout reportId des items live).
- [x] Item expose asset exact + nom + message perte + pseudo conquérant + CTA `navigateToWorldMapFocus` — `DefeatModal.tsx` + host test (c) → `pendingFocus` posé.
- [x] Payload + report portent pseudo + snapshot tier au moment T — smoke assert `newOwnerName`/`lostVillageVisualTier`/`conquerorName`/`visualTier` ; lecture **avant** transfert ([conquest.service.ts](battleforthecrown-backend/src/modules/combat/conquest.service.ts)).
- [ ] **[Kelvin/IG]** Modal esprit « Salle du Conseil / Voie du village », carrousel lisible mobile — `visuel`.
- [ ] **[Kelvin/IG]** Perte du **dernier village** : modal s'affiche, aucune erreur avec `villageId=null` contexte, état « éliminé » valide — `visuel` (item utilise `payload.villageId`, jamais le contexte nullifié ; couvert en logique par ws-bindings.test.ts).

- **Review indépendante** : Déclenchée (raison: back+front, payload shared multi-surfaces, diff >100 lignes, invariant acquittement cross-session). 1ᵉ passe `BLOCK` (ack item live sans reportId non persisté) → fix (refetch impératif + test (d)) → 2ᵉ passe `GO`. 2 mineurs résiduels non-bloquants (markRead idempotent ; edge refetch sans match hors archi).
- **Tests automatisés** : `vitest` pixi (modals + stores/ui + ws-bindings + session) → 57 verts ; backend unit `event-outbox-notification-planner` → 17 verts.
- **Smokes lancés** : Ciblés — `test:smoke:preflight` OK + `test:smoke:run -- conquest-finalize` → 3/3 (nouveau scénario cible joueur + ack readByDefender). Full smoke = CI PR.
- **Smokes ajoutés/modifiés** : `test/conquest-finalize.smoke.spec.ts` (+1 `it` : conquête village joueur → routing victime + enrichissement payload/report + `PATCH /read` → `readByDefender`).
- **QA fonctionnelle agent** : couverte par smoke (Outbox + DB + REST réels).
- **Static-check** : `yarn static-check` → vert.
- **Tests IG à faire par le user** : checklist Kelvin (2 items visuels ci-dessus : esprit modal/lisibilité mobile + perte dernier village).
