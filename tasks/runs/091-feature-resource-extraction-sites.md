# Run #091 — resource-extraction-sites

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — feature **additive** (lab promu). Ne bloque aucune phase MVP en cours ; s'appuie sur des fondations déjà livrées (vision Watchtower, Caravane run 050).
- **Spec source** : [`docs/gameplay/lab/tickets/07-resource-extraction-sites.md`](../../docs/gameplay/lab/tickets/07-resource-extraction-sites.md) — § Piste (sites rares Bosquet/Carrière/Mine, vision Watchtower only, 1 site actif/joueur, population + escorte, attaquable pendant exploitation, sécurisation au retour, capacité finie + épuisement + respawn, durées 2/4/8 h, vol partiel), § Garde-fous, § Points à trancher (4 arbitrages). Consommateurs futurs référencés : [`16-notifications.md`](../../docs/gameplay/16-notifications.md) (catégorie « Site d'exploitation attaqué »), [`05-daily-cards-and-oyez.md`](../../docs/gameplay/05-daily-cards-and-oyez.md) (Q ciblage sites).
- **Type** : feature
- **Modules** : backend (nouvelle entité Prisma + world-entities + combat orchestration + workers) | frontend (WorldMapScene) | shared (`entities.ts` + `combat/` command)

## Objectif

Faire vivre la carte **entre les guerres** : ajouter des sites de ressources rares (Bosquet royal = bois, Carrière ancienne = pierre, Mine abandonnée = fer), visibles **uniquement dans la vision Watchtower**, exploitables via une équipe de population (+ escorte optionnelle) qui **sécurise des ressources au retour uniquement**, attaquable pendant l'exploitation (interruption = vol partiel), avec capacité finie → épuisement → respawn ailleurs.

Intention design : créer un point de friction sur la carte sans guerre totale ni attente de conquête ; valoriser la vision, la proximité et les villages avancés.

**Preuves de gap (vérifiées)** :
- Aucun footprint code : `rg -in "extraction|exploitation|resource.?site|extractionSite|resourceNode"` sur `battleforthecrown-backend/src`, `packages/shared/src`, `battleforthecrown-pixi/src` → **0 vrai match** (feature absente).
- `battleforthecrown-backend/prisma/schema.prisma` (enums ~L23-39, model `Expedition` ~L531-566) : `ExpeditionStatus` = `EN_ROUTE | RESOLVED | RETURNING` (aucune phase stationnaire « exploitation ») ; `TargetKind` = `PLAYER_VILLAGE | BARBARIAN_VILLAGE` (aucune cible « équipe »). Aucun modèle de site.
- `battleforthecrown-backend/src/modules/world/world-entities-query.service.ts` : `fetchPlayerVillages`/`fetchBarbarianVillages` seulement, pas de `fetchExtractionSites`.
- `packages/shared/src/world/entities.ts` : `WorldEntityKind` sans `RESOURCE_EXTRACTION_SITE`.

## Dépendances

- **Réutilisables (déjà livrés — base à copier, pas à coder)** :
  - Vision Watchtower : `battleforthecrown-backend/src/modules/world/vision.service.ts` (`applyFogOfWar<T extends PositionedEntity>` ~L80), `packages/shared/src/village/vision.ts` (`WATCHTOWER_VISION_LEVELS`). Gating générique.
  - Caravane de ressources (run 050, archivé) : `battleforthecrown-backend/src/modules/combat/combat.service.ts` (`initiateCaravan` ~L371-566, verrou population `population.updateMany` ~L520-531), `caravan.utils.ts`, `packages/shared/src/logic/travel-time.ts`. Pattern « population verrouillée + trajet visible + sécurisation à l'arrivée » directement transposable.
  - Schéma Zod anti-leak des entités (`world-entities-query.service.ts` ~L24-32, test `world-entities-natural-trait-leak.spec.ts`).
- Aucun doublon (0 footprint code confirmé). Aucun run déjà résolu sur le sujet.

## Critère de fin (acceptance)

Automatisables (SQL / curl / smoke / unit / grep) :

- [ ] Migration : `ResourceExtractionSite` existe, `prisma migrate deploy` passe ; sites générés en nombre **< joueurs de la zone**.
- [ ] `GET /worlds/:id/entities` renvoie un site **seulement** si sa position est dans un disque de vision du viewer ; hors vision → absent/fogged, **y compris quand `fogOfWarEnabled=false`** (jamais visible globalement — cf. Points d'attention).
- [ ] Anti-leak : le payload site n'expose que position + type de ressource + activité (jamais capacité exacte / occupant si non tranché) — test type `world-entities-natural-trait-leak.spec.ts`.
- [ ] Envoi d'une équipe verrouille la population (villageois + escorte) ; 2ᵉ envoi simultané refusé (1 site actif max/joueur) ; cap escorte respecté.
- [ ] À l'épuisement : `remainingCapacity=0` → state `DEPLETED`, ressources sécurisées plafonnées à la capacité restante.
- [ ] Ressources créditées au stock **uniquement au retour**, pas pendant l'exploitation.
- [ ] Attaque sur équipe en exploitation → interruption + vol **partiel** du non-sécurisé (montant volé < stock total accumulé, pas de jackpot).
- [ ] Épuisement déclenche un respawn ailleurs (nouveau site `ACTIVE`, ancien `DEPLETED`/supprimé).
- [ ] Events `extraction.*` émis via Outbox aux moments clés (started / depleted / attacked / returned).
- [ ] **World lifecycle** : `initiateExtraction` et l'interception `initiateAttack` appellent `WorldAccessService.assertWorldWritable` et sont **rejetées quand le monde est `ENDED`** (mêmes calls déjà présents dans `initiateCaravan`/`initiateAttack`) ; comportement `LOCKED` préservé (visibilité + production continuent, retours de membres éliminés possibles, pas de nouvelle interaction interdite au-delà des règles existantes).

Visuels (checklist Kelvin IG, ≤ 5) :

- [ ] Le site s'affiche sur la carte Pixi dans la vision Watchtower avec l'asset du bon type (bois/pierre/fer).
- [ ] L'équipe en exploitation est visible sur le site.
- [ ] Un site hors vision n'apparaît jamais (même vue « monde »).

## Références

- Rules : `.agents/rules/{conventions,docs,git,harness}.md`
- Skills : `bftc-prisma`, `bftc-workers-outbox`, `bftc-tests-policy`, `bftc-qa`, `bftc-pixi-scene`
- **Review indépendante requise** : **oui** — nouvelle surface de combat (équipe stationnaire attaquable = nouveau vecteur d'exploit/déni de service), invariant de sécurité fort (sites ne doivent **jamais** fuiter hors vision — même classe de risque que l'anti-leak `naturalTrait`), migration DB + 2 décisions d'archi (cycle `Expedition`, cible combat).

## Décomposition initiale

_(Lead étape 3 — tâches ≤5 fichiers)_

> ⚠️ **Scope large** — le run-planner recommande `$bftc-slice` en 3 tranches verticales, chacune testable IG. Découper isole le risque (leak vision sur A, exploit combat sur C). Si un seul run est retenu, viser **la tranche A seule** et ticketer B/C.
>
> 🏛️ **ADR-12 (use cases gameplay)** — toute mutation transverse (exploitation / vol / retour, écritures ressources + population/verrou + Outbox dans une transaction) doit vivre dans un **`ExtractionUseCase` sous `modules/gameplay/`** (une méthode `execute(...)` ouvrant la transaction), pas dans `combat.service`/`combat.worker`/`return.worker` qui restent des read-models + helpers de calcul. Réutiliser le *pattern* Caravane (verrou population, `Expedition`, `assertWorldWritable`) comme base de code, mais **router l'orchestration via le use case** conformément à `docs/architecture/decisions.md` § ADR-12. Si une dérogation s'impose (ex. cohérence avec l'orchestration expédition existante), la **documenter explicitement** comme dette au refinement.

**Tranche A — sites visibles (read-only, aucun combat)** :
- T1 — Modèle `ResourceExtractionSite` (worldId, x, y, resourceType, remainingCapacity, state `ACTIVE`/`DEPLETED`) + migration + génération basique de sites rares (< nb joueurs / zone).
- T2 — Exposition carte : `fetchExtractionSites` + injection `world.controller.getEntities`, **toujours** fog-gated par vision + schéma Zod anti-leak + `WorldEntityKind.RESOURCE_EXTRACTION_SITE` shared.
- T8 — Rendu Pixi : nouveau `kind` dans `WorldMapScene.ts` (`spriteSizeFor`/`styleFor` + asset bosquet/carrière/mine).

**Tranche B — boucle d'exploitation PvE** :
- T3 — Envoi équipe : `ExtractionCommand` shared (calqué `CaravanCommand`) + `modules/gameplay/ExtractionUseCase.execute(...)` (ADR-12 : transaction + Outbox) qui verrouille la population (+ escorte optionnelle), appelle `assertWorldWritable`, pose le timer 2/4/8 h, applique « 1 site actif max/joueur » + cap escorte.
- T4 — Cycle exploitation : phase stationnaire à l'arrivée (`combat.worker.ts`), accumulation plafonnée par `remainingCapacity`, épuisement → `DEPLETED`.
- T5 — Retour + sécurisation : ressources créditées **au retour uniquement** (`return.worker.ts`), plafond capacité restante.
- T7 — Respawn ailleurs à l'épuisement + events Outbox/WS.

**Tranche C — interception combat (risque concentré)** :
- T6 — Équipe en exploitation = cible attaquable (nouvelle branche `initiateAttack` + `TargetKind`), interruption = vol partiel du non-sécurisé. Review indépendant ciblé.

## Points d'attention

- **Fog toujours actif pour les sites** : `world.controller` ne fog-gate aujourd'hui que si `fogOfWarEnabled=true`. La spec impose « jamais visibles globalement » → les sites doivent être gated **inconditionnellement** (branche dédiée hors du flag global). Gate étape 1.
- **Modèle du cycle de vie** : `ExpeditionStatus` n'a pas de phase stationnaire « exploitation » ; la Caravane fait un aller-retour sans stationnement. Trancher : ajouter `EXPLOITING` à `Expedition` **vs** modèle dédié `ExtractionTeam`. Impacte `combat.worker`/`return.worker`.
- **Cible de combat neuve** : `TargetKind` = villages seulement ; une équipe mobile/stationnée comme cible étend `initiateAttack` de façon non triviale (pas de garrison, pas de bâtiments, résolution loot spécifique). Risque de sur-scope → tranche C isolée.
- **4 points non tranchés par le lab** (tiers de sites, base du cap escorte, mode de respawn, affichage de l'occupant dans la vision) → arbitrages design **avant/pendant refinement** (étape 1 pipeline), à ne PAS improviser en implémentation.
- **Cohérence puissance** : sites et équipes ne doivent **pas** entrer dans le calcul de puissance (`09-power-and-rankings.md`).
- **ADR-12 — orchestration en use case** : les writes multi-domaines (exploitation/vol/retour) passent par un `ExtractionUseCase` dans `modules/gameplay/` (transaction + Outbox), pas par les services de domaine. Aligner sur `UpgradeBuildingUseCase`/`RecruitTroopsUseCase`. Cf. `docs/architecture/decisions.md` § ADR-12 (« Use cases gameplay »).
- **World lifecycle** : `initiateExtraction` + interception `initiateAttack` doivent appeler `WorldAccessService.assertWorldWritable` (rejet en `ENDED`), à l'image des calls existants dans `combat.service.initiateCaravan`/`initiateAttack`.
- **Docs** : impact `docs/architecture/data-model.md` (nouvelle entité) + `docs/gameplay/lab/tickets/07-*.md` (statut « promu ») + éventuel renvoi depuis `16-notifications.md`.

## Progress

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Décisions prises

_(Vide au démarrage. Rempli pendant le run, supprimé à l'archive.)_

## Rapport final

### Acceptance & QA

_(Vide au démarrage. Rempli en fin de run.)_
