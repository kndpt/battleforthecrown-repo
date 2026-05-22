# Run #031 — feature-multi-village-bottom-sheet-selector

> **Statut** : DONE
> **Démarré** : 2026-05-22
> **Terminé** : 2026-05-22

## Cible

- **Phase roadmap** : Phase 9 — Navigation multi-village (étiquettes, capitale, sélecteur)
- **Spec source** : [`docs/gameplay/22-village-roles-and-navigation.md`](../../docs/gameplay/22-village-roles-and-navigation.md)
- **Type** : `feature`
- **Modules backend** : —
- **Modules frontend** : `pixi/layout`, `pixi/design-system`

## Dépendances

- Run 021 livré : [`tasks/runs/archive/021-feature-village-labels-navigation.md`](./archive/021-feature-village-labels-navigation.md) expose déjà `GET /village`, `label`, `isCapital`, le fallback de village actif et le sélecteur compact actuel.
- Ticket 51 livré : [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) cadre la direction bottom sheet design-system.
- Composant design-system `MultiVillageBottomSheet` disponible dans `battleforthecrown-pixi/src/features/design-system/components/MultiVillageBottomSheet.tsx`.

## Critère de fin (acceptance)

- [ ] Cliquer sur le nom/sélecteur central du village dans le header IG ouvre le `MultiVillageBottomSheet`.
- [ ] Cliquer sur la flèche gauche ou droite continue de changer le village actif via `setVillage` et n'ouvre pas le bottom sheet.
- [ ] Cliquer sur un village dans le bottom sheet définit ce village comme actif et ferme le sheet.
- [ ] Le sheet affiche au minimum les villages possédés avec nom, coordonnées, état actif, capitale dérivée et étiquette MVP quand présents.
- [ ] Le dropdown compact inline actuel n'est plus rendu comme menu de sélection concurrent.
- [ ] Aucune donnée riche indisponible n'est inventée : pas de ressources, activités, alertes, stratégie ou puissance factices présentées comme réelles.
- [ ] Sur mobile, le sheet est lisible, scrollable, et ne masque pas de façon incohérente le header ou les contrôles.
- [ ] Les données manquantes sont listées dans le rapport final avec proposition de tickets/runs si elles nécessitent de nouveaux endpoints.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`
- Frontend HUD : skill `bftc-react-hud`
- Design-system migration : skill `bftc-design-system-migration`

## Décomposition initiale (rempli par le lead à l'étape 3)

- [x] T1 — `GameHeader` : remplacer le dropdown inline par l'ouverture du `MultiVillageBottomSheet`, garder les flèches comme actions directes, fermer le sheet après sélection.
- [x] T2 — `MultiVillageBottomSheet` : permettre un rendu MVP sans ressources/activités/alertes/stratégie/puissance inventées, tout en gardant nom, coordonnées, actif, capitale et étiquette.
- [x] T3 — Tests Pixi : couvrir ouverture depuis le nom, flèches sans sheet, sélection + fermeture, et absence du menu inline concurrent.
- [ ] T4 — QA/review/archive : tests, static-check, review indépendante, docs impact, archive et commit.

## Progress (rempli pendant le run)

- 2026-05-22 — Préflight terminé : git clean, fiche/spec/règles/SPEC/briefing Pixi/skills lus.
- 2026-05-22 — Cartographie terminée : `GameHeader` porte le dropdown inline actuel, `MultiVillageBottomSheet` exige aujourd'hui des données riches qu'il faut rendre optionnelles pour le MVP réel.
- 2026-05-22 — Implémentation terminée : `GameHeader` ouvre le sheet, les flèches restent directes, le composant accepte des items MVP sans données riches.
- 2026-05-22 — Test ciblé ajouté et vert : `GameHeader.test.tsx` couvre ouverture, sélection, fermeture, flèches et absence d'UI riche fictive.
- 2026-05-22 — Correction design-system après retour user : conserver la structure visuelle du sheet, neutraliser les données indisponibles par tirets, afficher la puissance réelle si présente, brancher le tri alphabétique.
- 2026-05-22 — Review indépendante finale : `GO`, aucun finding bloquant/majeur.

## Décisions prises

- Mapper uniquement `JoinedVillage.id/name/x/y/label/isCapital` + état actif. Les champs riches indisponibles ne seront pas affichés ni remplis à zéro.
- Review indépendante obligatoire conservée, car la fiche la demande explicitement et le diff frontend devrait dépasser le seuil trivial.

## Rapport final

### Synthèse

- `GameHeader` ouvre désormais `MultiVillageBottomSheet` depuis le nom/sélecteur central du village.
- Les flèches précédent/suivant restent des actions directes `setVillage` et ferment le sheet si nécessaire.
- Le dropdown inline concurrent a été supprimé.
- `MultiVillageBottomSheet` accepte un mode MVP avec données partielles : nom, coordonnées, état actif, capitale, étiquette et puissance réelle si disponible ; les ressources/activités indisponibles gardent la structure design-system avec des tirets neutralisés, sans zéros fictifs.
- Le bouton de tri conserve le contrôle design-system et bascule l'ordre alphabétique des villages.
- Un filet Vitest cible l'ouverture du sheet, la sélection + fermeture, les deux flèches et l'absence de données riches inventées.

### Fichiers touchés

- `battleforthecrown-pixi/src/features/layout/GameHeader.tsx`
- `battleforthecrown-pixi/src/features/layout/multiVillageSheet.ts`
- `battleforthecrown-pixi/src/features/layout/GameHeader.test.tsx`
- `battleforthecrown-pixi/src/features/design-system/components/MultiVillageBottomSheet.tsx`
- `tasks/runs/031-feature-multi-village-bottom-sheet-selector.md`
- `tasks/todo.md`

### Données riches non disponibles et follow-ups proposés

- Ressources courantes par village : proposer un run backend/frontend `kingdom-village-resources-snapshot` si le sheet doit afficher des stocks multi-village réels.
- Activités bâtiments par village : proposer un run `kingdom-activity-snapshot-buildings` plutôt que réutiliser la queue du village actif.
- Formations de troupes par village : proposer un run `kingdom-activity-snapshot-training` avec payload consolidé.
- Seigneur / capture / activités nobles : proposer un run dédié après stabilisation des flows nobles multi-village.
- Alertes entrantes par village : proposer un run `incoming-threats-by-village` adossé aux expéditions ouvertes.
- Stratégie/style par village : proposer un run uniquement si l'API expose une liste fiable, car `useVillageStrategyQuery(villageId)` reste active-village oriented.
- Puissance par village : affichée seulement depuis la liste réelle de `useKingdomPowerQuery()` quand elle est disponible.

Choix final d'intégration : privilégier des états neutralisés dans la structure visuelle du design-system plutôt qu'une disparition complète des rangées, afin de rester fidèle au composant preview sans inventer de valeurs.

Docs : aucun changement nécessaire, raison : la spec `docs/gameplay/22-village-roles-and-navigation.md` décrit déjà le comportement MVP navigation-only ; ce run branche l'UI sans changer le canon gameplay, API ou modèle de données.

### Acceptance & QA

- **Critères d'acceptance vérifiés** (commande exécutable obligatoire si automatisable, preuve textuelle uniquement si visuel/gameplay/UX) :
  - [x] Cliquer sur le nom/sélecteur central du village ouvre le `MultiVillageBottomSheet` — `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test GameHeader.test.tsx` → test `opens the bottom sheet...` vert.
  - [x] Cliquer sur la flèche gauche ou droite change toujours le village actif et n'ouvre pas le bottom sheet — `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test GameHeader.test.tsx` → test `keeps arrows...` couvre suivant + précédent, vert.
  - [x] Cliquer sur un village dans le bottom sheet définit ce village comme actif et ferme le sheet — `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test GameHeader.test.tsx` → `villageId` passe à `v2`, titre du sheet absent après sélection.
  - [x] Le sheet affiche les villages possédés avec nom, coordonnées, état actif, capitale et étiquette MVP — `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test GameHeader.test.tsx` → `Haute Cour`, `Marche Nord`, `Capitale`, `Défensif`, `10:12` visibles.
  - [x] Le dropdown compact inline actuel n'est plus rendu comme menu concurrent — `rtk grep -n "isVillageMenuOpen|top-full|hover:bg-kingdom-100" battleforthecrown-pixi/src/features/layout/GameHeader.tsx` → aucun résultat attendu.
  - [x] Aucune donnée riche indisponible n'est inventée — `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test GameHeader.test.tsx` → puissance réelle affichée depuis `useKingdomPowerQuery`, pas de texte `Construction`, valeurs indisponibles rendues en tirets neutralisés.
  - [x] Le sheet mobile est lisible et scrollable — `visuel` → preview `/design-system` ouverte en viewport 390x844, `sheetVisible=true`, `hasHorizontalOverflow=false`.
  - [x] Les données manquantes sont listées avec follow-ups potentiels — `rtk grep -n "Données riches non disponibles" tasks/runs/031-feature-multi-village-bottom-sheet-selector.md` → section renseignée ci-dessus.
- **Review indépendante** : `Déclenchée (raison: fiche REVIEW indépendante + diff > 100 lignes + invariant durable: ne pas afficher de données multi-village fictives)` ; premier verdict `BLOCK` sur rapport final non renseigné, findings mineurs corrigés ; verdict final `GO`, aucun finding bloquant/majeur.
- **Tests automatisés** :
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test GameHeader.test.tsx` → 1 fichier, 2 tests, vert.
  - `yarn workspace battleforthecrown-pixi type-check` → vert.
  - `VITE_API_BASE_URL=http://localhost:15001 VITE_WS_URL=http://localhost:15001 yarn workspace battleforthecrown-pixi test` → 29 fichiers, 153 tests, vert ; warning jsdom connu `HTMLCanvasElement.getContext()`.
  - `yarn static-check` → vert.
- **Smokes lancés** : Non applicable, raison : aucun diff backend ni API.
- **Smokes ajoutés/modifiés** : Aucun, raison : scope frontend HUD/design-system ; filet Vitest ciblé suffisant selon `bftc-tests-policy`.
- **QA fonctionnelle agent** : backend `http://localhost:15002/health` OK, frontend `http://localhost:5174/` HTTP 200, preview `/design-system` ouverte en viewport mobile 390x844 ; test IG complet multi-village réel laissé au user car il dépend d'un compte/session avec plusieurs villages.
- **Tests IG à faire par le user** :
  - [ ] Vérifier sur mobile que la transition header → bottom sheet est naturelle.
  - [ ] Vérifier que les informations volontairement absentes ne donnent pas une impression de bug ou de données à zéro.

## Notes de cadrage

### Piste retenue

Intégrer le bottom sheet en mode MVP "données réelles uniquement".

Le mapping peut utiliser les données déjà disponibles :

- `JoinedVillage.id`
- `JoinedVillage.name`
- `JoinedVillage.x` / `JoinedVillage.y`
- `JoinedVillage.label`
- `JoinedVillage.isCapital`
- `useGameStore().villageId` pour l'état actif

Toute donnée non disponible pour tous les villages doit être masquée, rendue en état sobre explicite, ou reportée en follow-up. Ne pas remplir avec des zéros ou valeurs arbitraires.

### Données riches non disponibles à traiter en follow-up si nécessaire

- Ressources courantes par village : aujourd'hui `useDisplayResources(villageId)` concerne le village actif.
- Activités bâtiments par village : les queues existantes sont orientées village actif.
- Formations de troupes par village : les données ne sont pas exposées comme synthèse multi-village.
- Seigneur / capture / activités nobles par village : pas de snapshot multi-village consolidé.
- Alertes entrantes par village : pas de payload de liste prêt pour ce sheet.
- Stratégie/style par village : `useVillageStrategyQuery(villageId)` couvre le village actif, pas toute la liste.
- Puissance par village : `useKingdomPowerQuery()` peut être utilisée seulement si elle est assez fiable et alignée par `villageId`.

### Points d'attention

- `GameHeader` est utilisé dans plusieurs écrans (`ArmyScreen`, `MessagesScreen`, `VillageView`, `WorldLockedScreen`, `WorldMapScreen`) : vérifier l'ouverture du sheet dans tous les contextes principaux.
- Le filtre `active` / `alerts` du composant design-system peut être ambigu si les alertes ne sont pas disponibles. L'implémentation doit soit l'adapter, soit le masquer proprement pour éviter une UX mensongère.
- Les flèches doivent rester des actions directes, indépendantes du sheet.
