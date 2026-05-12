# Design system React

Portage React/Tailwind du bundle `battleforthecrown-design-system/project`.

## Statut

Le sas React a été réinitialisé après constat que le premier batch ne reprenait pas fidèlement les prototypes HTML.

Route locale : `/design-system`

Composant témoin actuel :

- `BftcButton` depuis `preview/components-buttons.html`
- `Badge` depuis `preview/components-badges.html`
- `Timer` / `DigitTimer` depuis `preview/components-timer.html`
- `CostPill` / `CostRow` depuis `preview/components-cost-row.html`
- `RequirementChip` depuis `preview/components-requirement-chip.html`
- `ProgressBar` depuis `preview/components-progress.html`
- `SegmentedControl` depuis `preview/components-segmented.html`
- `NumberStepper` depuis `preview/components-stepper.html`
- `CoordinateInput` depuis `preview/components-coordinate-input.html`
- `TroopStepper` depuis `preview/components-troop-stepper.html`
- `BuildQueueCard` depuis `preview/components-build-queue.html`
- `ToastPreview` depuis `preview/components-toast.html`
- `EmptyState` depuis `preview/components-empty-state.html`
- `TroopRow` depuis `preview/components-troop-row.html`
- `ChatPanel` depuis `preview/components-chat-bubble.html`

## Workflow de migration

1. Lire le prototype HTML ciblé, puis `preview/_card.css`, puis `colors_and_type.css`.
2. Résumer les styles sources utiles avant de coder.
3. Reproduire d'abord l'exemple HTML source dans `DesignSystemPreview.tsx` avec les mêmes textes, icônes et états visibles.
4. Porter en React/Tailwind avec dimensions, couleurs, gradients, bordures, rayons, ombres et espacements fidèles.
5. Comparer le rendu React au prototype HTML dans le navigateur.
6. Extraire ou réutiliser des primitives uniquement si le rendu reste identique.

## Contrat composant

- Tout composant expose une interface `Props` nommée.
- Les données d'exemple restent dans `DesignSystemPreview.tsx`.
- Un composant réutilisable ne hardcode pas de noms, quantités, rapports, tabs, coûts ou actions.
- Les composants interactifs utilisent de vrais contrôles sémantiques et des props contrôlées.
