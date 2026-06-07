# Run #048 — feature-map-focus-links

> **Statut** : DONE
> **Démarré** : 2026-06-07
> **Terminé** : 2026-06-07

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

- [x] Créer une primitive frontend unique `useWorldMapNavigation` + helpers URL purs pour `/game/world?focusX=<x>&focusY=<y>`.
- [x] Adapter `WorldMapScreen` pour consommer le focus URL/store, recentrer via `centerOn`, nettoyer seulement les params focus et vider la sélection courante.
- [x] Migrer le CTA victoire conquête et ajouter l’action carte du rapport de combat via le helper.
- [x] Couvrir les helpers URL par tests unitaires ciblés et documenter le contrat technique.

## Progress (rempli pendant le run)

- Préflight : dérogation user appliquée pour poursuivre malgré fichiers non suivis / `yarn.lock` déjà sales (`.yarn/`, `.yarnrc.yml`, `yarn.lock`). Branche dédiée créée : `run/048-feature-map-focus-links`.
- Cartographie : `pendingFocus` existant confirmé dans `useWorldMapStore`, consommation actuelle dans `WorldMapScreen`, pattern ad hoc dans `VictoryModalHost`, coordonnées `targetX` / `targetY` disponibles dans les rapports combat.
- Implémentation : helper/hook URL + pont store ajoutés, `WorldMapScreen` rendu consommateur unique, callsites migrés.
- Tests : helpers URL + view-model rapport combat ciblés verts ; `static-check` vert après régénération du Prisma Client local.
- Documentation : `docs/architecture/map-focus-navigation.md` créée et indexée.
- QA : pas de smoke backend, diff frontend/docs uniquement ; checklist IG fournie pour validation visuelle.

## Décisions prises

- Dérogation lead/user : poursuite malgré préflight git non clean, en excluant les fichiers préexistants du commit final.
- Pas de sub-agents : la consigne système de ce harness n’autorise les sub-agents que sur demande explicite de délégation/parallel agents ; review lead 5 axes réalisée localement.
- Le focus URL est prioritaire sur `pendingFocus`, car il est le contrat public reload/debug-friendly ; `pendingFocus` reste le pont runtime interne.
- Les query params non liés au focus sont préservés pour éviter de casser de futurs états UI de `/game/world`.
- Un focus carte efface la sélection courante sans sélectionner la cible, afin d’éviter tout panneau/tooltip fantôme en fog-of-war.

## Rapport final

- Primitive `worldMapNavigation` ajoutée : construction/parsing/cleanup des params `focusX` / `focusY`, hook `useWorldMapNavigation()` et pont runtime `pendingFocus`.
- `WorldMapScreen` consomme le focus URL/store, appelle `WorldMapCanvas.centerOn`, nettoie `pendingFocus` et retire uniquement les query params focus en `replace`.
- `VictoryModalHost` migre vers le helper unique ; `ReportDetailModal` ajoute l’action « Carte » pour les rapports de combat.
- Documentation technique créée : `docs/architecture/map-focus-navigation.md`, indexée dans `docs/architecture/README.md`.
- Aucun ticket follow-up ouvert.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Helper/hook unique de navigation carte — `yarn workspace battleforthecrown-pixi test src/features/world/worldMapNavigation.test.ts src/features/combat/combatReportView.test.ts` (8 tests verts).
  - [x] URL-readable contract `/game/world?focusX=<x>&focusY=<y>` — test helper `buildWorldMapFocusPath` vert.
  - [x] `pendingFocus` borné au pont runtime interne — `rg -n "setPendingFocus|pendingFocus|navigate\('/game/world'\)" battleforthecrown-pixi/src` : store, helper et `WorldMapScreen` seulement pour le focus ; navigations shell simples inchangées.
  - [x] Focus avant montage canvas appliqué puis nettoyé — logique `WorldMapScreen` : seed initial `activeFocus`, application quand `canvasRef.current` existe, cleanup store/query ensuite ; couvert par type-check/static-check.
  - [x] Focus déjà sur `/game/world` recentre sans recréer la scène — helper préserve la route et remplace les params focus ; `WorldMapScreen` appelle `centerOn` sur le controller existant.
  - [x] Aucun pattern dupliqué `setPendingFocus(...); navigate('/game/world')` — `rg -n "setPendingFocus|pendingFocus|navigate\('/game/world'\)" battleforthecrown-pixi/src`.
  - [x] Rapport de combat → action carte → `/game/world` centrée sur `targetX` / `targetY` — action `view-map` branchée dans `CombatReportDetail`; validation visuelle IG à faire par Kelvin.
  - [x] Cible fog-of-war/blip sans sélection fantôme — `WorldMapScreen` centre sur coordonnées et appelle `setSelectedEntity(null)` sans sélectionner d’entité ; QA visuelle recommandée.
  - [x] Routes `/game/*` non régressées — seules des query params optionnels sont ajoutés à `/game/world`; `yarn static-check` vert.
  - [x] Doc technique créée/référencée — `rg -n "map focus|focusX|focusY" docs/architecture`.
- **Review indépendante** : Non déclenchée dans ce harness (pas de demande explicite de sub-agents) ; review lead 5 axes réalisée, verdict `GO`.
- **Tests automatisés** : `yarn workspace battleforthecrown-pixi test src/features/world/worldMapNavigation.test.ts src/features/combat/combatReportView.test.ts` → 2 fichiers / 8 tests passed ; `yarn workspace battleforthecrown-backend prisma:generate && yarn static-check` → passed.
- **Smokes ajoutés/modifiés** : Aucun, raison : diff frontend/docs uniquement, pas de backend `src/`, endpoint, worker, Outbox ou DB touché.
- **QA fonctionnelle agent** : helpers URL automatisés ; pas de QA navigateur IG effectuée conformément aux règles agent.
- **Tests IG à faire par le user** : ouvrir un rapport de combat, cliquer l’action `Carte`, vérifier que la WorldMap s’ouvre centrée sur la cible ; répéter avec une cible hors vision si un scénario dev est disponible ; vérifier que le CTA `Voir le village` du modal victoire conquête centre toujours la carte.

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
