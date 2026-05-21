# Run #029 — migrate-building-modals-design-system

> **Statut** : PLANNED
> **Démarré** : —
> **Terminé** : —

## Cible

- **Phase roadmap** : Hors roadmap — consolidation UI village
- **Spec source** : [`docs/gameplay/03-buildings.md`](../../docs/gameplay/03-buildings.md), [`docs/gameplay/08-units.md`](../../docs/gameplay/08-units.md), [`docs/gameplay/10-conquest.md`](../../docs/gameplay/10-conquest.md), [`docs/gameplay/12-village-styles.md`](../../docs/gameplay/12-village-styles.md)
- **Type** : refacto
- **Modules backend** : —
- **Modules frontend** : `pixi/features/village`, `pixi/features/design-system/components`, `pixi/features/army`

## Dépendances

- Le run [`028 — Bonus de vitesse d'entraînement de la Caserne`](./archive/028-barracks-training-speed-bonus.md) est terminé et doit être consommé : la modale Caserne doit afficher le helper/constante shared de vitesse d'entraînement existant, sans recoder la feature.
- Bâtiments déjà migrés à préserver : `WOOD`, `STONE`, `IRON`, `QUARTER` via `ResourceBuildingDetailModal`.
- Bâtiments actifs encore legacy à migrer : `CASTLE`, `WAREHOUSE`, `BARRACKS`, `WATCHTOWER`, `COUNCIL_HALL`, `THRONE_HALL`.
- Bâtiments désactivés MVP à ignorer : `WALL`, `HIDEOUT`.
- Arbitrages produit validés :
  - `BARRACKS` : afficher les unités débloquées par niveau et le bonus de vitesse d'entraînement.
  - `CASTLE` : afficher le bonus de vitesse construction et les prochains bâtiments débloqués.
  - `WAREHOUSE` : afficher uniquement le stockage du niveau actuel et du prochain niveau, pas le stock courant.
  - `WATCHTOWER` : afficher le rayon de vision du village, un message informatif sur les rayons multi-villages et un placeholder visuel libellé `image simulation des rayons qui se touchent`.
  - `COUNCIL_HALL` : ouvrir directement la même modale que le bouton `Voie du village`, au lieu d'une modale bâtiment classique.
  - `THRONE_HALL` : migrer la logique Noble et revoir entièrement le design pour l'aligner avec la nouvelle DA.

## Critère de fin (acceptance)

- [ ] `CASTLE`, `WAREHOUSE`, `BARRACKS`, `WATCHTOWER` et `THRONE_HALL` ne rendent plus le corps legacy de `BuildingDetailModal`; ils utilisent `BuildingModal` ou une variante design-system cohérente.
- [ ] `COUNCIL_HALL` ouvre le flux/modale existant de `Voie du village` depuis la carte bâtiment et depuis tout caller équivalent, sans dupliquer la logique de choix de style.
- [ ] `BARRACKS` affiche les unités débloquées par niveau et le bonus de vitesse d'entraînement issu du run 028.
- [ ] `CASTLE` affiche à la fois la vitesse de construction actuelle/prochaine et les bâtiments débloqués par le prochain niveau.
- [ ] `WAREHOUSE` affiche uniquement la capacité de stockage actuelle et prochaine, sans jauge de stock courant.
- [ ] `WATCHTOWER` affiche le rayon local actuel/prochain, un court message sur l'union multi-village, et le placeholder `image simulation des rayons qui se touchent`.
- [ ] `THRONE_HALL` conserve le recrutement Noble complet : coûts, couronnes, population, cap 1 Noble, progression, annulation, erreurs, états indisponibles.
- [ ] Les états `unbuilt-locked`, `unbuilt-available`, `in-progress`, `available`, `max`, file pleine, upgrade et cancel restent fonctionnellement identiques.
- [ ] `WALL` et `HIDEOUT` restent ignorés tant qu'ils sont désactivés MVP.
- [ ] Tests ciblés ajoutés ou mis à jour pour la matrice de contenu et les états critiques ; QA visuelle mobile/desktop effectuée sur Caserne, Château, Tour de guet, Salle du Trône et Salle du Conseil.
- [ ] `rtk yarn static-check` est vert.

## Références à respecter

- Docs : @.agents/rules/docs.md
- Git : @.agents/rules/git.md
- Conventions : @.agents/rules/conventions.md
- Tests : skill `bftc-tests-policy`
- QA : skill `bftc-qa`

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
  - [ ] Aucun bâtiment actif restant ne rend le corps legacy — `rtk grep -n "BuildingDetailModal|ResourceBuildingDetailModal|getResourceBuildingKey" battleforthecrown-pixi/src/features/village battleforthecrown-pixi/src/features/army` → à remplir.
  - [ ] Contenu Caserne — test ou grep ciblé sur unités débloquées + bonus vitesse → à remplir.
  - [ ] Contenu Château / Entrepôt / Tour de guet / Salle du Trône — tests ciblés ou QA visuelle → à remplir.
  - [ ] Flux Salle du Conseil vers `Voie du village` — test ou QA visuelle → à remplir.
  - [ ] États lock/construction/max/cancel/upgrade préservés — test ciblé ou QA visuelle → à remplir.
  - [ ] Static check — `rtk yarn static-check` → à remplir.
- **Review indépendante** : Déclenchée (raison: diff estimé > 100 lignes + invariant durable de contenu modal par bâtiment) avec verdict `GO` ou `BLOCK + findings résolus`.
- **Tests automatisés** : commandes exactes + résultat synthétique.
- **Smokes ajoutés/modifiés** : fichiers + scénario couvert, ou `Aucun`, raison.
- **QA fonctionnelle agent** : vérifier en navigateur les modales bâtiment sur mobile et desktop ; capturer au minimum Caserne, Château, Tour de guet, Salle du Trône et Salle du Conseil.
- **Tests IG à faire par le user** :
  - [ ] Valider visuellement le placeholder Watchtower `image simulation des rayons qui se touchent` avant remplacement par l'image finale.
  - [ ] Valider que la nouvelle DA de la Salle du Trône colle au niveau attendu.

## Liens détectés

- Connexe : [`tasks/archive/51-bottom-sheet-design-system-base.md`](../archive/51-bottom-sheet-design-system-base.md) — standardisation design-system des bottom sheets et panneaux.
- Connexe : [`tasks/runs/archive/009-fix-ui-locked-unbuilt.md`](./archive/009-fix-ui-locked-unbuilt.md) — états lock/unbuilt et décisions UI bâtiment à préserver.
- Connexe : [`tasks/archive/57-player-village-building-lifecycle-roster.md`](../archive/57-player-village-building-lifecycle-roster.md) — roster lifecycle utile pour ignorer `WALL` / `HIDEOUT`.
- Connexe : [`tasks/archive/40-recruit-noble-throne-hall.md`](../archive/40-recruit-noble-throne-hall.md) et [`tasks/archive/47-noble-training-visual-queue-missing.md`](../archive/47-noble-training-visual-queue-missing.md) — contraintes Noble / Salle du Trône.
- Dépendance consommée : [`tasks/runs/archive/028-barracks-training-speed-bonus.md`](./archive/028-barracks-training-speed-bonus.md) — bonus de vitesse Caserne à afficher.

## Notes de cadrage

- Ne pas recréer une seconde source de vérité pour les bonus : lire `packages/shared/src/village/buildings.ts` et les helpers shared existants.
- Ne pas mélanger stock courant et capacité Entrepôt : le stock courant reste le rôle des modales de ressources.
- La Salle du Conseil est un routage UX vers le flux de style, pas une nouvelle modale informative.
- La Salle du Trône est le plus gros risque de régression : conserver la logique métier existante, mais reprendre la présentation pour la nouvelle DA.
