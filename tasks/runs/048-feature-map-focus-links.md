# Run #048 — feature-map-focus-links

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — primitive UX transverse pour les features qui doivent ouvrir la carte monde sur une position précise.
- **Spec source** : [`docs/gameplay/17-inbox-and-reports.md`](../../docs/gameplay/17-inbox-and-reports.md), [`docs/gameplay/22-village-roles-and-navigation.md`](../../docs/gameplay/22-village-roles-and-navigation.md), doc technique à créer dans `docs/architecture/`.
- **Type** : feature
- **Modules backend** : —
- **Modules frontend** : `pixi/stores/worldMap`, `pixi/features/world`, `pixi/features/combat`, `pixi/routes/game`

## Dépendances

- Aucune dépendance bloquante.
- Le run doit généraliser le `pendingFocus` livré par [`024-feature-conquest-victory-modal`](./archive/024-feature-conquest-victory-modal.md), pas créer un second mécanisme concurrent.
- Le run doit préserver la source de vérité caméra livrée par [`tasks/archive/62-interactive-minimap-sync.md`](../archive/62-interactive-minimap-sync.md) : `pixi-viewport` reste propriétaire de la caméra, React ne fait que demander un recentrage.
- Le run doit respecter le shell `/game/*` centralisé par [`043-refactor-game-shell-layout`](./archive/043-refactor-game-shell-layout.md).
- [`047-feature-capture-reports`](./047-feature-capture-reports.md) pourra consommer cette primitive une fois les rapports de capture livrés.

## Critère de fin (acceptance)

- [ ] Un helper ou hook unique permet de naviguer vers `/game/world` avec une cible carte typée `{ x, y }`, sans accès direct obligatoire à `useWorldMapStore` côté caller.
- [ ] Le contrat public de navigation carte est URL-readable, par exemple `/game/world?focusX=<x>&focusY=<y>`, pour rester proche d'un deeplink et debug/reload-friendly.
- [ ] Le store `pendingFocus` reste uniquement le pont runtime interne pour appliquer le focus après montage canvas ou depuis les événements temps réel existants.
- [ ] Un focus demandé avant le montage de `WorldMapScreen` est appliqué après initialisation du canvas, puis nettoyé.
- [ ] Un focus demandé alors que l'utilisateur est déjà sur `/game/world` recentre la caméra sans recréer la scène ni casser la source de vérité `pixi-viewport`.
- [ ] Aucun nouveau caller ne duplique le pattern `setPendingFocus(...); navigate('/game/world')` en dehors du helper/hook dédié.
- [ ] Depuis un rapport de combat contenant `targetX` / `targetY`, une action carte ouvre `/game/world` et centre la vue sur la position du village cible.
- [ ] Si la cible est hors vision ou rendue comme blip/fog-of-war, la caméra se centre quand même sur les coordonnées sans crash ni sélection fantôme.
- [ ] Le routing `/game`, `/game/world`, `/game/army` et `/game/messages` reste inchangé hors query params carte documentés.
- [ ] Une doc technique décrit le contrat, les paramètres supportés, l'usage recommandé, les limites fog-of-war et deux exemples de callsite.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`
- Pixi scene : skill `bftc-pixi-scene`

## Décomposition initiale (rempli par le lead à l'étape 3)

_(Vide au démarrage. Tâches chirurgicales : ≤ 5 fichiers chacune, scope précis, critère de succès observable.)_

## Progress (rempli pendant le run)

_(Vide au démarrage. Mis à jour à chaque transition d'étape ou de tâche.)_

## Décisions prises

_(Vide au démarrage. Décisions archi non triviales, dérogations lead, findings de review, refus de sub-agents.)_

## Rapport final

_(Vide au démarrage. Rempli à l'étape 10 : synthèse, fichiers touchés, tickets ouverts, méta-évaluation si applicable.)_

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [ ] Helper/hook unique de navigation carte — test unitaire du helper/hook à préciser pendant le run.
  - [ ] URL-readable contract `/game/world?focusX=<x>&focusY=<y>` — test route/helper à préciser pendant le run.
  - [ ] `pendingFocus` borné au pont runtime interne — `rtk grep "setPendingFocus\\|pendingFocus" battleforthecrown-pixi/src` → seuls store, helper/hook et `WorldMapScreen` attendus, plus migration du consumer existant.
  - [ ] Focus avant montage canvas appliqué puis nettoyé — test store/screen ou helper à préciser pendant le run.
  - [ ] Focus déjà sur `/game/world` recentre sans recréer la scène — test ou QA ciblée à préciser pendant le run.
  - [ ] Aucun pattern dupliqué `setPendingFocus(...); navigate('/game/world')` — `rtk grep "navigate('/game/world')\\|setPendingFocus" battleforthecrown-pixi/src`.
  - [ ] Rapport de combat → action carte → `/game/world` centrée sur `targetX` / `targetY` — test composant/view-model et QA visuelle.
  - [ ] Cible fog-of-war/blip sans sélection fantôme — test logique si possible, sinon QA visuelle.
  - [ ] Routes `/game/*` non régressées — tests layout/nav existants ou grep ciblé à préciser pendant le run.
  - [ ] Doc technique créée/référencée — `rtk grep "map focus\\|focusX\\|focusY" docs/architecture`.
- **Review indépendante** : `Déclenchée (raison: invariant durable frontend transverse ; diff estimé > 100 lignes possible)` avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique à remplir pendant le run.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : frontend route/helper à remplir pendant le run si automatisable.
- **Tests IG à faire par le user** : ouvrir un rapport de combat, cliquer l'action carte, vérifier que la WorldMap s'ouvre centrée sur la cible ; répéter avec une cible hors vision si un scénario dev est disponible.

## Solution cible retenue

Le run doit privilégier une solution hybride maintenable :

1. **Contrat public URL** : la cible carte est encodée dans l'URL de `/game/world` avec des query params explicites (`focusX`, `focusY`, optionnellement `focusLabel` ou `focusEntityId` si le refinement le justifie). Ce contrat est lisible, partageable en debug, compatible reload, et correspond à l'idée de deeplink interne.
2. **Helper/hook unique** : les callers consomment une API frontend dédiée, par exemple `useWorldMapNavigation()` ou `navigateToWorldMapFocus(navigate, target)`. Ils ne manipulent pas directement `pendingFocus`.
3. **Pont runtime store** : `pendingFocus` reste utile pour les cas où la cible arrive hors URL ou avant que le canvas soit prêt, notamment le `VictoryModalHost` existant. Le store ne doit pas devenir l'API publique appelée partout.
4. **WorldMapScreen comme consommateur unique** : l'écran lit le focus URL/store, attend que le canvas expose `centerOn`, applique le recentrage, puis nettoie l'état consommé sans effacer brutalement d'autres query params utiles.
5. **Focus coordonnées avant sélection entité** : le contrat de base centre sur `{ x, y }`. Sélectionner une entité visible est une extension optionnelle et ne doit pas créer de sélection fantôme quand le fog-of-war masque la cible.

Cette solution évite la dette des appels impératifs dispersés, garde `pixi-viewport` propriétaire de la caméra, et donne une convention claire pour les futures features : rapports, captures, activités du royaume, notifications ou modales.

## Contexte cartographié

- `useWorldMapStore` expose déjà `pendingFocus: { x, y } | null` et `setPendingFocus`, ajouté pour le CTA "Voir le village" du modal de conquête.
- `VictoryModalHost` applique aujourd'hui le pattern ad hoc `setPendingFocus({ x, y })` puis `navigate('/game/world')`.
- `WorldMapScreen` consomme `pendingFocus`, appelle `canvasRef.current.centerOn(x, y)`, puis nettoie le focus.
- `WorldMapCanvas` expose déjà `centerOn`, `onCameraChange` et `worldToScreen` via son controller.
- `WorldMapScene` utilise `pixi-viewport`; `centerOn` déplace la caméra puis émet un snapshot caméra.
- `ReportCard` affiche déjà les coordonnées `({report.targetX}, {report.targetY})`, et `CombatReportModal` reçoit les coordonnées via `buildCombatReportModalProps`.

## Pistes écartées

- **Store-only** : simple à coder mais pas assez proche d'un deeplink, peu lisible au debug, fragile si le caller se monte/démonte ou si l'utilisateur reload.
- **URL-only** : propre pour le contrat public mais insuffisant seul pour les événements runtime déjà branchés avant que la carte soit montée.
- **API liée aux rapports** : dette de conception. Le besoin est map-first et doit rester consommable par toutes les features futures.

## Liens détectés

- **À faire avant** : Aucun.
- **À faire après** : [`047-feature-capture-reports`](./047-feature-capture-reports.md) pourra ajouter des actions carte dans les rapports de capture via le helper.
- **Doublon potentiel** : Aucun strict.
- **Connexe (contexte)** :
  - [`024-feature-conquest-victory-modal`](./archive/024-feature-conquest-victory-modal.md) — premier `pendingFocus` runtime à généraliser.
  - [`tasks/archive/60-own-village-popup-goto-button.md`](../archive/60-own-village-popup-goto-button.md) — navigation ponctuelle depuis popup de village possédé.
  - [`tasks/archive/62-interactive-minimap-sync.md`](../archive/62-interactive-minimap-sync.md) — caméra et `centerOn` WorldMap.
  - [`043-refactor-game-shell-layout`](./archive/043-refactor-game-shell-layout.md) — shell et routes `/game/*`.
  - [`tasks/archive/69-inbox-report-tag-and-icon-mapping.md`](../archive/69-inbox-report-tag-and-icon-mapping.md) — contexte inbox/rapports.
  - [`012-feature-inbox-combat-reports`](./archive/012-feature-inbox-combat-reports.md) — rapports combat existants.
- **Déjà résolu (archive)** : primitives ponctuelles seulement (`pendingFocus`, `centerOn`, routes `/game/*`), pas d'API générique documentée.
- **Keywords scannés** : `map`, `world`, `focus`, `navigation`, `deeplink`, `village`, `report`, `combat`, `position`.

## Points d'attention

- Ne pas créer un second store ou un second mécanisme de caméra.
- Ne pas sélectionner automatiquement une entité si la cible est hors vision ; centrer sur les coordonnées suffit.
- Ne pas brancher tous les placeholders de position d'un coup. Chaque consumer doit avoir des coordonnées fiables.
- Ne pas casser le contrat de shell : la navigation vers `/game/world` doit rester une navigation jeu normale, avec query params bornés.
- La doc technique doit être assez concrète pour que les prochaines features n'aient pas à relire `WorldMapScreen`.
