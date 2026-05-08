# Design System — `battleforthecrown-pixi`

Source unique pour les **conventions visuelles et techniques** des composants `src/ui/`. Le code (`tailwind.config.ts`, `src/ui/`) reste la source de vérité runtime ; cette doc explique **les règles** qui régissent ce code.

> Voir aussi : [`ui-library.md`](./ui-library.md) (catalogue des composants), [`ui-writing-style.md`](./ui-writing-style.md) (tone & writing).

## Direction artistique

Médiéval clay/parchment, inspiration Clash of Clans + Tribal Wars + Age of Empires. Bordures épaisses (2px), dégradés subtils, ombres portées prononcées, palette chaude (parchemin, bois, pierre, or) + couleurs d'état (vert/bleu/rouge).

## Palette

Source de vérité : [`tailwind.config.ts`](../tailwind.config.ts). Ne jamais coder un hex en dur dans un composant — toujours référencer une classe Tailwind.

### Tokens disponibles

```ts
// kingdom : palette principale (orange/marron médiéval)
kingdom: {
  50: '#fef7ee',  100: '#fdead4',  200: '#fbd6a8',  300: '#f9b97c',
  400: '#f59e0b', 500: '#d97706',  600: '#b45309',  700: '#92400e',
  800: '#78350f', 900: '#451a03',
}

// game : couleurs d'état (Clash-like)
game: {
  green: { light: '#6ebf49', dark: '#4a8c2a', border: '#3a6c1f' },
  blue:  { light: '#5b9bd5', dark: '#2e75b6', border: '#1f5288' },
  red:   { light: '#e74c3c', dark: '#c0392b', border: '#a93226' },
  gold:  { light: '#f1c40f', dark: '#d4a017', border: '#9e7b0d' },
  stone: { light: '#95a5a6', dark: '#7f8c8d', border: '#5d6d6e' },
}

parchment: '#d2b48c'  // fond beige
```

### Variants standards par composant

Tout composant interactif expose au minimum les variants `default | success | info | warning | danger` :

| Variant   | Background                                   | Border               | Text       | Usage                              |
|-----------|----------------------------------------------|----------------------|------------|------------------------------------|
| `default` | `parchment` ou `kingdom-50`                  | `kingdom-700`        | gray-800   | État neutre                        |
| `success` | gradient `game-green-{light→dark}`           | `game-green-border`  | white      | Validation, construction, troupes amies |
| `info`    | gradient `game-blue-{light→dark}`            | `game-blue-border`   | white      | Information, armée, stratégie      |
| `warning` | gradient `game-gold-{light→dark}`            | `game-gold-border`   | gray-800   | Ressources, avertissement          |
| `danger`  | gradient `game-red-{light→dark}`             | `game-red-border`    | white      | Combat, erreur, suppression        |

### Couleurs par domaine de jeu

Convention pour aider le joueur à lire l'UI au coup d'œil :

- **Troupes / armée** → `game-blue` (info)
- **Bâtiments / construction** → `game-green` (success)
- **Ressources / économie** → `game-gold` (warning)
- **Combat / danger** → `game-red` (danger)
- **Défense / fortifications** → `game-stone` (neutral)

## Typographie

```ts
fontFamily: {
  cinzel: ['Cinzel', 'serif'],            // titres, headers, emphase médiévale
  game:   ['Cinzel', 'Georgia', 'serif'], // corps de texte UI (Cinzel + fallbacks)
}
```

| Usage              | Classe Tailwind         | Taille |
|--------------------|-------------------------|--------|
| Titre de page      | `text-4xl font-bold`    | 36 px  |
| Titre de section   | `text-2xl font-bold`    | 24 px  |
| Sous-titre         | `text-xl font-bold`     | 20 px  |
| Titre composant    | `text-lg font-semibold` | 18 px  |
| Corps              | `text-base`             | 16 px  |
| Texte secondaire   | `text-sm`               | 14 px  |
| Très petit         | `text-xs`               | 12 px  |

`font-cinzel` pour `PanelHeader`, `CardTitle`, page titles. `font-game` pour le reste (boutons, inputs, badges, body).

## Espacements

### Padding (prop `padding` des conteneurs)

```ts
none: 'p-0'
sm:   'p-3'  //  12 px
md:   'p-4'  //  16 px (défaut)
lg:   'p-6'  //  24 px
xl:   'p-8'  //  32 px
```

### Tailles (prop `size` des composants interactifs)

```ts
sm: 'px-3 py-1.5 text-sm  h-8'   // 32 px
md: 'px-4 py-2   text-base h-10' // 40 px (défaut)
lg: 'px-6 py-3   text-lg  h-12'  // 48 px
xl: 'px-8 py-4   text-xl  h-14'  // 56 px
```

### Gaps & marges

```ts
gap-2   //  8 px — entre éléments
gap-4   // 16 px — entre groupes
gap-8   // 32 px — entre sections

mt-4    // 16 px — entre éléments
mt-6    // 24 px — entre sous-sections
mt-12   // 48 px — entre sections
```

## Effets visuels

### Bordures

```css
border-2          /* 2 px standard médiéval */
rounded-md        /* 6 px — boutons, inputs */
rounded-lg        /* 8 px — panels, cards, modals */
rounded-full      /* badges, avatars, radios */
```

### Box-shadows

Source : [`tailwind.config.ts`](../tailwind.config.ts).

```ts
'game-inset':     'inset 0 1px 0 rgba(255,255,255,0.4)'  // highlight intérieur clair
'game-inset-red': 'inset 0 1px 0 rgba(255,255,255,0.3)'  // variante danger
'game-pressed':   'inset 0 2px 4px rgba(0,0,0,0.5)'      // état pressé
```

Pour les ombres portées (élévation extérieure), utiliser les classes Tailwind par défaut (`shadow-md`, `shadow-lg`, `shadow-2xl`) ou écrire un `shadow-[...]` arbitraire si vraiment nécessaire. Pas de tokens custom dédiés à l'élévation — l'écosystème Tailwind suffit.

### Dégradés courants

```css
/* Parchemin (CardBanner default, Panel parchment) */
bg-gradient-to-br from-parchment via-kingdom-100 to-kingdom-200

/* Boutons interactifs (effet 3D vertical) */
bg-gradient-to-b from-game-green-light to-game-green-dark
hover:from-game-green-dark hover:to-game-green-dark

/* Headers de panel (dégradé horizontal) */
bg-gradient-to-r from-kingdom-500 to-kingdom-700
```

### Text-shadow

Utilitaire custom : `text-shadow-game` (cf. plugin dans `tailwind.config.ts`). À appliquer aux titres sur fonds colorés pour la lisibilité.

```tsx
<h1 className="font-cinzel text-shadow-game">Titre</h1>
```

### Animations

```ts
keyframes: { shimmer: { ... } }
animation: { shimmer: 'shimmer 2s infinite' }  // utilisé par ProgressBar
```

### Transitions

```css
transition-all       duration-200    /* standard interactif */
transition-all       duration-300    /* modals, toasts */
transition-colors    duration-150    /* hover/focus subtil */
```

## Structure d'un composant

### Architecture

```
src/ui/<categorie>/
├── <Composant>.tsx
├── <SousComposant>.tsx   # si nécessaire
├── README.md             # doc détaillée
└── index.ts              # exports + types
```

### Template CVA

```tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const componentVariants = cva(
  // Classes de base
  [
    'inline-flex items-center justify-center',
    'rounded-md border-2 font-game font-semibold',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      variant: {
        default: ['bg-parchment border-kingdom-700 text-gray-800', 'hover:bg-kingdom-100'],
        success: ['bg-gradient-to-b from-game-green-light to-game-green-dark', 'border-game-green-border', 'text-white'],
        info:    ['bg-gradient-to-b from-game-blue-light to-game-blue-dark',   'border-game-blue-border',  'text-white'],
        warning: ['bg-gradient-to-b from-game-gold-light to-game-gold-dark',   'border-game-gold-border',  'text-gray-800'],
        danger:  ['bg-gradient-to-b from-game-red-light to-game-red-dark',     'border-game-red-border',   'text-white'],
      },
      size: {
        sm: 'px-3 py-1.5 text-sm  h-8',
        md: 'px-4 py-2   text-base h-10',
        lg: 'px-6 py-3   text-lg  h-12',
        xl: 'px-8 py-4   text-xl  h-14',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ComponentProps
  extends HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof componentVariants> {
  loading?: boolean;
}

export const Component = forwardRef<HTMLButtonElement, ComponentProps>(
  ({ variant = 'default', size = 'md', className, children, loading, ...props }, ref) => (
    <button
      ref={ref}
      className={componentVariants({ variant, size, className })}
      disabled={loading}
      {...props}
    >
      {loading ? 'Chargement…' : children}
    </button>
  ),
);
Component.displayName = 'Component';
```

### Props standards

```ts
interface BaseProps {
  variant?:   'default' | 'success' | 'info' | 'warning' | 'danger';
  size?:      'sm' | 'md' | 'lg' | 'xl';
  className?: string;        // toujours accepté pour extensibilité
  disabled?:  boolean;       // si interactif
  children?:  ReactNode;     // si conteneur
}
```

### Helper `cn`

Pour composer `className` proprement, utiliser `@/lib/cn` (wrapper `clsx` + `tailwind-merge`) — déjà testé et utilisé partout dans `src/ui/`.

## Workflow de création

### Avant de créer un nouveau composant

1. **Chercher l'existant** : un composant similaire existe peut-être déjà dans `src/ui/`. Étendre ou réutiliser plutôt que dupliquer.
2. **Définir le scope** : c'est de l'UI primitive (zéro logique métier) ou un composant feature ? Un composant qui lit un store ou appelle une mutation ne va **pas** dans `src/ui/` — il va dans `src/features/<domaine>/`.
3. **Définir variants & tailles** : minimum 5 variants (`default`, `success`, `info`, `warning`, `danger`), 3-4 tailles (`sm`, `md`, `lg`, optionnel `xl`).

### Workflow

1. Créer le dossier `src/ui/<categorie>/`.
2. Écrire `<Composant>.tsx` avec CVA + `forwardRef`.
3. Créer `index.ts` avec les exports (composant + types).
4. Ajouter l'export dans `src/ui/index.ts` (barrel principal).
5. Ajouter au moins 3 exemples dans `src/features/ui-test/UiTestScreen.tsx` (route `/ui-test`).
6. Écrire `README.md` du composant (description, variants, tailles, exemples, props).
7. Mettre à jour `docs/ui-library.md` (tableau des composants).
8. Vérifier : `yarn workspace battleforthecrown-pixi tsc --noEmit` → 0 erreur, et la démo `/ui-test` rend correctement.

## Séparation UI / logique

Règle stricte : `src/ui/` = composants **purs** stateless ou state UI local uniquement (`isOpen`, `isHovered`). Aucun import de `@/stores`, `@/api`, `@/features`. La logique métier vit dans les hooks/services consommateurs (cf. `react-hud.md`).

```tsx
// ❌ Interdit dans src/ui/
import { useResourcesStore } from '@/stores/resources';

// ✅ src/ui/ reçoit des callbacks et data
<Button onClick={onUpgrade} disabled={!canUpgrade}>Améliorer</Button>

// ✅ La logique vit ailleurs
function BuildingPanel({ building }: Props) {
  const { upgrade, canUpgrade } = useUpgradeBuilding(building.id);
  return <Button onClick={upgrade} disabled={!canUpgrade}>Améliorer</Button>;
}
```

Composants qui consomment le store (`HeaderBar`, `ResourceDisplay`, `PopulationIndicator`, `PlayerProfile`) sont dans `src/ui/layout/` car ils sont **transverses** au shell de l'app. Ils restent acceptables ici — voir `react-hud.md` pour la classification stateless transverse vs stateful transverse vs feature-specific.

## Checklist composant terminé

### Code
- [ ] `tsc --noEmit` passe.
- [ ] CVA pour les variants, `forwardRef` pour les refs.
- [ ] Props typées et exportées (`export interface XProps`).
- [ ] `displayName` défini.
- [ ] `className` accepté.

### Style
- [ ] Couleurs via tokens Tailwind (`game-*`, `kingdom-*`, `parchment`) — jamais de hex en dur.
- [ ] Bordures `border-2`, transitions `duration-200`, focus ring visible.
- [ ] État `disabled` géré (`opacity-50 cursor-not-allowed`).
- [ ] Responsive testé (mobile + desktop).

### Structure
- [ ] Dossier dédié `src/ui/<categorie>/`.
- [ ] `index.ts` du composant + ajout dans `src/ui/index.ts` racine.
- [ ] `README.md` du composant.
- [ ] Section dans `UiTestScreen.tsx`.

### Documentation
- [ ] Tableau variants dans le README.
- [ ] Tableau tailles dans le README.
- [ ] Exemples (5-10) y compris contextuels jeu.
- [ ] Tableau composants de [`ui-library.md`](./ui-library.md) mis à jour.

## Ressources

- Tailwind CSS : <https://tailwindcss.com/docs>
- CVA : <https://cva.style/docs>
- Lucide React (icônes) : <https://lucide.dev/>
- React `forwardRef` : <https://react.dev/reference/react/forwardRef>
