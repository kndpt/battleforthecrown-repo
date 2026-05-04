# Select

Menu déroulant stylisé avec effet médiéval et icône chevron intégrée.

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
  { value: 'farm', label: 'Ferme' },
];

<Select
  variant="parchment"
  size="md"
  options={buildingOptions}
  placeholder="Sélectionner un bâtiment"
  onChange={(e) => console.log(e.target.value)}
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
    { value: 'farm', label: 'Ferme' },
    { value: 'warehouse', label: 'Entrepôt' },
  ];

  return (
    <Select
      variant="parchment"
      size="md"
      options={options}
      placeholder="Choisir un bâtiment"
      value={building}
      onChange={(e) => setBuilding(e.target.value)}
    />
  );
}
```

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
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'parchment' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}
```

## Caractéristiques

- ✅ **Icône chevron** : ChevronDown de lucide-react intégré automatiquement
- ✅ **Dégradés subtils** : Fond avec gradient pour effet de profondeur
- ✅ **Bordure médiévale** : Bordure 2px avec couleur thématique
- ✅ **Hover & Focus** : États interactifs avec ring sur focus
- ✅ **État désactivé** : Opacité réduite + curseur non autorisé
- ✅ **Accessibilité** : Support `forwardRef`, spread des props HTML natives
- ✅ **Placeholder** : Option placeholder optionnelle disabled

## Bonnes pratiques

- Toujours fournir un tableau `options` avec `value` et `label`
- Utiliser `variant="parchment"` pour cohérence avec le thème médiéval
- Combiner avec `InputLabel` pour améliorer l'accessibilité
- Ajouter un `placeholder` pour guider l'utilisateur
- Utiliser `success` ou `info` pour indiquer un état de validation
- Privilégier `size="md"` pour la plupart des formulaires
- Limiter le nombre d'options (max 10-15 pour UX optimale)

## Limitations

- Pas de support multi-sélection (utiliser une checkbox list à la place)
- Pas de recherche intégrée (pour cela, créer un composant Autocomplete)
- Style natif du dropdown (impossible de styliser avec CSS uniquement)
