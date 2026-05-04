# Buttons

Composants de boutons avec effet 3D et variants de couleur style Clash of Clans.

## Composants

- **`Button`** : Bouton principal avec texte
- **`IconButton`** : Bouton circulaire avec icône uniquement

---

## Button

Bouton principal avec effet 3D et variants de couleur.

## Variants

| Variant   | Couleur | Usage recommandé                  |
|-----------|---------|-----------------------------------|
| `success` | Vert    | Actions positives (OK, Valider)   |
| `info`    | Bleu    | Actions d'information (Accepter)  |
| `danger`  | Rouge   | Actions dangereuses (Non, Annuler)|
| `warning` | Gold    | Actions d'avertissement           |
| `neutral` | Stone   | Actions neutres                   |

## Tailles

| Size | Padding       | Texte       |
|------|---------------|-------------|
| `sm` | `px-4 py-2`   | `text-sm`   |
| `md` | `px-6 py-2.5` | `text-base` |
| `lg` | `px-8 py-3`   | `text-lg`   |
| `xl` | `px-10 py-4`  | `text-xl`   |

## Exemple d'utilisation

```tsx
import { Button } from '@/ui';

<Button variant="success" size="md" onClick={handleClick}>
  Confirmer
</Button>
```

> **Voir la démo :** `/ui-test` pour tous les variants et tailles en action.

## Props

```ts
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'success' | 'info' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
}
```

## Caractéristiques

- ✅ **Effet 3D** : Dégradé de couleur avec ombre interne
- ✅ **Animation au clic** : Déplacement vers le bas + ombre pressée
- ✅ **Hover** : Augmentation de luminosité
- ✅ **État désactivé** : Opacité réduite + curseur non autorisé
- ✅ **Accessibilité** : Support `forwardRef`, spread des props HTML natives

## Bonnes pratiques

- Utiliser `variant="success"` pour les actions positives principales
- Privilégier `variant="danger"` pour les actions irréversibles
- Adapter la taille au contexte (lg/xl pour les CTAs principaux, sm pour les actions secondaires)

---

## IconButton

Bouton circulaire avec icône uniquement, parfait pour les actions rapides et les interfaces compactes.

### Variants

Identiques à `Button` : `success`, `info`, `danger`, `warning`, `neutral`

### Tailles

| Size | Dimensions | Icône |
|------|------------|-------|
| `sm` | `32x32px`  | 14px  |
| `md` | `40x40px`  | 18px  |
| `lg` | `48x48px`  | 22px  |
| `xl` | `56x56px`  | 26px  |

### Exemple d'utilisation

```tsx
import { IconButton } from '@/ui';
import { Plus, Trash2, Settings, X } from 'lucide-react';

// Bouton d'ajout
<IconButton 
  icon={Plus} 
  variant="success" 
  label="Ajouter" 
  onClick={handleAdd}
/>

// Bouton de suppression
<IconButton 
  icon={Trash2} 
  variant="danger" 
  size="sm"
  label="Supprimer" 
  onClick={handleDelete}
/>

// Bouton de paramètres
<IconButton 
  icon={Settings} 
  variant="info" 
  label="Paramètres"
/>

// Bouton de fermeture
<IconButton 
  icon={X} 
  variant="neutral" 
  size="lg"
  label="Fermer"
/>
```

> **Voir la démo :** `/ui-test` pour tous les variants et tailles en action.

### Props

```ts
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;                 // Icône de lucide-react
  variant?: 'success' | 'info' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;                   // Aria-label et title pour accessibilité
  className?: string;
}
```

### Caractéristiques

- ✅ **Forme circulaire** : Design compact et moderne
- ✅ **Icônes lucide-react** : Large bibliothèque d'icônes cohérentes
- ✅ **Tailles adaptées** : Taille d'icône proportionnelle au bouton
- ✅ **Effet 3D** : Même style que Button (dégradé + ombre)
- ✅ **Animation au clic** : Déplacement vers le bas + ombre pressée
- ✅ **Accessibilité** : Support `aria-label` et `title` obligatoire

### Bonnes pratiques

- **Toujours** fournir un `label` pour l'accessibilité
- Utiliser pour les actions simples et reconnaissables (ajouter, supprimer, fermer)
- Privilégier `size="sm"` pour les barres d'outils
- Utiliser `size="lg"` ou `xl` pour les actions principales (bouton flottant)
- Combiner avec un Tooltip pour clarifier l'action
