# Run #026 — world-tempo-plumbing-clean-cut

> **Statut** : DONE
> **Démarré** : 2026-05-16
> **Terminé** : 2026-05-16

## Cible

- **Phase roadmap** : Hors roadmap — chantier transverse pré-MVP (pivot tempo, cf. [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md))
- **Spec source** : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md) — § 5 (`WorldConfig.tempo`), § 6 (invariants), § 8 (migration cadre)
- **Type** : feature + refacto (clean cut sans alias rétro-compat)
- **Modules backend** : `world`, `combat`, `resources`, `gameplay` (recruit-noble, recruit-troops), `crowns`, `strategy` (BarbarianRuntimeService à localiser)
- **Modules frontend** : aucun (consomme l'effectif via API/WS)

## Dépendances

- Aucun run préalable. La spec 23 est ✅ tranchée MVP.
- Postcondition : débloque le Run 027 (recalibration des valeurs absolues à `tempo.global = 1.0`).

## Critère de fin (acceptance)

- [ ] `WorldConfig.gameSpeed` et `WorldConfig.economy.productionRate` n'existent plus dans le code, ni dans les schémas Zod (`packages/shared/src/world/schemas.ts`).
- [ ] `WorldConfig.tempo` exposé avec structure `{ global: number, overrides?: {...} }` conforme à § 5.1 de la spec.
- [ ] `TempoService` (shared) expose `applyDuration(absolute, axis)` (× tempo) et `applyRate(absolute, axis)` (÷ tempo). Aucun callsite backend ne manipule l'opérateur `× / tempo` à la main.
- [ ] Test pure-logic par axe : à `tempo.global = 1.0` sans override → snapshot reproduit les valeurs équivalentes à l'ancien `gameSpeed = 1 / productionRate = 1`. À `tempo.global = 0.5` → durations × 0.5 ET rates × 2. Override sur 1 axe surcharge le global pour cet axe uniquement.
- [ ] Régen barbare branchée sur `tempo.barbarianRegen` (callsite à localiser via `code-mapper`, probablement `BarbarianRuntimeService`).
- [ ] Couronnes : `crowns.service.ts` applique `puissance × 0.05 / tempo.crownsYield` (axe débit).
- [ ] Smokes backend verts (`combat-attack`, `recruit-noble`, `combat-conquest-hook`) après migration de `smoke-world-config.ts` vers `tempo`.
- [ ] `yarn static-check` vert.
- [ ] Aucun chiffre absolu modifié dans `docs/gameplay/02/03/06/10/13/14` — la recalibration est explicitement déléguée au Run 027.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] Shared world contract : remplacer `gameSpeed` / `economy.productionRate` par `tempo`, exposer `TempoService`, couvrir la résolution global/override + durée/débit.
- [x] Backend duration/rate plumbing : brancher construction, production ressources, travel, unit/lord training, captureWindow via `TempoService`.
- [x] Runtime economy plumbing : brancher régen barbare et couronnes sur les axes `barbarianRegen` / `crownsYield`.
- [x] Config data : migrer seed, fixture smoke et config locale JSON vers `tempo` sans alias rétro-compatible.
- [x] Vérification + archive : tests unit/smokes/static-check, rapport final, archivage et commit.

## Progress (rempli pendant le run)

- [x] Préflight : git clean, fiche `PLANNED`, rules, `SPEC.md`, spec 23 et `bftc-tests-policy` lus.
- [x] Cartographie : `BarbarianRuntimeService` confirmé comme callsite régen barbare ; frontend direct helpers détecté hors scope runtime de ce run.
- [x] Implémentation : `WorldConfig.tempo`, `TempoService`, callsites backend, fixture smoke, seed SQL et migration JSON ajoutés.
- [x] Test ciblé : `yarn workspace battleforthecrown-backend test -- world-config.service.spec.ts tempo.service.spec.ts` vert.
- [x] Smokes backend : préflight + 23 suites / 44 tests verts après `prisma generate`.
- [x] Static-check : `yarn static-check` vert.
- [x] Frontend : accès directs à `WorldConfig.gameSpeed` retirés des estimations Pixi ; tests Pixi verts avec env Vite locale.

## Décisions prises

- Pas de sub-agent Codex : le scope est large mais le harness courant ne permet pas de déléguer sans demande explicite user ; exécution lead avec plan visible.
- Les helpers frontend existants qui appellent encore des fonctions shared de calcul restent hors scope tant qu'ils ne consomment pas `WorldConfig.gameSpeed`; le run traite le contrat API/config et les callsites backend autoritatifs.

## Rapport final

Plomberie tempo livrée en clean cut :

- `WorldConfigSchema` expose `tempo.global` + `tempo.overrides` et ne porte plus `gameSpeed` / `economy`.
- `TempoService` shared centralise `applyDuration(absolute, axis)` et `applyRate(absolute, axis)`.
- Les callsites backend autoritatifs passent par `TempoService` : construction, production ressources, travel, training unités, training Seigneur, captureWindow, régen barbare et couronnes.
- Seed SQL, fixture smoke, migration Prisma JSON et smokes concernés migrés vers `tempo`.
- Les estimations frontend qui lisaient encore `gameSpeed` lisent maintenant `tempo`; aucun calcul autoritatif ajouté côté client.
- ADR-12 ajustée pour pointer vers le `TempoService` shared.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] `WorldConfig.gameSpeed` et `WorldConfig.economy.productionRate` retirés des sources actives et schémas Zod — preuve : `rtk grep "gameSpeed|economy\\.productionRate|WorldConfig\\.gameSpeed|SMOKE_WORLD_CONFIG\\.gameSpeed" battleforthecrown-backend/src battleforthecrown-backend/test packages/shared/src battleforthecrown-backend/scripts battleforthecrown-backend/prisma/seed-default-world-config.sql battleforthecrown-pixi/src` → 0 résultat.
  - [x] `WorldConfig.tempo` expose `global` + overrides conformes spec 23 §5.1 — preuve : `packages/shared/src/world/schemas.ts` + `yarn static-check` vert.
  - [x] `TempoService` shared applique durées × tempo et débits ÷ tempo, avec override prioritaire — preuve : `tempo.service.spec.ts` vert.
  - [x] Référence `tempo.global = 1` inchangée, `0.5` accélère durations/rates, override axe isolé — preuve : `yarn workspace battleforthecrown-backend test -- world-config.service.spec.ts tempo.service.spec.ts` → 30 tests verts.
  - [x] Régen barbare branchée sur `tempo.barbarianRegen` — preuve : `barbarians.smoke.spec.ts` vert dans la suite smoke.
  - [x] Couronnes branchées sur `puissance × 0.05 / tempo.crownsYield` — preuve : `crowns.smoke.spec.ts` vert dans la suite smoke.
  - [x] Smokes backend verts après migration fixture smoke vers `tempo` — preuve : `yarn workspace battleforthecrown-backend test:smoke:run` → 23 suites / 44 tests verts.
  - [x] `yarn static-check` vert — preuve : commande terminée exit 0.
  - [x] Aucun chiffre absolu modifié dans `docs/gameplay/02/03/06/10/13/14` — preuve : aucun diff dans ces fichiers.
- **Tests automatisés** :
  - `yarn install` — OK, restaure les dépendances locales du worktree.
  - `yarn workspace @battleforthecrown/shared build` — OK après install.
  - `yarn workspace battleforthecrown-backend test -- world-config.service.spec.ts tempo.service.spec.ts` — OK, 2 suites / 30 tests.
  - `yarn test:smoke:preflight` — OK après démarrage Postgres BFTC et application de la migration sur `battleforthecrown_smoke`.
  - `yarn workspace battleforthecrown-backend test:smoke:run` — OK, 23 suites / 44 tests.
  - `yarn static-check` — OK.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test` — OK, 26 fichiers / 142 tests.
- **Smokes lancés** : `yarn test:smoke:preflight` + `yarn workspace battleforthecrown-backend test:smoke:run`, verts.
- **Smokes ajoutés/modifiés** : fixture `battleforthecrown-backend/test/fixtures/smoke-world-config.ts` + smokes combat/conquête/Noble/barbares migrés vers `tempo`; scénario couvert : travel/capture/training/régen avec nouveau schéma config.
- **QA fonctionnelle agent** : non nécessaire au-delà des smokes réels DB/REST/worker/Outbox ; la plomberie tempo est couverte par unit + smoke.
- **Tests IG à faire par le user** :
  - [ ] Ouvrir un monde et vérifier que les estimations UI restent lisibles : temps d'amélioration bâtiment, temps d'entraînement troupe, temps Seigneur, temps de trajet attaque/scout.

## Points d'attention

- ⚠️ **Régen barbare** : la spec § 8.4 dit que le callsite **n'est pas identifié** à la rédaction (« probablement dans `BarbarianRuntimeService`, à confirmer en début de run »). L'étape `code-mapper` doit le localiser explicitement et le reporter dans `## Décisions prises`.
- ⚠️ **Couronnes** : vérifier qu'il n'existe pas un gate `if (production > 0)` qui masquerait un bug d'unités (cf. ticket archivé [`07`](../archive/07-crown-production-event-gate.md)).
- ⚠️ **Clean cut sans alias** : tous les `World.config` JSON en DB locale ont l'ancien schéma. Migration Prisma JSON-patch ou seed-reset selon préférence — pas de prod en jeu, on peut être brutal.
- ⚠️ **ADR-12** mentionnée par la spec (`docs/architecture/decisions.md § ADR-12`) — vérifier si rédigée ou à créer pendant l'étape 9 (`doc-writer`).
- ⚠️ **Convention sémantique** : `tempo < 1 = jeu plus rapide` est l'inverse de l'ancien `gameSpeed > 1 = jeu plus rapide`. Le `TempoService` doit appliquer l'opérateur correct **par axe** (durations × ; rates ÷). Couverture test obligatoire.
- ⚠️ **Frontend invariant** : aucun calcul propre. Si une consommation directe d'une valeur absolue est détectée côté pixi, c'est un bug pré-existant à ticketer séparément (pas dans ce run).

## Liens

- Spec : [`docs/gameplay/23-world-tempo-and-multipliers.md`](../../docs/gameplay/23-world-tempo-and-multipliers.md)
- Tickets archivés remplacés : [`05-world-config-multipliers-semantics`](../archive/05-world-config-multipliers-semantics.md), [`52-conquest-capture-time-speed-multiplier`](../archive/52-conquest-capture-time-speed-multiplier.md)
- Run suivant : [`027-world-tempo-recalibrate-mvp-constants`](./027-world-tempo-recalibrate-mvp-constants.md) (recalibration, dépend de ce run)
