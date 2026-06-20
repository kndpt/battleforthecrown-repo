# Run #078 — feature-defeat-conquest-modal-carousel

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

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

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

_(Vide au démarrage.)_

- [ ] <critère> — `<cmd>` → <résultat>
- **Review indépendante** : **requise** — enrichit un payload shared multi-surfaces, touche le flux émotionnellement critique de finalisation conquête, acquittement persistant cross-session. Garder un œil sur la dédup live/boot et la garde « conquérant ne voit pas la modal ».
- **Tests automatisés** : …
- **Tests IG user** : checklist Kelvin (modal carrousel mobile, esprit Salle du Conseil, perte dernier village).
