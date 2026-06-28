# Select

Menu déroulant **entièrement custom** (listbox), thème médiéval. Le bouton déclencheur
et le popup d'options sont rendus par React — **aucun `<select>`/`<option>` natif**, donc
le dropdown OS gris ne ressort jamais. Le popup est monté en portal (`fixed`, `z-[9999]`)
pour ne pas être clippé par un parent `overflow-hidden` (ex. modales).

## Variants

| Variant     | Couleur      | Usage recommandé                    |
|-------------|--------------|-------------------------------------|
| `default`   | Blanc/Gris   | Sélection standard                  |
| `parchment` | Parchemin    | Contexte médiéval (bâtiments, etc.) |
| `success`   | Vert clair   | Sélection positive validée          |
| `info`      | Bleu clair   | Sélection informative               |

## Tailles

| Size | Padding       | Texte       |
|------|---------------|-------------|
| `sm` | `px-3 py-1.5` | `text-sm`   |
| `md` | `px-4 py-2`   | `text-base` |
| `lg` | `px-5 py-2.5` | `text-lg`   |

## Exemple d'utilisation

```tsx
import { Select } from '@/ui';

const buildingOptions = [
  { value: 'castle', label: 'Château' },
  { value: 'barracks', label: 'Caserne' },
  { value: 'quarter', label: 'Quartier' },
];

<Select
  variant="parchment"
  size="md"
  options={buildingOptions}
  placeholder="Sélectionner un bâtiment"
  onValueChange={(value) => console.log(value)}
/>
```

### Avec state management

```tsx
import { Select } from '@/ui';
import { useState } from 'react';

export default function BuildingSelector() {
  const [building, setBuilding] = useState('');

  const options = [
    { value: 'castle', label: 'Château' },
    { value: 'barracks', label: 'Caserne' },
    { value: 'quarter', label: 'Quartier' },
    { value: 'warehouse', label: 'Entrepôt' },
  ];

  return (
    <Select
      variant="parchment"
      size="md"
      options={options}
      placeholder="Choisir un bâtiment"
      value={building}
      onValueChange={setBuilding}
    />
  );
}
```

> Contrôlé via `value` + `onValueChange`. Sans `value`, le composant est non contrôlé
> et accepte `defaultValue`.

### Avec InputLabel et InputHelperText

```tsx
import { Select, InputLabel, InputHelperText } from '@/ui';

<div className="space-y-1">
  <InputLabel htmlFor="building-select">
    Type de bâtiment
  </InputLabel>
  <Select
    id="building-select"
    variant="default"
    options={buildingOptions}
    placeholder="Sélectionner..."
  />
  <InputHelperText variant="default">
    Choisissez le bâtiment à améliorer
  </InputHelperText>
</div>
```

> **Voir la démo :** `/ui-test` pour tous les variants et tailles en action.

## Props

```ts
interface SelectProps {
  variant?: 'default' | 'parchment' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
  options: Array<{ value: string; label: string }>;
  value?: string;            // contrôlé
  defaultValue?: string;     // non contrôlé
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;             // ajoute un input caché pour soumission de form native
  className?: string;        // mergé sur le bouton déclencheur
  'aria-label'?: string;
}
```

## Caractéristiques

- ✅ **100% custom** : popup React stylé, jamais le dropdown natif OS
- ✅ **Portal `fixed`** : jamais clippé par un parent `overflow-hidden` (modales), flip auto haut/bas selon la place
- ✅ **Clavier** : `↑/↓`, `Home/End`, `Enter`/`Espace`, `Échap`, fermeture sur `Tab`
- ✅ **Accessibilité** : `role="combobox"/"listbox"/"option"`, `aria-expanded`, `aria-selected`
- ✅ **Coche** : option sélectionnée marquée d'un `Check`
- ✅ **Icône chevron** : `ChevronDown` qui pivote à l'ouverture
- ✅ **État désactivé** : opacité réduite + curseur non autorisé

## Bonnes pratiques

- Toujours fournir un tableau `options` avec `value` et `label`
- Utiliser `variant="parchment"` pour cohérence avec le thème médiéval
- Combiner avec `InputLabel` pour améliorer l'accessibilité
- Ajouter un `placeholder` pour guider l'utilisateur
- Limiter le nombre d'options (popup scrollable au-delà, `max-height` ~240px)

## Limitations

- Pas de support multi-sélection (utiliser une checkbox list à la place)
- Pas de recherche intégrée (pour cela, créer un composant Autocomplete)
