# FloatingButton

Bouton flottant qui reste fixe sur l'écran, idéal pour les actions principales et les raccourcis rapides. Supporte deux formes : **rond** (pour n'importe où sur l'écran) et **rectangulaire** (collé sur les côtés).

## Import

```tsx
import { FloatingButton } from '@/ui';
```

## Caractéristiques

✅ Deux formes : ronde (round) et rectangulaire (edge)  
✅ 8 positions prédéfinies sur l'écran  
✅ 5 variants de couleur (default, success, info, warning, danger)  
✅ 4 tailles (sm, md, lg, xl)  
✅ Support des icônes et badges de notification  
✅ Effet 3D avec ombre portée  
✅ Animations hover et active  
✅ Support forwardRef  
✅ Position fixe (reste visible au scroll)  
✅ Coins arrondis adaptatifs selon la position  

---

## Variants

| Variant | Couleur | Usage recommandé |
|---------|---------|------------------|
| `default` | Beige parchemin | Actions neutres |
| `success` | Vert | Actions positives, confirmation |
| `info` | Bleu | Information, aide |
| `warning` | Or/Gold | Attention, avertissement |
| `danger` | Rouge | Actions destructives, urgent |

---

## Shapes (Formes)

| Shape | Description | Usage recommandé |
|-------|-------------|------------------|
| `round` | Bouton circulaire | Actions principales, FAB (Floating Action Button), icônes |
| `edge` | Bouton rectangulaire | File d'attente, notifications, menus latéraux |

---

## Positions

| Position | Description |
|----------|-------------|
| `bottom-right` | Coin inférieur droit (défaut) |
| `bottom-left` | Coin inférieur gauche |
| `top-right` | Coin supérieur droit |
| `top-left` | Coin supérieur gauche |
| `right-center` | Centre du bord droit (collé) |
| `left-center` | Centre du bord gauche (collé) |
| `bottom-center` | Centre du bord inférieur |
| `top-center` | Centre du bord supérieur |

> **Note** : Les positions `right-center` et `left-center` appliquent automatiquement un effet "collé au bord" avec un coin arrondi uniquement du côté opposé.

---

## Tailles

### Round (Circulaire)

| Size | Dimensions | Texte | Usage |
|------|-----------|-------|-------|
| `sm` | 48x48px | 14px | Petit écran, icônes compactes |
| `md` | 56x56px | 16px | Standard (recommandé) |
| `lg` | 64x64px | 18px | Actions importantes |
| `xl` | 80x80px | 20px | Très visible, écrans larges |

### Edge (Rectangulaire)

| Size | Padding | Min Width | Texte | Usage |
|------|---------|-----------|-------|-------|
| `sm` | 12px 8px | 100px | 14px | Compact |
| `md` | 16px 12px | 120px | 16px | Standard |
| `lg` | 24px 16px | 140px | 18px | Bien visible |
| `xl` | 32px 20px | 160px | 20px | Maximum |

---

## Props

```tsx
interface FloatingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'success' | 'info' | 'warning' | 'danger';
  shape?: 'round' | 'edge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: 
    | 'bottom-right' 
    | 'bottom-left' 
    | 'top-right' 
    | 'top-left'
    | 'right-center' 
    | 'left-center'
    | 'bottom-center'
    | 'top-center';
  children: ReactNode;
  icon?: ReactNode;           // Icône (lucide-react recommandé)
  badge?: string | number;    // Badge de notification (ex: "3" ou 3)
  className?: string;
  disabled?: boolean;
}
```

---

## Exemples d'utilisation

### 1. Bouton rond avec icône (FAB classique)

```tsx
import { FloatingButton } from '@/ui';
import { Plus } from 'lucide-react';

<FloatingButton 
  variant="success" 
  shape="round" 
  position="bottom-right"
  icon={<Plus size={24} />}
  onClick={() => console.log('Nouvelle construction')}
/>
```

### 2. Bouton rectangulaire pour file d'attente (collé au bord)

```tsx
import { FloatingButton } from '@/ui';
import { Hammer } from 'lucide-react';

<FloatingButton 
  variant="warning" 
  shape="edge" 
  position="right-center"
  icon={<Hammer size={20} />}
  badge={3}
>
  File d'attente
</FloatingButton>
```

### 3. Bouton rond avec badge de notification

```tsx
import { FloatingButton } from '@/ui';
import { Bell } from 'lucide-react';

<FloatingButton 
  variant="info" 
  shape="round" 
  position="top-right"
  icon={<Bell size={24} />}
  badge={12}
/>
```

### 4. Bouton texte seul (edge)

```tsx
<FloatingButton 
  variant="success" 
  shape="edge" 
  position="bottom-center"
>
  Sauvegarder
</FloatingButton>
```

### 5. Différentes tailles

```tsx
// Petit rond
<FloatingButton 
  variant="info" 
  shape="round" 
  size="sm"
  position="bottom-left"
  icon={<Info size={16} />}
/>

// Grand rectangulaire
<FloatingButton 
  variant="danger" 
  shape="edge" 
  size="xl"
  position="left-center"
>
  Attaque en cours !
</FloatingButton>
```

---

## Exemples contextuels (jeu)

### Bouton d'ajout de construction

```tsx
import { FloatingButton } from '@/ui';
import { Hammer } from 'lucide-react';

const VillageView = () => {
  const handleNewBuilding = () => {
    // Ouvrir le menu de construction
  };

  return (
    <FloatingButton 
      variant="success" 
      shape="round" 
      position="bottom-right"
      icon={<Hammer size={24} />}
      onClick={handleNewBuilding}
    />
  );
};
```

### File d'attente de construction (collée au bord)

```tsx
import { FloatingButton } from '@/ui';
import { Clock } from 'lucide-react';

const BuildingQueue = ({ queueCount }: { queueCount: number }) => {
  return (
    <FloatingButton 
      variant="warning" 
      shape="edge" 
      position="right-center"
      icon={<Clock size={20} />}
      badge={queueCount}
      onClick={() => {/* Ouvrir la file d'attente */}}
    >
      Constructions
    </FloatingButton>
  );
};
```

### Bouton d'attaque urgente

```tsx
import { FloatingButton } from '@/ui';
import { Swords } from 'lucide-react';

const AttackAlert = () => {
  return (
    <FloatingButton 
      variant="danger" 
      shape="round" 
      position="top-right"
      size="lg"
      icon={<Swords size={28} />}
      badge="!"
      onClick={() => {/* Voir l'attaque */}}
    />
  );
};
```

### Menu d'actions latéral

```tsx
import { FloatingButton } from '@/ui';
import { Menu } from 'lucide-react';

<FloatingButton 
  variant="default" 
  shape="edge" 
  position="left-center"
  icon={<Menu size={20} />}
  onClick={() => setMenuOpen(true)}
>
  Menu
</FloatingButton>
```

### Notifications (coin supérieur)

```tsx
import { FloatingButton } from '@/ui';
import { Bell } from 'lucide-react';

<FloatingButton 
  variant="info" 
  shape="round" 
  position="top-right"
  icon={<Bell size={24} />}
  badge={5}
  onClick={() => setNotificationsOpen(true)}
/>
```

---

## Bonnes pratiques

### ✅ À faire

- Utiliser `shape="round"` avec une **icône** pour les actions principales
- Utiliser `shape="edge"` avec **texte + icône** pour les fonctionnalités complexes (file d'attente, notifications groupées)
- Limiter à **2-3 floating buttons** maximum par écran
- Utiliser `position="right-center"` ou `left-center"` pour les boutons "collés" sur les bords
- Utiliser le `badge` pour indiquer un nombre (notifications, file d'attente)
- Utiliser `variant="danger"` pour les alertes urgentes
- Positionner les actions principales en `bottom-right` (convention mobile)

### ❌ À éviter

- ❌ Ne pas surcharger l'écran avec trop de floating buttons (max 3)
- ❌ Ne pas utiliser `shape="round"` avec du texte long
- ❌ Ne pas utiliser `shape="edge"` sans contenu texte ou icône
- ❌ Ne pas placer plusieurs boutons à la même position
- ❌ Ne pas utiliser pour des actions secondaires (préférer les boutons classiques)
- ❌ Ne pas oublier l'accessibilité : toujours fournir un label descriptif

---

## Accessibilité

- ✅ Support `forwardRef` pour le focus programmatique
- ✅ État `disabled` géré visuellement
- ✅ Focus ring visible sur navigation clavier
- ✅ Animations respectueuses (duration 200ms)
- ⚠️ Pensez à ajouter `aria-label` si le bouton contient uniquement une icône

```tsx
<FloatingButton 
  shape="round"
  icon={<Plus size={24} />}
  aria-label="Ajouter une construction"
/>
```

---

## Variantes avancées

### Avec tooltip pour plus d'infos

```tsx
import { FloatingButton } from '@/ui';
import { Tooltip } from '@/ui';
import { HelpCircle } from 'lucide-react';

<Tooltip content="Besoin d'aide ?">
  <FloatingButton 
    variant="info" 
    shape="round" 
    position="bottom-left"
    icon={<HelpCircle size={24} />}
  />
</Tooltip>
```

### État de chargement

```tsx
import { FloatingButton } from '@/ui';
import { Spinner } from '@/ui';

<FloatingButton 
  variant="success" 
  shape="round"
  disabled={isLoading}
  icon={isLoading ? <Spinner size="sm" variant="default" /> : <Plus size={24} />}
/>
```

---

## Comparaison avec Button

| Critère | FloatingButton | Button |
|---------|----------------|--------|
| Position | Fixe sur l'écran | Inline dans le flux |
| Usage | Actions globales, raccourcis | Actions contextuelles |
| Forme | Rond ou rectangulaire | Toujours rectangulaire |
| Visibilité | Toujours visible (scroll) | Défile avec le contenu |

---

## Notes techniques

- **Position fixe** : Le composant utilise `position: fixed` et reste visible lors du scroll
- **z-index** : Défini à `50` pour apparaître au-dessus du contenu
- **Badge** : Positionné en `absolute` en haut à droite du bouton
- **Responsive** : Les tailles sont adaptées pour mobile et desktop
- **Compound variants** : Les coins arrondis s'adaptent selon la position (edge collé au bord)

---

## Version

- **Créé** : 2025-01-06
- **Auteur** : Kelvin Dupont
- **Composant** : FloatingButton
- **Dépendances** : CVA, lucide-react (pour les icônes)
