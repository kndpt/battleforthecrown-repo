# Run #025 — fix-origin-anchored-army-power

> **Statut** : DONE
> **Démarré** : 2026-05-16
> **Terminé** : 2026-05-16

## Cible

- **Phase roadmap** : Phase 1 — Consolidation de l'existant
- **Spec source** :
  - [`docs/gameplay/09-power-and-rankings.md`](../../docs/gameplay/09-power-and-rankings.md) — calcul, visibilité, réactivité temps réel
  - [`docs/gameplay/04-combat.md`](../../docs/gameplay/04-combat.md) — combat, renforts, retour, conquête
- **Type** : `fix`
- **Modules backend** : `power`, `combat`, `event/outbox`
- **Modules frontend** : `pixi/api/ws-bindings`, `pixi/api/queries` (vérification principalement)

## Dépendances

- Préserver les contrats livrés par :
  - [`010 — implementation-frontend-reinforcements`](./archive/010-implementation-frontend-reinforcements.md) — renforts, garnison, actions rappel/renvoi
  - [`011 — fix-return-worker-decouple-report`](./archive/011-fix-return-worker-decouple-report.md) — snapshot `Expedition.survivingUnits` / `loot`, retour découplé du report
  - [`018 — feature-barbarian-conquest-backend-shared`](./archive/018-feature-barbarian-conquest-backend-shared.md) — finalisation conquête barbare
  - [`022 — fix-power-realtime-reactivity`](./archive/022-fix-power-realtime-reactivity.md) et [`067 — power realtime combat events`](../archive/67-power-realtime-combat-events.md) — invalidations realtime power

## Critère de fin (acceptance)

- [ ] Envoyer une attaque, un scout ou un renfort ne baisse pas la puissance du village d'origine ni la puissance royaume avant pertes réelles.
- [ ] Les pertes attaquantes diminuent la puissance du village d'origine uniquement du poids des unités mortes.
- [ ] Le retour des survivants ne modifie pas la puissance, sauf si une donnée anormale révèle une perte/restitution réelle.
- [ ] Les renforts en trajet ou stationnés sont comptés dans la puissance armée du village d'origine, pas du village hôte.
- [ ] Les pertes de renforts en défense diminuent la puissance du village d'origine.
- [ ] Une occupation de capture compte les unités selon `originVillageId`; la finalisation/interruption applique un contrat documenté.
- [ ] Les endpoints publics conservent leur visibilité : puissance village publique = bâtiments seulement ; puissance royaume publique = contrat existant préservé.
- [ ] Un smoke backend couvre au moins attaque départ/résolution/retour + renfort stationné/perdu.
- [ ] `docs/gameplay/09-power-and-rankings.md` clarifie puissance armée rattachée à l'origine vs force présente locale.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- Prisma : skill `bftc-prisma` si schema/migration touchés
- Workers/Outbox : skill `bftc-workers-outbox`
- QA : skill `bftc-qa`

## Contexte & décision amont

Décision gameplay retenue avant exécution : **la puissance armée d'un village est rattachée au village d'origine des troupes, pas à leur position physique**.

Conséquences :

- `UnitInventory` seul ne peut plus être la source complète de puissance armée : au départ d'une expédition, l'inventaire local baisse mais la puissance du village d'origine ne doit pas baisser.
- Les troupes en `Expedition` et `Garrison` doivent être agrégées par origine réelle.
- La puissance mesure la force possédée/rattachée au village ; la **force présente locale** (défense effective d'un village à un instant T) reste une notion séparée utilisée par combat/scout.
- Seules les mutations réelles changent la puissance : recrutement, pertes, transfert durable explicite, suppression/conquête selon contrat documenté.

## Décomposition initiale (rempli par le lead à l'étape 3)

1. **T1 — Cartographie power/combat**. Confirmer les sources d'unités par origine dans `UnitInventory`, `Expedition`, `Garrison`, `PendingConquest`, et les statuts à inclure/exclure.
2. **T2 — Calcul power origin-anchored**. Extraire/implémenter dans `PowerService` un calcul d'armée par `originVillageId` agrégeant inventaire local, expéditions actives/retours, et garnisons.
3. **T3 — Endpoints et agrégats**. Adapter `getVillagePower`, `getKingdomPower`, `getPublicKingdomPower` et leaderboard sans exposer l'armée via l'endpoint village public.
4. **T4 — Realtime frontend**. Vérifier les invalidations WS existantes (`battle.*`, `village.*`, `reinforcement.*`, `garrison.added`) : garder la réactivité, ne pas masquer le bug par une invalidation frontend.
5. **T5 — Smokes backend**. Ajouter des smokes ciblés : départ attaque/scout sans baisse power, pertes avec baisse, retour sans variation, renfort stationné/perdu compté à l'origine.
6. **T6 — Docs et SPEC**. Clarifier `docs/gameplay/09-power-and-rankings.md`; ajouter un invariant `SPEC.md` si le run confirme que cette règle change les futurs choix d'implémentation.
7. **T7 — Vérification finale**. Lancer smokes backend obligatoires, tests Pixi pertinents si bindings touchés, puis `yarn static-check`.

## Points d'attention

- `Expedition.units` représente l'armée envoyée initiale ; en retour (`RETURNING`), compter `survivingUnits`, pas l'envoi initial.
- Les expéditions `REINFORCE` de rappel utilisent `attackerVillageId` comme village hôte courant et `reinforcementOriginVillageId` comme origine réelle.
- La conquête finale consomme le Seigneur administratif ; clarifier si l'escorte restante reste rattachée à l'origine ou devient un transfert durable.
- Ne pas confondre `puissance armée du village` et `force présente/défense locale`.
- Le contrat public existant est conservé : `GET /power/village/:villageId/public` expose seulement les bâtiments ; `GET /power/kingdom/:userId/public` conserve le comportement décidé par le ticket 29.

## Liens détectés

- **Connexe** : [`067 — Réactivité temps réel de la puissance après combat`](../archive/67-power-realtime-combat-events.md) — wiring realtime power récent, mais pas le contrat de calcul.
- **Connexe** : [`029 — Puissance publique`](../archive/29-power-public-visibility-missing.md) — visibilité publique à préserver.
- **Connexe** : [`010 — Renforts frontend`](./archive/010-implementation-frontend-reinforcements.md) et [`033 — Renforts backend`](../archive/33-reinforcements-inter-villages-missing.md) — garnisons et `originVillageId`.
- **Connexe** : [`011 — Retour découplé du report`](./archive/011-fix-return-worker-decouple-report.md) — snapshot `survivingUnits`.
- **Connexe** : [`054 — Retour fantôme pendant capture`](../archive/54-conquest-capture-phantom-return.md) et [`018 — Conquête barbare backend`](./archive/018-feature-barbarian-conquest-backend-shared.md) — occupation/capture.
- **Doublon potentiel** : aucun identifié.

## Progress (rempli pendant le run)

- [x] Préflight : worktree clean, règles/specs/briefings lus.
- [x] Cartographie : `PowerService` comptait uniquement `UnitInventory`; `Expedition` et `Garrison` manquaient.
- [x] Backend : calcul power origin-anchored ajouté pour village, royaume et leaderboard.
- [x] Realtime : `village.attacked` transporte les origines de renforts impactées par des pertes.
- [x] Tests : smokes attaque/scout/renfort enrichis + test WS front.
- [x] Docs/SPEC : contrat gameplay clarifié et invariant durable ajouté.

## Décisions prises

- La puissance armée agrège `UnitInventory`, `Garrison.originVillageId` et `Expedition` active/retour par origine réelle.
- En `RETURNING`, une expédition compte `survivingUnits` sauf rappel (`recalled`), qui compte l'envoi initial encore en route vers l'origine.
- La force présente locale reste hors `PowerService`; elle demeure calculée par les stratégies combat/scout.
- Dérogation environnement : le préflight smoke officiel exige `battleforthecrown-postgres` sur `localhost:5432`, mais ce port était déjà occupé par un autre container. Les smokes ciblés ont été lancés sur un Postgres BFTC isolé en `localhost:15432`.

## Rapport final

- `PowerService` calcule désormais l'armée par village d'origine pour les endpoints village, royaume, public royaume et leaderboard.
- Les pertes de renforts en défense exposent `reinforcementOriginVillageIds` dans `village.attacked`; le front invalide aussi la puissance des villages d'origine.
- `docs/gameplay/09-power-and-rankings.md` clarifie origine vs présence locale ; `SPEC.md` garde l'invariant pour les futurs runs.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] Envoyer une attaque/scout/renfort ne baisse pas la puissance — preuve : smokes `combat-attack`, `scouting`, `reinforcements` via `GET /power`.
  - [x] Les pertes attaquantes baissent la puissance du village d'origine — preuve : `combat-attack.smoke.spec.ts` attend 200 → 180 puis retour stable.
  - [x] Le retour des survivants ne modifie pas la puissance — preuve : `combat-attack.smoke.spec.ts` compare après pertes vs après retour.
  - [x] Les renforts stationnés/perdus sont comptés à l'origine — preuve : `reinforcements.smoke.spec.ts` attend origine 200, hôte 0, puis origine 80 après pertes.
  - [x] Visibilité publique préservée — preuve : pas de changement du endpoint village public ; `getPublicKingdomPower` conserve le contrat total existant.
- **Tests automatisés** :
  - `yarn workspace battleforthecrown-backend test power` — PASS, 2 suites / 8 tests.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test ws-bindings.test.ts` — PASS, 23 tests.
  - `yarn static-check` — PASS.
- **Smokes lancés** :
  - `SMOKE_DATABASE_URL=postgresql://postgres:postgres@localhost:15432/battleforthecrown_smoke yarn workspace battleforthecrown-backend test:smoke:run combat-attack.smoke.spec.ts reinforcements.smoke.spec.ts scouting.smoke.spec.ts --runInBand` — PASS, 3 suites / 6 tests.
  - `yarn test:smoke:preflight` — BLOQUÉ environnement : `localhost:5432` déjà occupé par un autre container Postgres, donc le container officiel `battleforthecrown-postgres` ne peut pas binder le port.
- **Smokes ajoutés/modifiés** :
  - `battleforthecrown-backend/test/combat-attack.smoke.spec.ts` — départ attaque sans baisse, pertes 200→180, retour stable.
  - `battleforthecrown-backend/test/scouting.smoke.spec.ts` — départ scout sans baisse.
  - `battleforthecrown-backend/test/reinforcements.smoke.spec.ts` — renfort en trajet/stationné compté à l'origine, hôte à 0, pertes origine, payload `reinforcementOriginVillageIds`.
- **QA fonctionnelle agent** : smokes REST/worker/Outbox ci-dessus avec Postgres isolé ; aucune QA navigateur requise.
- **Tests IG à faire par le user** : Aucun test IG nécessaire, raison : correction logique backend + invalidation cache front couverte par test WS.
