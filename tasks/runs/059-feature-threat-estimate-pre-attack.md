# Run #059 — feature-threat-estimate-pre-attack

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Phase 4 — Scouting (aide MVP léger : menace estimée avant attaque, déclarée mais non livrée par les runs 016/017 ; successeur direct annoncé par le run 055).
- **Spec source** : [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md) §§ « Menace estimée avant attaque (MVP léger) » (lignes 82-118).
- **Type** : `feature`
- **Modules backend** : **aucun**. Décision tranchée : pas d'endpoint, pas de second code path. Le label est dérivé exclusivement côté shared (formule pure) à partir de données déjà exposées au front (carnet d'intel + puissance bâtiments publique). Évite la divergence entre serveur et UI, supprime un hop réseau, et conserve la politique « ne pas révéler ce que le joueur n'a pas obtenu » (le serveur n'enverrait rien que le front ne sache déjà calculer).
- **Modules frontend** : `features/combat/AttackDetailModal.tsx` (section nouvelle « Menace estimée »), nouveau viewmodel `threatEstimateView.ts`, branchement query `useVillageIntelQuery` (issu du run 055) + `usePowerQuery` (déjà existant pour la puissance bâtiments publique).
- **Modules shared** : nouveau `packages/shared/src/threat/` (constants `THREAT_LEVELS`, `INTEL_FRESHNESS_THRESHOLDS_MS`, formule pure `computeThreatLabel`).

## Dépendances

- **Bloquant** : run [`055-feature-intel-notebook`](055-feature-intel-notebook.md) — statut actuel `PLANNED` ; **doit être `DONE` avant le démarrage de ce run** (la formule consomme `VillageIntelDto.units/resources/wallLevel/seenAt` produit par le carnet d'intel). Ne pas démarrer 059 tant que 055 n'est pas archivé.
- **Recommandé avant** : run [`058-feature-pvp-power-third-attack-guard`](058-feature-pvp-power-third-attack-guard.md) (PR #87 ouverte) car le badge menace doit gracefully coexister avec le chemin CTA grisée « Puissance trop faible — protection serveur ». Pas un bloqueur fonctionnel, mais coordination nécessaire si exécutés rapprochés (ordre d'affichage badge menace vs message guard).
- Phase 4 Scouting livrée : runs [`016`](archive/016-feature-scouting-backend-shared.md) + [`017`](archive/017-feature-scouting-frontend-inbox.md) — `ScoutReport` + UI inbox déjà en place.

## Critère de fin (acceptance)

- [ ] `[unit]` Helper `computeThreatLabel({ intel, publicBuildingPower, armyAttackPower, intelAgeMs, isBarbarian, targetTier })` testé sur 12+ scénarios : `Inconnue` (intel `null` joueur), `Faible` (puissance dominante + intel récente), `Moyenne` (équilibre), `Élevée` (cible nettement supérieure), `Inconnue` (intel trop ancienne au-delà de `STALE_THRESHOLD_MS`), barbare T1 / T5 avec intel récente.
- [ ] `[unit]` Helper `formatIntelFreshness(intelAgeMs)` retourne `fresh` (< 1h), `recent` (< 24h), `stale` (< 7j), `outdated` (≥ 7j) ; le seuil `STALE_THRESHOLD_MS` est exporté et documenté dans la spec backprop.
- [ ] `[unit]` Helper refuse de révéler la composition cachée : si `intel.units` est `null` pour un village joueur (jamais scouté), la formule retourne `Inconnue` même si `armyAttackPower` est très supérieur à `publicBuildingPower`.
- [ ] `[grep]` Aucune occurrence de `getKingdomPowerValue` (puissance armée totale) ni de `armyPower` côté formule menace — la formule ne lit que `publicBuildingPower` + `intel` (pas de fuite serveur).
- [ ] `[visuel/gameplay]` `AttackDetailModal` affiche en mode `attack` une section `Menace estimée` avec le badge couleur (`Inconnue` / `Faible` / `Moyenne` / `Élevée`), un libellé court, et une mention `Estimation basée sur scout du JJ/MM` si la formule a utilisé un `VillageIntel.seenAt`.
- [ ] `[visuel/gameplay]` Cible barbare avec tier visible ⇒ jamais `Inconnue` (la lisibilité publique des barbares — sprite, label, tier dans `06-barbarians.md` — suffit pour estimer).
- [ ] `[visuel/gameplay]` Cible joueur sans intel ⇒ badge `Inconnue` + tooltip `Envoyer un ESPION pour estimer la menace`.
- [ ] `[visuel/gameplay]` Cible joueur avec intel `seenAt` > `STALE_THRESHOLD_MS` (default ~7j) ⇒ badge `Inconnue` + tooltip `Intel trop ancienne, envoie un nouveau scout`.
- [ ] `[grep]` La formule n'expose **jamais** un pourcentage, une probabilité, ou un libellé garantissant la victoire (`Certaine`, `Garantie`, `100%`). Test snapshot sur la table des libellés autorisés.
- [ ] `[visuel/gameplay]` Mode `scout` du `AttackDetailModal` n'affiche **pas** le badge menace (la menace concerne l'attaque, pas la mission scout).
- [ ] Frontend respecte le contrat : pas d'appel REST supplémentaire si l'intel est déjà en cache TanStack Query (le badge se met à jour en push via WS `intel.updated` du run 055).
- [ ] Doc impact : §§ Spec 11-scouting concrétisée — `seenAt`, `STALE_THRESHOLD_MS` documentés ; ADR léger si seuils non triviaux retenus (rajouter dans `docs/architecture/decisions.md` § estimation et fraîcheur d'intel).

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Pré-rempli par `bftc-plan` ; le lead peut affiner à l'étape 3.)_

- **T1** — Cadrage technique (formule shared pure tranchée, pas de second code path) : confirmer la signature de `computeThreatLabel` (paramètres, types, valeur retour), valider le seuil `STALE_THRESHOLD_MS` (default 7j) et la grille `INTEL_FRESHNESS_THRESHOLDS_MS`, lister explicitement les sources autorisées par la spec (puissance bâtiments publique + intel datée + composition d'armée + type de cible + distance comme tooltip secondaire). Pas de décision archi entre 2+ pistes — la formule reste pure et locale au front (cf. § Cible).
- **T2** — `packages/shared/src/threat/` : `constants.ts` (`THREAT_LEVELS`, `INTEL_FRESHNESS_THRESHOLDS_MS`, `STALE_THRESHOLD_MS`), `formula.ts` (`computeThreatLabel`, `formatIntelFreshness`), `types.ts` (`ThreatLabel`, `ThreatEstimateInput`), barrel `index.ts` + tests `formula.spec.ts`.
- **T3** — Frontend viewmodel `features/combat/threatEstimateView.ts` : adapter `VillageIntelDto + MapEntity (publicBuildingPower) + armyComposition → ThreatEstimateInput`, gérer la dérivation `intelAgeMs = now - seenAt`, mapper sortie vers libellés UI (badge couleur + tooltip + mention fraîcheur). Tests Vitest `threatEstimateView.test.ts`.
- **T4** — Intégration `AttackDetailModal.tsx` : nouvelle section `Menace estimée` en mode `attack` (ordre : sous la sélection d'unités, au-dessus du résumé `Puissance estimée`), conditionnelle au mode `attack` uniquement, en lecture `useVillageIntelQuery(target.refId)` (run 055) + `target.kingdomPowerSnapshot.buildings` (déjà exposé via `WorldEntityDto`).
- **T5** — Tests UI : extension `AttackDetailModal.test.tsx` couvrant : cible barbare (badge présent même sans scout), cible joueur sans intel (`Inconnue` + tooltip CTA scout), cible joueur intel récente (libellé + `Estimation basée sur scout du JJ/MM`), mode `scout` (badge absent).
- **T6** — Docs : mise à jour [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md) § Questions ouvertes — trancher le seuil `Inconnue / fraîcheur` (questions ouvertes lignes 167-173). Mention dans [`docs/architecture/decisions.md`](../../docs/architecture/decisions.md) si seuils non triviaux. Pas de modification de `data-model.md` (pas de table nouvelle).

Chaque tâche reste ≤ 5 fichiers.

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** : à remplir à l'étape 10.
- **Review indépendante** : `Déclenchée (raison : (d) invariant durable — formule UX-gameplay qui dicte la lecture du risque pré-attaque + politique de non-révélation d'info ; ne pas casser le contrat « ne pas révéler ce que le joueur n'a pas obtenu »). Diff probablement < 100 lignes (formule pure + 1 modal), pas de couplage back+front (T1 valide la formule shared pure), pas de modif SPEC.md durable.`
- **Tests automatisés** : unit `packages/shared/src/threat/formula.spec.ts`, vitest `threatEstimateView.test.ts`, extension `AttackDetailModal.test.tsx`.
- **Smokes ajoutés/modifiés** : `Aucun`. La décision archi (formule shared pure, pas de second code path) supprime tout chemin serveur — donc pas de smoke backend pertinent. Couverture intégrale par unit shared + vitest UI.
- **QA fonctionnelle agent** : `yarn test:pixi` (vitest) + `yarn test:shared` ; pas de `curl` requis (pas d'endpoint backend ajouté).
- **Tests IG à faire par le user** : checklist mobile ≤ 5 items — ouvrir attack modal sur barbare T1 (badge `Faible`/`Moyenne`), sur barbare T5 (badge `Élevée`), sur joueur jamais scouté (`Inconnue` + tooltip CTA scout), sur joueur scouté récemment (label + mention `Estimation basée sur scout du …`), bascule mode `scout` (badge absent).

## Points d'attention (notes du plan)

- **Pas de fuite serveur** : la formule ne consomme **jamais** la puissance armée totale du défenseur ni son contenu d'inventaire en clair, sauf si déjà révélé par un `VillageIntel.units`. Le guard est codé dans la formule **et** dans les tests `grep`.
- **Cohabitation avec le guard puissance ÷ 3 (run 058)** : si `[attaque interdite par puissance ÷ 3]`, le badge menace reste affiché (information utile pour le joueur) mais le CTA reste grisé avec son message dédié. Pas de superposition.
- **Cohabitation avec le bouclier débutant (run 056 — mergé)** : idem ; le badge menace s'affiche, le CTA reste grisé avec son message bouclier.
- **Intel barbare** : pour les barbares, on utilise `tier` (visible publiquement, cf. [`06-barbarians.md` § Lisibilité](../../docs/gameplay/06-barbarians.md)) comme proxy de défense estimée, **pas** un scout obligatoire. Donc jamais `Inconnue` côté barbare.
- **Choix du seuil `STALE_THRESHOLD_MS`** : default proposé 7j (≈ 168h). À trancher en refinement. Le seuil doit être exposé dans `WorldConfig.tempo` si non-trivial (à valider T1).
- **Composition d'armée** : la formule peut utiliser `armyAttackPower` (calculable côté front à partir de `UNIT_STATS` + sliders user) pour affiner — un même village peut basculer de `Élevée` à `Moyenne` selon l'armée envoyée. Ce n'est pas un simulateur exact mais une lecture relative.
- **Distance / temps de trajet** : la spec autorise ce signal comme « risque logistique » mais **pas** comme malus caché. Si retenu en T1, exposer comme tooltip secondaire (`Trajet long — la cible peut se réarmer`), pas comme modulation cachée du label.
- **Hors scope explicite** : pas de simulateur exact, pas de pourcentage de victoire, pas de recommandation auto d'armée, pas d'estimation pour sites d'exploitation (lab/post-MVP), pas de modèle de risque social/tribu, pas de prise en compte des renforts amis défensifs (spec `20-defensive-friends.md` post-MVP-candidate).
- **Ticket spec** : trancher en T6 si l'on lève la question ouverte « fraîcheur intel » de la spec (lignes 167-173) ou si on l'expose explicitement dans la doc comme `STALE_THRESHOLD_MS`.

## Liens

- **Avant** : [`055-feature-intel-notebook`](055-feature-intel-notebook.md) (PLANNED) — bloquant ; le carnet d'intel fournit `VillageIntelDto.seenAt/units/wallLevel`. La formule **ne peut pas être livrée avant** car elle dépend explicitement de cette source.
- **Connexes** :
  - [`058-feature-pvp-power-third-attack-guard`](058-feature-pvp-power-third-attack-guard.md) (PR #87) — coordination UI sur le panneau d'attaque ; badge menace + message guard doivent coexister proprement.
  - [`056-feature-pvp-newbie-shield-48h`](056-feature-pvp-newbie-shield-48h.md) (PR #84 mergée) — idem cohabitation UI bouclier débutant.
  - [`016-feature-scouting-backend-shared`](archive/016-feature-scouting-backend-shared.md), [`017-feature-scouting-frontend-inbox`](archive/017-feature-scouting-frontend-inbox.md) — Phase 4 livrée, producer `ScoutReport`.
  - [`047-feature-capture-reports`](archive/047-feature-capture-reports.md) — `CombatReport` source d'intel passive utilisée en aval du carnet d'intel.
- **Après** : Aucun successeur MVP — la menace estimée ferme l'aide MVP léger de la Phase 4. Évolutions post-MVP (simulateur, recommandation auto) explicitement hors scope.
