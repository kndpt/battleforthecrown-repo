# Badge

Indicateur compact de nombre, statut ou notification avec design médiéval.

## Variants

| Variant   | Couleur      | Usage recommandé                    |
|-----------|--------------|-------------------------------------|
| `default` | Marron       | Badge standard, niveau               |
| `success` | Vert         | Compteur positif, ressources pleines |
| `error`   | Rouge        | Alerte, ressources faibles           |
| `warning` | Gold         | Attention, notification importante   |
| `info`    | Bleu         | Information neutre                   |
| `neutral` | Gris pierre  | Badge désactivé ou neutre            |

## Tailles

| Size | Dimensions       | Texte        |
|------|------------------|--------------|
| `sm` | `min-18px h-18px`| `10px`       |
| `md` | `min-22px h-22px`| `12px`       |
| `lg` | `min-28px h-28px`| `14px`       |

## Exemple d'utilisation

```tsx
import { Badge } from '@/ui';

// Badge simple avec nombre
<Badge variant="error">5</Badge>

// Badge avec texte
<Badge variant="success" size="lg">MAX</Badge>

// Badge sur un élément (notification)
<div className="relative">
  <IconButton icon={Bell} variant="info" label="Notifications" />
  <Badge 
    variant="error" 
    size="sm"
    className="absolute -top-1 -right-1"
  >
    3
  </Badge>
</div>

// Badge de niveau
<div className="flex items-center gap-2">
  <span>Château</span>
  <Badge variant="warning">Niv. 5</Badge>
</div>
```

### Badge de ressources

```tsx
import { Badge } from '@/ui';

// Stockage de ressources
<div className="flex items-center gap-2">
  <span className="text-2xl">🪵</span>
  <span className="font-game">8.500 / 10.000</span>
  <Badge variant="success" size="sm">85%</Badge>
</div>

// Ressource faible
<div className="flex items-center gap-2">
  <span className="text-2xl">💰</span>
  <span className="font-game">1.200 / 8.000</span>
  <Badge variant="error" size="sm">15%</Badge>
</div>

// Ressource en production
<div className="flex items-center gap-2">
  <span className="text-2xl">🪨</span>
  <span className="font-game">Pierre</span>
  <Badge variant="info" size="md">+80/h</Badge>
</div>
```

### Badge de notifications

```tsx
import { Badge, IconButton } from '@/ui';
import { Bell, Mail, Shield } from 'lucide-react';

// Badge de notification sur un bouton
<div className="relative inline-block">
  <IconButton icon={Bell} variant="info" label="Notifications" />
  <Badge 
    variant="error" 
    size="sm"
    className="absolute -top-1 -right-1"
  >
    12
  </Badge>
</div>

// Badge sans nombre (dot)
<div className="relative inline-block">
  <IconButton icon={Mail} variant="info" label="Messages" />
  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
</div>

// Badge de statut
<div className="flex items-center gap-2">
  <Shield className="text-game-green-dark" />
  <span>Défenses</span>
  <Badge variant="success" size="sm">ACTIF</Badge>
</div>
```

### Badge dans une liste

```tsx
import { Badge } from '@/ui';

// Liste de bâtiments avec niveaux
<ul className="space-y-2">
  <li className="flex items-center justify-between">
    <span>🏰 Château</span>
    <Badge variant="info">Niv. 3</Badge>
  </li>
  <li className="flex items-center justify-between">
    <span>⚔️ Caserne</span>
    <Badge variant="warning">Niv. 5</Badge>
  </li>
  <li className="flex items-center justify-between">
    <span>🌾 Ferme</span>
    <Badge variant="success">MAX</Badge>
  </li>
</ul>

// Liste de troupes avec compteurs
<ul className="space-y-2">
  <li className="flex items-center justify-between">
    <span>Guerrier</span>
    <Badge variant="success" size="lg">42</Badge>
  </li>
  <li className="flex items-center justify-between">
    <span>Archer</span>
    <Badge variant="info" size="lg">28</Badge>
  </li>
  <li className="flex items-center justify-between">
    <span>Chevalier</span>
    <Badge variant="error" size="lg">3</Badge>
  </li>
</ul>
```

> **Voir la démo :** `/ui-test` pour tous les variants et tailles en action.

## Props

```ts
interface BadgeProps {
  children: ReactNode;           // Contenu du badge (nombre ou texte court)
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;            // Classes supplémentaires (ex: positioning)
}
```

## Caractéristiques

- ✅ **Forme circulaire** : Design compact avec rounded-full
- ✅ **Dégradés médiévaux** : Cohérent avec le thème
- ✅ **Bordure 2px** : Contour coloré pour définition
- ✅ **Text-shadow** : Lisibilité optimale du texte
- ✅ **Min-width** : S'adapte au contenu (1 ou 2+ chiffres)
- ✅ **6 variants** : Couvre tous les cas d'usage
- ✅ **Positionnement flexible** : Utilisable avec absolute

## Bonnes pratiques

- Garder le contenu court (1-3 caractères idéalement)
- Utiliser `variant="error"` pour les compteurs critiques (< 20%)
- Utiliser `variant="success"` pour les compteurs élevés (> 80%)
- Utiliser `variant="warning"` pour les niveaux/rangs importants
- Positionner avec `absolute` + `top/right/bottom/left` pour overlays
- Combiner avec `IconButton` pour afficher des notifications
- Privilégier `size="sm"` pour les badges de notification
- Utiliser `size="lg"` pour les compteurs de ressources principaux
- Éviter les textes longs (max 4-5 caractères)
- Pour les très grands nombres, utiliser le format compact (999+, 1K, etc.)

## Exemples de formatage

```tsx
// Nombre simple
<Badge variant="error">{count}</Badge>

// Format compact pour grands nombres
<Badge variant="error">
  {count > 999 ? '999+' : count}
</Badge>

// Pourcentage
<Badge variant="success">
  {Math.round(percentage)}%
</Badge>

// Notation compacte
<Badge variant="info">
  {count > 1000 ? `${(count / 1000).toFixed(1)}K` : count}
</Badge>
```
