# Catalogue UI — `battleforthecrown-pixi`

Composants UI stylisés "Clash-like" pour le HUD React. Tailwind CSS + thème médiéval (cf. [`tailwind.config.ts`](../tailwind.config.ts)) + `class-variance-authority` (CVA) pour les variants.

> **Démo interactive** : route `/ui-test` (cf. `src/features/ui-test/UiTestScreen.tsx`). Lance `yarn workspace battleforthecrown-pixi dev` puis ouvre `http://localhost:5173/ui-test`.
>
> **Conventions de création** : [`ui-design-system.md`](./ui-design-system.md) (palette, typo, espacements, template CVA, checklist).
>
> **Tone & writing** des micro-copies : [`ui-writing-style.md`](./ui-writing-style.md).

## Structure

```
src/ui/
├── avatars/           Avatar
├── badges/            Badge
├── buttons/           Button, IconButton
├── cards/             Card, CardBanner, CardBody, CardFooter, CardImage, CardStats, CardTitle
├── common/            ResourceIcon
├── feedback/          ProgressBar
├── floating-buttons/  FloatingButton
├── inputs/            Input, InputLabel, InputHelperText, Checkbox, Radio, Textarea
├── keypads/           NumericKeypad, NumericKeypadSheet
├── layout/            HeaderBar, HeaderActions, PlayerProfile, PopulationIndicator, ResourceDisplay
├── modals/            Modal, ModalBody, ModalFooter
├── panels/            Panel, PanelHeader, PanelBody, PanelFooter, BottomSheet
├── selects/           Select
├── sliders/           Slider
├── spinners/          Spinner
├── toasts/            Toast, ToastProvider, useToast
├── tooltips/          Tooltip
├── typography/        (placeholder, vide)
└── index.ts           barrel — point d'entrée pour les imports `@/ui`
```

Chaque dossier contient un `README.md` détaillé (variants, tailles, props, exemples). Pour un nouveau composant, suivre le workflow décrit dans [`ui-design-system.md`](./ui-design-system.md).

## Composants disponibles

### Primitives stateless

| Composant       | Dossier               | Variants principaux                                       | Notes                                            |
|-----------------|-----------------------|-----------------------------------------------------------|--------------------------------------------------|
| **Button**      | `buttons/`            | `success`, `info`, `danger`, `warning`, `neutral`         | 4 tailles ; effet 3D                             |
| **IconButton**  | `buttons/`            | mêmes variants que Button                                  | Circulaire ; tailles 32/40/48/56 px              |
| **FloatingButton** | `floating-buttons/` | `default`, `success`, `info`, `warning`, `danger`         | 2 formes (rond/rect), 8 positions, badge support |
| **Avatar**      | `avatars/`            | `default`, `stone`, `gold`, `success`, `info`, `danger`   | 7 tailles ; fallback initiales                   |
| **Card**        | `cards/`              | `parchment`, `default`, `stone`, `wood`                   | Compositions : `CardBanner`, `Body`, `Footer`, `Image`, `Title`, `Stats` |
| **Input**       | `inputs/`             | `default`, `parchment`, `success`, `error`                | + `InputLabel`, `InputHelperText`                |
| **Checkbox**    | `inputs/`             | `default`, `parchment`, `success`, `error`                | Icon Check intégrée                              |
| **Radio**       | `inputs/`             | `default`, `parchment`, `success`, `error`                | Point central en gradient                        |
| **Textarea**    | `inputs/`             | `default`, `parchment`, `success`, `error`                | Resizable verticalement                          |
| **Select**      | `selects/`            | `default`, `parchment`, `success`, `info`                 | Icon `ChevronDown`                               |
| **Tooltip**     | `tooltips/`           | `default`, `dark`, `success`, `error`, `info`             | 4 positions ; flèche directionnelle              |
| **Badge**       | `badges/`             | `default`, `success`, `error`, `warning`, `info`, `neutral` | 3 tailles ; circulaire                         |
| **Spinner**     | `spinners/`           | 6 variants                                                 | 4 tailles ; CSS-only                             |
| **Slider**      | `sliders/`            | 5 variants                                                 | 3 tailles ; min/max/step                         |
| **NumericKeypad** | `keypads/`          | `info`, `success`, `warning`, `danger`, `neutral`         | Pavé tactile 4×3, display + max ; sheet wrapper `NumericKeypadSheet` |
| **ProgressBar** | `feedback/`           | `default`, `success`, `info`, `warning`, `danger`         | Animation `shimmer`                              |
| **Modal**       | `modals/`             | `default`, `warning`, `danger`, `info`                    | + `ModalBody`, `ModalFooter`                     |
| **Panel**       | `panels/`             | 8 variants matériaux                                       | + `Header`, `Body`, `Footer`                     |
| **BottomSheet** | `panels/`             | —                                                          | Slide depuis le bas, mobile-first                |
| **Toast**       | `toasts/`             | `default`, `success`, `error`, `warning`, `info`          | + `ToastProvider`, hook `useToast`               |

### Layout HUD (transversal stateful)

Composants qui lisent les stores Zustand pour afficher l'état du joueur. Vivent dans `src/ui/layout/` parce qu'ils sont **transverses au shell** de l'app, mais ne sont **pas** des primitives "idiotes" — ils peuvent évoluer vers `src/features/layout/` si la frontière devient floue (cf. `react-hud.md` § UI primitives).

| Composant              | Lit                            | Rôle                                                      |
|------------------------|--------------------------------|-----------------------------------------------------------|
| **HeaderBar**          | composé via `HeaderActions`    | Barre supérieure du HUD                                   |
| **HeaderActions**      | —                              | Slot d'actions à droite du header                         |
| **PlayerProfile**      | `useAuthStore`, `useCrownsStore` | Avatar + pseudo + balance crowns                        |
| **PopulationIndicator** | (props)                       | Affichage `used / max`                                    |
| **ResourceDisplay**    | (props)                        | Liste de ressources avec icônes — interpolation côté caller |
| **ResourceIcon**       | (props)                        | Icône wood/stone/iron/gold (`src/ui/common/`)             |

## Exemple d'utilisation

```tsx
import { Button, Card, CardBanner, CardBody, CardFooter, Badge } from '@/ui';

function VillageCard({ village, onSelect }: Props) {
  return (
    <Card variant="parchment">
      <CardBanner variant="success">
        {village.name} <Badge variant="info">Niv. {village.level}</Badge>
      </CardBanner>
      <CardBody>
        Coordonnées : ({village.x}, {village.y})
      </CardBody>
      <CardFooter>
        <Button variant="success" onClick={onSelect}>
          Entrer dans le village
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## Règles d'or

1. **UI idiote** : zéro logique métier dans `src/ui/`. Pas d'appels API, pas de mutations TanStack Query, pas de calculs gameplay. Juste de la présentation et l'état UI local (`isOpen`, `isHovered`).
2. **Props natives** : spread des props HTML (`...props`), `forwardRef` pour les composants interactifs.
3. **CVA partout** pour les variants. Pas de `if (variant === 'success') { ... }` en branche.
4. **Tokens Tailwind, pas de hex en dur**. Tous les hex sont dans `tailwind.config.ts` ; le composant les référence par nom.
5. **Composabilité** : préférer `<Card><CardBody/><CardFooter/></Card>` à un mega-composant `<CardWithEverything>`.

## Roadmap

À créer sur demande, pas en spec :

- [ ] **Divider** — séparateur visuel.
- [ ] **typography/** — `Heading`, `Text` avec variants `font-cinzel` / `font-game` si on a besoin d'unifier les tailles. À évaluer quand un troisième composant ré-implémentera la même règle.

## Maintenance

Source de vérité = code (`src/ui/index.ts`, `tailwind.config.ts`, `package.json`). Cette doc complète, ne précède pas. Mettre à jour le tableau des composants quand on en ajoute/supprime un.
