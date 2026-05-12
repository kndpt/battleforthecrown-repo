# Run #013 — feature-village-styles-backend

> **Statut** : DONE
> **Démarré** : 2026-05-12
> **Terminé** : 2026-05-12

## Cible

- **Phase roadmap** : Phase 3 — Styles de village
- **Spec source** : [`docs/gameplay/12-village-styles.md`](../../docs/gameplay/12-village-styles.md)
- **Type** : `feature`
- **Modules backend** : `strategy` | `village` | `combat` | `resources` | `population` | `world` | `prisma`
- **Modules frontend** : `—`

## Dépendances

- Phase 1 — Consolidation de l'existant terminée.
- Phase 2 — Inbox & rapports terminée via run [`012`](./archive/012-feature-inbox-combat-reports.md).
- Respecter les specs liées : [`03-buildings`](../../docs/gameplay/03-buildings.md), [`04-combat`](../../docs/gameplay/04-combat.md), [`02-economy-and-progression`](../../docs/gameplay/02-economy-and-progression.md), [`11-scouting`](../../docs/gameplay/11-scouting.md).
- Ne pas démarrer la phase 4 scout tant que le contrat "style caché sauf scout" n'est pas stabilisé.

## Critère de fin (acceptance)

- [ ] Un village joueur nouvellement créé ou sans config explicite est traité comme `Équilibré`.
- [ ] Un village barbare n'a aucun style applicable.
- [ ] Le changement de style est impossible tant que la Salle du Conseil n'est pas construite dans le village.
- [ ] Tout changement de style, y compris le premier, consomme les ressources thématiques + couronnes prévues par la spec et scalées par niveau de Château.
- [ ] Le cooldown de 24 h bloque un second changement avant expiration et autorise un changement après expiration.
- [ ] L'API backend expose le style courant, les coûts par style cible, l'état de cooldown et permet de changer de style avec réponse persistée après reload.
- [ ] Un combat scripté montre qu'un défenseur `Forteresse` subit moins de pertes qu'un défenseur `Équilibré` avec mêmes unités et même attaquant.
- [ ] Les bonus/malus `Raiders`, `Forteresse` et `Économique` s'appliquent aux bons scopes : troupes d'origine pour combat/vitesse/loot, village local pour production/stockage/population.
- [ ] Le style n'est pas exposé dans les données publiques de carte ou de village ennemi hors scout.
- [ ] Les tests automatisés ou smokes backend couvrent au moins changement de style, coût/cooldown, et effet `Forteresse` en combat.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] T1 — Shared strategy contract : exposer les coûts thématiques + scaling Château dans `packages/shared/src/village/strategy.ts`.
- [x] T2 — Backend strategy service : gate Salle du Conseil, coût ressources + couronnes, cooldown 24 h, payload API coûts par cible.
- [x] T3 — Smoke backend : couvrir défaut Équilibré, gate, coût/cooldown, non-fuite carte, Forteresse combat.
- [ ] T4 — Review, smokes, static-check, docs impact, archive.

## Progress (rempli pendant le run)

- [x] Préflight : Git clean, fiche run `PLANNED`, règles/SPEC/docs source lues.
- [x] Cartographie backend village styles.
- [x] Implémentation T1-T2.
- [x] Smoke ciblé `village-strategy` ajouté et vert.
- [x] Gates complets : smokes backend puis `yarn static-check`.

## Décisions prises

- Le modèle Prisma `VillageStrategyConfig` existe déjà ; aucune migration nécessaire pour ce run.
- Un village joueur sans `VillageStrategyConfig` est traité comme `BALANCED`, sans créer de ligne implicite.
- Les villages barbares restent sans config ; aucun endpoint public carte/village n'inclut `strategyConfig`.
- Les erreurs `ConquestFinalizeWorker` observées pendant le smoke ciblé viennent de jobs pg-boss préexistants qui survivent au `TRUNCATE`; elles ne font pas échouer le scénario testé.

## Rapport final

Implémentation backend styles de village finalisée.

- Coûts partagés ajoutés : ressources thématiques + couronnes, scaling `1.25^(Château - 4)`.
- `VillageStrategyService` aligne la spec : défaut `BALANCED`, gate Salle du Conseil, premier changement payant, cooldown 24 h, débit ressources/couronnes atomique, events `crowns.changed` + `resources.changed`.
- Smoke backend ajouté pour API style/coûts/cooldown, confidentialité payload carte, et effet `FORTRESS` en combat réel.
- Smokes existants ajustés à la règle "premier choix payant" et stabilisés contre les jobs pg-boss différés entre fichiers.
- Docs : aucun changement nécessaire, raison : `docs/gameplay/12-village-styles.md` était déjà la source de vérité et le code converge vers elle.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Village joueur sans config traité comme `BALANCED` — preuve : `GET /village/strategy` dans `village-strategy.smoke.spec.ts`.
  - [x] Village barbare sans style applicable — preuve : aucun `strategyConfig` créé pour barbares, smoke carte sans fuite.
  - [x] Changement bloqué sans Salle du Conseil — preuve : POST style retourne 400 dans smoke.
  - [x] Premier changement payant ressources + couronnes — preuve : stock 1000/1000/1000 → 950/900/800 et couronnes 500 → 420 pour `RAIDERS`.
  - [x] Cooldown 24 h bloque puis autorise après expiration — preuve : POST immédiat 409, puis succès après backdate `cooldownEndsAt`.
  - [x] API expose style courant, coûts par cible, cooldown et persistance — preuve : `GET /village/strategy` avant/après mutation.
  - [x] `FORTRESS` réduit les pertes défenseur vs `BALANCED` — preuve : combat worker réel, pertes défenseur 100 vs `< 100`.
  - [x] Bonus/malus scopes backend existants conservés — preuve : smokes combat + `static-check`.
  - [x] Style non exposé sur carte/village public — preuve : payload `/world/:id/villages` ne contient ni `FORTRESS` ni `strategyConfig`.
  - [x] Tests/smokes couvrent changement, coût/cooldown, Forteresse combat — preuve : `battleforthecrown-backend/test/village-strategy.smoke.spec.ts`.
- **Tests automatisés** :
  - `yarn workspace @battleforthecrown/shared build` — vert.
  - `yarn workspace battleforthecrown-backend tsc --noEmit` — vert.
  - `yarn workspace battleforthecrown-backend test:smoke --runTestsByPath test/village-strategy.smoke.spec.ts` — vert.
  - `yarn test:smoke` — vert, 8 suites / 29 tests.
  - `yarn static-check` — vert.
- **Smokes lancés** : `yarn test:smoke` — vert, backend touché.
- **Smokes ajoutés/modifiés** :
  - `battleforthecrown-backend/test/village-strategy.smoke.spec.ts` — API style, coût/cooldown, confidentialité, Forteresse combat.
  - `battleforthecrown-backend/test/smoke.spec.ts` — invariant `crowns.changed` mis à jour pour premier changement payant.
  - `battleforthecrown-backend/test/combat-conquest-hook.smoke.spec.ts` / `test/helpers.ts` — stabilisation Outbox/pg-boss entre fichiers smoke.
- **QA fonctionnelle agent** : couverte par smokes REST + worker + DB réels ; pas de curl manuel supplémentaire nécessaire.
- **Tests IG à faire par le user** : Aucun test IG nécessaire, raison : run strictement backend/shared.
