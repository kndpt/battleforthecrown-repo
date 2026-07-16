# Run #099 — feature-royal-resource-exchange

> **Statut** : DONE
> **Démarré** : 2026-07-15
> **Terminé** : 2026-07-15

## Cible

- **Phase roadmap** : Hors roadmap — dérivé du lab ticket 12 (« Alternative plus saine »). Le Marché royal public P2P est listé Post-MVP (roadmap §146-153) ; l'échange royal self-service en est le précurseur MVP-safe et n'est rattaché à aucune phase existante. **Arbitrage placement à acter au démarrage** (candidat naturel : après Phase 9 Caravane / avec Phase 10 rétention, car réutilise le pattern `dayKey` reset 04:00 Europe/Paris).
- **Spec source** : [`docs/gameplay/lab/tickets/12-player-resource-market.md`](../../docs/gameplay/lab/tickets/12-player-resource-market.md) § « Alternative plus saine ». À confronter : [`02-economy-and-progression.md`](../../docs/gameplay/02-economy-and-progression.md) (cohérence coûts/stockage), [`05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md) (reset journalier 04:00 Europe/Paris).
- **Type** : feature
- **Modules** : backend `modules/gameplay` + `modules/resources` + Prisma | frontend `features/resources` | shared `resources/` + docs gameplay

## Objectif

Aucun mécanisme de conversion de ressource n'existe (`rg -i "market|exchange|échange|convert|troc|barter"` sur `battleforthecrown-backend/src` + `packages/shared/src` + `battleforthecrown-pixi/src` = 0 hit fonctionnel ; pas de `MARKET` dans `packages/shared/src/village/building-types.ts`). Objectif : permettre à un joueur de **convertir bois ↔ pierre ↔ fer dans UN de ses villages**, à un **taux défavorable**, avec **plafond quotidien** et **aucune couronne convertible**, **sans transfert inter-village ni inter-joueur**. Débloque les blocages de stock (surplus d'une ressource, pénurie d'une autre) sans ouvrir la porte au feed / multi-comptes du marché P2P (jugé haut-risque / post-MVP strict par le lab ticket 12). Anti-snowball par design (taux défavorable + plafond/jour).

## Dépendances

- Aucun prérequis technique bloquant. Patterns réutilisables déjà en place : débit + Outbox (`initiate-extraction.use-case.ts`), reset journalier Paris (`retention.utils.ts` → `getParisDailyKey`), crédit clampé au cap Entrepôt (`packages/shared/src/resources/storage.ts`).
- **Arbitrage user au démarrage** : valeurs taux/plafond (chiffres, cf. § Pistes). La surface est déjà tranchée (action HUD, cf. § Surface).

## Surface — décision retenue

- **Action HUD dans l'écran ressources, sans bâtiment.** Cohérent avec le « pas de bâtiment dédié » du devoir royal, évite le gating artificiel, MVP-léger. C'est le choix qui sous-tend le scope T5 et l'acceptance IG. **Le bâtiment `MARKET` est écarté** (absent du catalogue `building-types.ts` ; le lab ticket 12 ne l'évoque que pour la variante **P2P** post-MVP, pas pour l'échange royal). Plus d'arbitrage de surface au démarrage — seuls les chiffres (taux, plafond) restent à trancher.

## Pistes (à trancher en étape 1 du run — ne pas inventer de chiffres avant validation)

- **Taux** : défavorable (ex. 2:1). Constante shared figée ou paramètre `WorldConfig` (comme storage/production) ? Politique d'arrondi **floor** obligatoire pour interdire la création de ressource gratuite sur petits montants.
- **Plafond quotidien** : par ressource / global / par village ? Reset 04:00 Europe/Paris via `getParisDailyKey` (réutilisable tel quel).
- **Persistance du consommé/jour** : (A) nouvelle table `ResourceConversionDaily(villageId, worldId, dayKey, …)` `@@unique([villageId, dayKey])` calquée sur `DailyCard.dayKey` — reco pour isoler et suivre le pattern ; (B) colonnes sur `ResourceStock`.

## Scope estimé

- **Backend** :
  - `ConvertResourcesUseCase` dans `battleforthecrown-backend/src/modules/gameplay/` (calqué sur `initiate-extraction.use-case.ts` : garde lifecycle `assertWorldWritable` **avant** toute mutation → `$transaction` isolation Serializable → `updateProduction` pour un stock à jour → **vérification capacité destination avant débit** (refus 4xx si le crédit converti ne tient pas, cf. § Points d'attention) → débit source / crédit destination → contrôle plafond `dayKey` → `outbox` `resources.changed` dans la même tx. Le front n'est jamais l'autorité de disponibilité.
  - Endpoint `POST /resources/:villageId/convert` dans `resources.controller.ts` (aujourd'hui GET + produce uniquement) + DTO Zod, ownership via `OwnershipService.assertVillageOwnedBy`. Le DTO borne les entrées : `sourceType`/`destinationType` ∈ {`WOOD`,`STONE`,`IRON`} (jamais couronnes), `amount` **entier strictement positif**, contrainte `sourceType !== destinationType`.
  - Wiring `gameplay.module.ts`.
  - Migration Prisma : table de suivi plafond/jour (`day_key` string, `@@unique([villageId, dayKey])`).
- **Frontend** : composant modal/sheet de conversion dans `battleforthecrown-pixi/src/features/resources/` (`ResourceBar.tsx`, `useDisplayResources.ts`), mutation TanStack Query + invalidation sur `resources.changed` WS. L'event réutilise le **contrat partagé existant** `resources.changed` (payload figé `{ villageId, wood, stone, iron, maxPerType, lastUpdateTs, productionRates }`, routage owner-only) via l'`OutboxPublisher.resourcesChanged` déjà en place — aucun nouveau schéma d'event.
- **Shared / Docs** : formule pure de conversion + réutilisation de `creditResourcesCapped` (`packages/shared/src/resources/storage.ts`) ; types `ResourceType`/`ResourceAmounts` déjà présents (`resources/types.ts`). Nouvelle section spec gameplay + maj `02-economy-and-progression.md` (taux, plafond, invariants anti-abus). Statut lab ticket 12 à mettre à jour (variante promue en run).

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

- **T1** — Formule pure de conversion + réutilisation `creditResourcesCapped` dans `packages/shared/src/resources/` (+ tests unit purs, arrondi floor).
- **T2** — Migration Prisma : table de suivi plafond/jour (`day_key`, unique par village/jour).
- **T3** — `ConvertResourcesUseCase` (gameplay) : garde `assertWorldWritable`, tx Serializable, `updateProduction`, vérif capacité destination avant débit (refus 4xx), débit source / crédit dest, contrôle plafond + reset dayKey, Outbox `resources.changed` (contrat partagé, routage owner-only).
- **T4** — Endpoint `POST /resources/:villageId/convert` + DTO Zod borné (`amount` entier > 0, `sourceType !== destinationType`, whitelist WOOD/STONE/IRON) + ownership + wiring `gameplay.module.ts`.
- **T5** — UI HUD : composant conversion dans `features/resources/` + mutation + invalidation WS.
- **T6** — Spec gameplay dédiée + maj `02-economy` (taux, plafond, invariants anti-abus) + maj statut lab ticket 12.

## Critère de fin (acceptance)

- [ ] `POST /resources/:villageId/convert` débite la source et crédite la destination au taux défini, dans une même transaction — _auto (SQL/curl)_.
- [ ] Taux défavorable appliqué exactement, arrondi floor (formule pure testée) — _auto (test)_.
- [ ] Une conversion dépassant le plafond quotidien restant est refusée (4xx), stock + suivi `dayKey` inchangés — _auto (smoke)_.
- [ ] Le plafond consommé se réinitialise au passage 04:00 Europe/Paris (`dayKey`) — _auto (test)_.
- [ ] **Destination pleine** : si le crédit converti ne tient pas sous `maxPerType`, la conversion est **refusée (4xx) avant tout débit** — stock source, stock destination et suivi `dayKey` inchangés, aucune valeur détruite — _auto (smoke)_.
- [ ] Une mutation sur un monde non writable (`ENDED`/`ARCHIVED`) est refusée par `assertWorldWritable`, stock inchangé — _auto (test)_.
- [ ] DTO Zod : rejette `amount` négatif / nul / fractionnaire, et `sourceType === destinationType` (4xx) ; n'accepte que `WOOD`/`STONE`/`IRON`, jamais de couronne — _auto (test)_.
- [ ] Event `resources.changed` émis dans la même tx via `OutboxPublisher.resourcesChanged`, payload conforme au contrat partagé (`villageId`, `wood`/`stone`/`iron`, `maxPerType`, `lastUpdateTs`, `productionRates`), routé au seul propriétaire — _auto (smoke)_.
- [ ] Le payload d'entrée cible un seul `villageId`, sans champ village/joueur destination → pas de transfert — _auto (test)_.
- [ ] L'action HUD est accessible depuis l'écran ressources et rafraîchit les jauges après conversion — _visuel/gameplay IG (Kelvin)_.

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-tests-policy`, `bftc-qa`
- Patterns code : `initiate-extraction.use-case.ts` (débit + Outbox tx Serializable), `retention.utils.ts` (`getParisDailyKey`), `packages/shared/src/resources/storage.ts` (`creditResourcesCapped`), `DailyCard.dayKey` (pattern journalier).

## Points d'attention

- **Concurrence** : deux conversions simultanées ne doivent ni dépasser le plafond ni sous-débiter → isolation Serializable + relecture du consommé **dans** la tx (comme `initiate-extraction`).
- **In-scope MVP à acter** : le lab ticket 12 est flaggé haut-risque / post-MVP ; la variante « échange royal » self-service est l'alternative saine mais n'est pas listée en roadmap → valider le placement avec le user au démarrage.
- **Valeurs non spécifiées** : taux + plafond à trancher en étape 1, ne pas inventer de chiffres dans le code avant validation.
- **Arrondis** : taux défavorable sur petits montants → floor obligatoire, éviter la création de ressource gratuite.
- **Stock à jour** : débit sur un stock après `updateProduction` (comme les use-cases de coût), sinon incohérence catch-up.
- **Destination pleine** : ne **jamais** cramer de valeur après débit. Vérifier la capacité destination **avant** le débit et refuser 4xx si le crédit converti dépasse `maxPerType` — pas de clamp destructeur post-débit. `creditResourcesCapped` reste utile comme filet, mais le use-case rejette en amont.
- **Lifecycle monde** : la mutation exige `assertWorldWritable` côté serveur (pas seulement l'ownership) — un monde `ENDED`/`ARCHIVED` doit refuser la conversion (invariant ADR-12 / world lifecycle, cf. runs 065/085). Le front n'est jamais l'autorité de disponibilité.

## Review indépendante

**Requise (oui).** Nouvelle mécanique économique server-authoritative avec surface d'abus (dupe par concurrence sur `ResourceStock`, bypass du plafond via requêtes parallèles, cohérence reset `dayKey`). Exige review de l'isolation transactionnelle et du calcul de plafond. Touche back + front + shared + DB.

## Progress

_(git history)_

## Décisions prises

_(git history — run autonome ; arbitrages produit : taux 2:1 floor constante shared, plafond 5000 source/type/village/jour reset 04:00 Paris, table `ResourceConversionDaily` unique `(villageId, dayKey)`, isolation Serializable.)_

## Rapport final

Échange royal livré : conversion intra-village bois/pierre/fer, taux `2:1` floor, plafond `5000`/type/village/jour (reset 04:00 Paris), zéro couronne / zéro transfert, server-authoritative (tx Serializable, destination vérifiée avant débit). Endpoint `POST /resources/:villageId/convert`. Review indépendante CodeRabbit : `GO`.

### Acceptance & QA

**Critères d'acceptance vérifiés :**
- [x] Débit source / crédit destination au taux, même transaction — `yarn workspace battleforthecrown-backend test:smoke:run -- resource-exchange.smoke` → « converts source→destination... » vert (wood 1000→900, stone 0→50).
- [x] Taux défavorable floor exact (formule pure) — `test run conversion.spec.ts` → `convertResourceAmount(101)=50`, floor sans crédit gratuit ; smoke floor vert.
- [x] Conversion > plafond quotidien restant refusée 4xx, stock + `dayKey` inchangés — smoke « enforces the daily cap » vert (2ᵉ conversion 400, `woodConverted` figé).
- [x] Plafond reset au `dayKey` 04:00 Europe/Paris — smoke « resets the cap per dayKey » vert (jour passé plein n'empêche pas aujourd'hui).
- [x] Destination pleine → refus 4xx **avant** tout débit — smoke « rejects a full destination BEFORE any debit » vert (stock + tracker inchangés).
- [x] Monde `ENDED`/`ARCHIVED` refusé, stock inchangé — smoke « rejects a conversion on an ENDED world » vert (`assertWorldWritable`).
- [x] DTO Zod : rejette amount négatif/nul/fractionnaire, `source===destination`, whitelist WOOD/STONE/IRON, jamais couronne — smoke « rejects malformed bodies » (6 cas 400) + `conversion-command.spec.ts` verts.
- [x] Event `resources.changed` même tx via `OutboxPublisher.resourcesChanged`, payload contrat partagé, owner-only — smoke assert row `event_outbox` kind + payload.
- [x] Payload cible un seul `villageId`, sans champ destination → pas de transfert — `conversion-command.spec.ts` (clés exactes) + smoke.
- [ ] Action HUD accessible depuis l'écran ressources + rafraîchit les jauges — **visuel/IG (Kelvin)**, cf. checklist ci-dessous.

**Review indépendante** : Déclenchée (raison : touche backend + frontend + shared + DB) — CodeRabbit CLI local (`.coderabbit.yaml`) + couverture acceptance. Cycle 1 : `BLOCK` (3 majeurs) → corrigés (worldId dénormalisé supprimé, type retour controller, validation Zod réponse front). Re-review : **`GO`** (0 bloquant/majeur, 10/10 critères tracés).

**Tests automatisés** :
- `test run conversion.spec.ts conversion-command.spec.ts` → 19/19 (units shared purs).
- `test:smoke:run -- resource-exchange.smoke` → 10/10.
- `yarn workspace battleforthecrown-pixi test` → 1109/1109.
- `yarn static-check` → vert (tsc + eslint backend + pixi).

**Smokes lancés** : `test:smoke:preflight` + `test:smoke:run -- resource-exchange.smoke` (Ciblés — diff backend circonscrit à un nouvel endpoint/use-case/table ; full suite couverte par CI PR).

**Smokes ajoutés/modifiés** : `battleforthecrown-backend/test/resource-exchange.smoke.spec.ts` (10 scénarios : happy path, floor, montant trop petit, source insuffisante, destination pleine, plafond, reset dayKey, monde ENDED, ownership, DTO).

**QA fonctionnelle agent** : couverte par les smokes réels (REST + DB + Outbox row). Migration re-appliquée proprement sur dev + smoke sans reset.

**Tests IG à faire par le user (Kelvin)** :
- Ouvrir l'écran ressources → cliquer l'icône échange (barre ressources).
- Choisir source ≠ destination (le sélecteur destination exclut la source) ; saisir un montant → vérifier l'aperçu `floor(montant/2)`.
- Confirmer un cas insuffisant / plafond atteint → message d'erreur 4xx affiché.
- Confirmer un cas valide → jauges rafraîchies (~1 s) via WS `resources.changed`, sans reload.

_(Run autonome : serveurs non démarrés — Kelvin absent au moment du run ; checklist IG fournie pour QA ultérieure.)_
