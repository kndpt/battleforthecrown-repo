# 076 — Annuler une formation depuis la file Caserne

**Sévérité** : 🟠 Moyen
**Statut** : 🆕 Ouvert
**Spec amont** : [`docs/gameplay/08-units.md`](../docs/gameplay/08-units.md) — entraînement des unités

## Symptôme | Problème

La file de formation de la Caserne affiche les `QueueChip` avec quantité, troupe et progression, mais ne propose plus d'action directe pour annuler une formation restante.

Le backend et la mutation frontend d'annulation existent déjà ; il manque l'affordance UX dans la vue Armée design-system runtime.

## Cause racine probable

La migration de la vue Armée vers `ArmyContentDesign` a remplacé les anciennes cartes d'unités qui portaient une action d'annulation, sans reporter cette action dans le nouveau `QueueChip` compact.

## Comportement attendu

- Chaque formation dans la file Caserne expose une action d'annulation claire, idéalement une petite croix dans le `QueueChip`.
- Cliquer l'action ouvre une confirmation explicite avant d'appeler l'API.
- La confirmation suit le langage design-system : overlay modal, deux boutons `Annuler` + action danger.
- Confirmer appelle la mutation frontend existante `useCancelTrainingMutation({ villageId, trainingId })`.
- Fermer ou annuler la confirmation ne modifie pas la file.
- L'état pending empêche les doubles annulations et les erreurs remontent proprement à l'utilisateur.

## Pistes

### A — Croix dans le QueueChip (recommandée)

Ajouter une petite croix dans le chip pour signaler l'action destructive sans rendre tout le chip cliquable.

Avantages :

- affordance explicite ;
- limite les taps accidentels sur mobile ;
- préserve la possibilité future d'utiliser le tap sur le chip pour ouvrir un détail de progression.

### B — Tap sur tout le QueueChip

Rendre le chip entier cliquable et ouvrir la confirmation.

À éviter sauf arbitrage contraire : le chip sert d'abord d'indicateur compact de progression et se trouve dans une zone utilisée pour le drag/drop de recrutement.

## Scope recommandé

### Frontend

- `battleforthecrown-pixi/src/features/design-system/components/ArmyViewDesign.tsx`
  - étendre `ArmyRecruitSheetProps` avec un callback d'annulation de queue ;
  - rendre l'action dans `QueueChip` ;
  - stopper la propagation pour ne pas interférer avec les interactions de la sheet.
- `battleforthecrown-pixi/src/features/army/ArmyScreen.tsx`
  - brancher `useCancelTrainingMutation` ;
  - stocker l'item sélectionné pour confirmation ;
  - appeler la mutation seulement après confirmation.
- Confirmation UI
  - réutiliser les primitives design-system existantes (`BaseModal` + `BftcButton`, ou wrapper modal cohérent) ;
  - respecter la règle design-system : deux boutons, neutral `Annuler` + action danger.

### Backend

Aucun changement attendu. Vérifier seulement que l'endpoint existant reste suffisant :

- `DELETE /army/:villageId/training/:trainingId/cancel`
- mutation frontend existante `useCancelTrainingMutation`.

### Tests

- Ajouter ou étendre un test `ArmyViewDesign.test.tsx` pour prouver que l'action du `QueueChip` appelle le callback avec le bon `trainingId`.
- Tester que la confirmation n'appelle pas la mutation avant validation si un test de composition frontend reste simple et fiable.
- Ne pas ajouter de mock backend lourd pour un flux déjà couvert par l'API existante.

## Liens détectés

- Connexe : [`tasks/runs/archive/039-integrate-army-view-design-system.md`](./runs/archive/039-integrate-army-view-design-system.md) — source de la vue Armée runtime actuelle.
- Connexe : [`tasks/archive/74-army-touch-drag-recruit.md`](./archive/74-army-touch-drag-recruit.md) — préserver les interactions tap/drag de la zone Armée.
- Connexe : [`tasks/archive/47-noble-training-visual-queue-missing.md`](./archive/47-noble-training-visual-queue-missing.md) — ne pas étendre par erreur la queue Caserne au Noble.
- Déjà résolu : [`tasks/archive/44-army-training-schema-drift.md`](./archive/44-army-training-schema-drift.md) — endpoints armée existants à préserver.
- Déjà résolu : [`tasks/runs/archive/028-barracks-training-speed-bonus.md`](./runs/archive/028-barracks-training-speed-bonus.md) — progression et durées effectives à ne pas régresser.

## Critères de succès

- [ ] Chaque `QueueChip` de formation affiche une action d'annulation explicite.
- [ ] Cliquer l'action ouvre une confirmation et n'appelle pas directement l'API.
- [ ] Confirmer appelle `useCancelTrainingMutation({ villageId, trainingId })`.
- [ ] Annuler ou fermer la confirmation ne modifie pas la queue.
- [ ] Pendant la mutation, l'action est désactivée ou affiche un état pending.
- [ ] La progressbar, le drag/drop de recrutement et la lisibilité mobile restent corrects.
- [ ] `rtk yarn workspace battleforthecrown-pixi type-check` passe.
- [ ] Test frontend ciblé ajouté ou justification explicite si non pertinent.
