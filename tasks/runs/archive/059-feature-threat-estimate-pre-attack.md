# Run #059 — feature-threat-estimate-pre-attack

> **Statut** : DONE
> **Démarré** : 2026-06-22
> **Terminé** : 2026-06-22

## Cible

- **Phase roadmap** : Phase 4 — Scouting (aide MVP léger : menace estimée avant attaque, déclarée mais non livrée par les runs 016/017 ; successeur direct annoncé par le run 055).
- **Spec source** : [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md) §§ « Menace estimée avant attaque (MVP léger) » (lignes 82-118).
- **Type** : `feature`
- **Modules backend** : **aucun**. Décision tranchée : pas d'endpoint, pas de second code path. Le label est dérivé exclusivement côté shared (formule pure) à partir de données déjà exposées au front (carnet d'intel + puissance bâtiments publique). Évite la divergence entre serveur et UI, supprime un hop réseau, et conserve la politique « ne pas révéler ce que le joueur n'a pas obtenu » (le serveur n'enverrait rien que le front ne sache déjà calculer).
- **Modules frontend** : `features/combat/AttackDetailModal.tsx` (section nouvelle « Menace estimée »), nouveau viewmodel `threatEstimateView.ts`, branchement query `useVillageIntelQuery` (issu du run 055) + `usePublicVillagePowerQuery(target.refId)` (endpoint déjà existant `GET /power/village/:id/public`, expose `PublicVillagePowerDto.buildings`). **Source canonique unique** pour la puissance bâtiments publique : `usePublicVillagePowerQuery(...).data.buildings`. Pas de second chemin via `MapEntity` ou autre snapshot — le viewmodel et le modal consomment la même query.
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
- [ ] `[vitest]` Smoke d'intégration `threatEstimate-cache.test.tsx` : monte le `AttackDetailModal` avec une `VillageIntel` déjà en cache TanStack Query, émet un event WS `intel.updated` (fourni par run 055), vérifie que (a) le badge menace se recalcule, (b) **aucun fetch REST** n'est déclenché sur `/worlds/:worldId/intel/:villageId` (mock `apiClient.get` avec compteur d'appels = 0). Le test acte le contrat « pas d'appel REST supplémentaire si l'intel est déjà en cache ».
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
- **T3** — Frontend viewmodel `features/combat/threatEstimateView.ts` : adapter `VillageIntelDto + PublicVillagePowerDto.buildings + armyComposition → ThreatEstimateInput`, gérer la dérivation `intelAgeMs = now - seenAt`, mapper sortie vers libellés UI (badge couleur + tooltip + mention fraîcheur). Tests Vitest `threatEstimateView.test.ts`.
- **T4** — Intégration `AttackDetailModal.tsx` : nouvelle section `Menace estimée` en mode `attack` (ordre : sous la sélection d'unités, au-dessus du résumé `Puissance estimée`), conditionnelle au mode `attack` uniquement, en lecture `useVillageIntelQuery(target.refId)` (run 055) + `usePublicVillagePowerQuery(target.refId)`. **Source canonique identique à T3** — pas de re-lecture d'un autre champ pour éviter la divergence (cf. § Cible).
- **T5** — Tests UI : extension `AttackDetailModal.test.tsx` couvrant : cible barbare (badge présent même sans scout), cible joueur sans intel (`Inconnue` + tooltip CTA scout), cible joueur intel récente (libellé + `Estimation basée sur scout du JJ/MM`), mode `scout` (badge absent). **Nouveau** : `threatEstimate-cache.test.tsx` (cf. critère d'acceptance vitest) couvrant le contrat WS `intel.updated` → recompute badge sans fetch REST.
- **T6** — Docs : mise à jour [`docs/gameplay/11-scouting.md`](../../docs/gameplay/11-scouting.md) § Questions ouvertes — trancher le seuil `Inconnue / fraîcheur` (questions ouvertes lignes 167-173). Mention dans [`docs/architecture/decisions.md`](../../docs/architecture/decisions.md) si seuils non triviaux. Pas de modification de `data-model.md` (pas de table nouvelle).

Chaque tâche reste ≤ 5 fichiers.

## Progress (rempli pendant le run)

_(git history)_

## Décisions prises

_(git history — clés : STALE_THRESHOLD_MS 7j en constante shared hors `WorldConfig` ; gate `Inconnue` avant calcul = invariant non-révélation ; fix `WorldTier 'T1'..'T5'` string→number, sinon barbares toujours `Élevée` ; reformulation acceptance cache = contrat `invalidateQueries` run 055, pas push-payload.)_

## Rapport final

Menace estimée avant attaque livrée 100% côté client : module shared pur `threat/` (`computeThreatLabel`/`formatIntelFreshness`) + viewmodel `threatEstimateView` + section badge dans `AttackDetailModal` (mode attack only). Aucun backend (formule dérive puissance bâtiments publique + carnet d'intel daté). Invariant non-révélation garanti par gate `Inconnue` avant tout calcul. Aucun ticket ouvert.

### Acceptance & QA

- **Critères d'acceptance vérifiés** :
  - [x] `[unit]` `computeThreatLabel` 12+ scénarios (Inconnue/Faible/Moyenne/Élevée, stale, barbare T1/T5) — `yarn workspace battleforthecrown-pixi test -- threat` → 38/38 vert (dont `formula.spec.ts` 26 tests).
  - [x] `[unit]` `formatIntelFreshness` fresh/recent/stale/outdated + `STALE_THRESHOLD_MS` exporté — `formula.spec.ts:262-296` vert.
  - [x] `[unit]` Non-révélation : `intel===null` ⇒ `Inconnue` même si `armyAttackPower ≫ publicBuildingPower` — `formula.spec.ts:105` vert.
  - [x] `[grep]` Aucune fuite serveur (`getKingdomPowerValue`/`armyPower`) dans la formule — `rg "getKingdomPowerValue|armyPower" packages/shared/src/threat/ …/threatEstimateView.ts` → rc=1 (0 résultat).
  - [x] `[grep]` Aucun %/`Certaine`/`Garantie`/`100` dans les libellés — `rg` prod 0 résultat ; assertion `formula.spec.ts:306`.
  - [x] `[visuel/gameplay]` Barbare ⇒ jamais `Inconnue` (proxy tier) — `formula.spec.ts:63-98` + `threatEstimateView.test.ts:36-82`.
  - [x] `[visuel/gameplay]` Joueur sans intel ⇒ `Inconnue` + tooltip ESPION — `threatEstimateView.test.ts:88`, `threatEstimate-cache.test.tsx` (intel=null).
  - [x] `[visuel/gameplay]` Joueur intel ≥7j ⇒ `Inconnue` + tooltip « Intel trop ancienne » — `threatEstimateView.test.ts:108-134`.
  - [x] `[visuel/gameplay]` Mode `scout` ⇒ badge ABSENT — `threatEstimate-cache.test.tsx` (test ajouté post-review, `queryByText('Menace estimée')` not in document).
  - [x] `[vitest]` Cache : (A) intel fraîche en cache ⇒ 0 fetch intel au montage ; (B) `intel.updated` ⇒ 1 refetch canonique + badge recalculé — `threatEstimate-cache.test.tsx` vert (cf. reformulation contrat ci-dessus).
  - [x] `[visuel/gameplay]` Section « Menace estimée » (badge couleur + libellé + mention scout) rendue en mode attack — code `AttackDetailModal.tsx:398-427` ; rendu humain = checklist IG ci-dessous.
  - [x] Doc impact : `11-scouting.md` (question fraîcheur tranchée) + `decisions.md` ADR-20.
- **Review indépendante** : `Déclenchée (raison : (d) invariant durable — non-révélation d'info pré-attaque)`. Verdict initial `BLOCK` (1 majeur : critère « scout ⇒ badge absent » non testé) → test d'absence ajouté → re-vérif `GO`. Mineurs (type `ThreatIntel.units | null` défensif ; fallback barbare `?? 1`) acceptés tels quels.
- **Tests automatisés** : `yarn workspace battleforthecrown-pixi test -- threat` → 38/38 ; suite combat complète `… test -- src/features/combat` → 76/76 ; `yarn static-check` vert.
- **Smokes lancés** : `Aucun` — diff backend `src/` = néant (décision : formule shared pure, zéro chemin serveur). Exception documentée, aucun smoke pertinent.
- **Smokes ajoutés/modifiés** : `Aucun`.
- **QA fonctionnelle agent** : tests vitest + unit shared (via runner pixi) + static-check. Pas de `curl`/SQL (aucun endpoint ni table ajoutés).
- **Tests IG à faire par le user** : checklist mobile ≤5 items —
  1. Attack modal sur barbare T1 ⇒ badge `Faible`/`Moyenne`.
  2. Attack modal sur barbare T5 ⇒ badge `Élevée`.
  3. Joueur jamais scouté ⇒ badge `Inconnue` + tooltip « Envoyer un ESPION… ».
  4. Joueur scouté récemment ⇒ label coloré + mention « Estimation basée sur scout du JJ/MM ».
  5. Bascule mode `scout` ⇒ section menace absente.

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
