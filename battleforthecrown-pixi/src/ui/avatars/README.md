# Avatar

Image de profil circulaire avec design médiéval pour représenter des joueurs, personnages ou entités du jeu.

## Variants

| Variant   | Couleur      | Usage recommandé                    |
|-----------|--------------|-------------------------------------|
| `default` | Marron       | Avatar standard, joueur             |
| `stone`   | Gris pierre  | Avatar inactif ou neutre            |
| `gold`    | Or           | Avatar premium ou VIP               |
| `success` | Vert         | Avatar actif, allié                |
| `info`    | Bleu         | Avatar système, NPC                |
| `danger`  | Rouge        | Avatar ennemi, adversaire          |

## Tailles

| Size  | Dimensions   | Usage recommandé                   |
|-------|--------------|------------------------------------|
| `xs`  | `w-6 h-6`    | Mini avatar (liste compacte)       |
| `sm`  | `w-8 h-8`    | Petit avatar (tableau, sidebar)    |
| `md`  | `w-10 h-10`  | Avatar standard (default)          |
| `lg`  | `w-12 h-12`  | Grand avatar (profil)              |
| `xl`  | `w-16 h-16`  | Très grand avatar (détail)         |
| `2xl` | `w-20 h-20`  | Avatar XL (hero view)              |
| `3xl` | `w-24 h-24`  | Avatar XXL (splash screen)         |

## Exemple d'utilisation

```tsx
import { Avatar } from '@/ui';

// Avatar simple avec fallback automatique
<Avatar alt="Joueur Alpha" />

// Avatar avec image
<Avatar 
  src="/images/player-avatar.jpg" 
  alt="Joueur Alpha" 
/>

// Avatar avec fallback personnalisé
<Avatar 
  src="/images/player-avatar.jpg" 
  alt="Joueur Alpha" 
  fallback="JA" 
  size="lg"
  variant="gold"
/>

// Avatar sans image (fallback only)
<Avatar 
  alt="Chef du village" 
  fallback="CV" 
  variant="success"
  size="xl"
/>
```

### Avatar dans une liste de joueurs

```tsx
import { Avatar } from '@/ui';

// Liste compacte avec petits avatars
<div className="space-y-2">
  <div className="flex items-center gap-3">
    <Avatar size="sm" alt="Roi Arthur" fallback="RA" variant="gold" />
    <div>
      <div className="font-game">Roi Arthur</div>
      <div className="text-xs text-gray-600">Niveau 42</div>
    </div>
  </div>
  <div className="flex items-center gap-3">
    <Avatar size="sm" alt="Chevalier Lancelot" fallback="CL" variant="success" />
    <div>
      <div className="font-game">Chevalier Lancelot</div>
      <div className="text-xs text-gray-600">Niveau 38</div>
    </div>
  </div>
</div>

// Liste avec avatars moyens
<div className="grid grid-cols-3 gap-4">
  <div className="text-center">
    <Avatar size="lg" alt="Guerrier" fallback="GU" variant="danger" />
    <div className="mt-2 text-sm font-game">Guerrier</div>
  </div>
  <div className="text-center">
    <Avatar size="lg" alt="Archer" fallback="AR" variant="info" />
    <div className="mt-2 text-sm font-game">Archer</div>
  </div>
  <div className="text-center">
    <Avatar size="lg" alt="Mage" fallback="MA" variant="default" />
    <div className="mt-2 text-sm font-game">Mage</div>
  </div>
</div>
```

### Avatar avec statut

```tsx
import { Avatar, Badge } from '@/ui';

// Avatar avec badge de statut
<div className="relative inline-block">
  <Avatar 
    size="lg" 
    src="/images/player.jpg" 
    alt="Joueur en ligne" 
    variant="success"
  />
  <Badge 
    variant="success" 
    size="sm"
    className="absolute bottom-0 right-0 border-2 border-white"
  >
    •
  </Badge>
</div>

// Avatar avec niveau
<div className="relative inline-block">
  <Avatar 
    size="xl" 
    alt="Héros" 
    fallback="HÉ" 
    variant="gold"
  />
  <Badge 
    variant="warning" 
    size="sm"
    className="absolute -top-1 -right-1"
  >
    15
  </Badge>
</div>
```

### Avatar dans un profil

```tsx
import { Avatar, Card, CardBody } from '@/ui';

// Profil de joueur
<Card variant="parchment" className="max-w-sm">
  <CardBody className="text-center">
    <Avatar 
      size="3xl" 
      src="/images/king-avatar.png" 
      alt="Roi du royaume" 
      fallback="RR" 
      variant="gold"
      className="mx-auto mb-4"
    />
    <h3 className="font-game text-xl mb-2">Roi du Royaume</h3>
    <p className="text-sm text-gray-600 mb-4">
      Souverain du royaume du Nord
    </p>
    <div className="flex justify-around text-sm">
      <div>
        <div className="font-bold">1,234</div>
        <div className="text-xs text-gray-600">Victoires</div>
      </div>
      <div>
        <div className="font-bold">42</div>
        <div className="text-xs text-gray-600">Niveau</div>
      </div>
      <div>
        <div className="font-bold">8</div>
        <div className="text-xs text-gray-600">Villages</div>
      </div>
    </div>
  </CardBody>
</Card>
```

### Avatar de groupe/alliance

```tsx
import { Avatar } from '@/ui';

// Groupe d'avatars compact
<div className="flex -space-x-2">
  <Avatar size="sm" alt="Joueur 1" fallback="J1" variant="success" />
  <Avatar size="sm" alt="Joueur 2" fallback="J2" variant="info" />
  <Avatar size="sm" alt="Joueur 3" fallback="J3" variant="default" />
  <Avatar size="sm" alt="Plus" fallback="+5" variant="stone" />
</div>

// Alliance avec avatar principal
<div className="flex items-center gap-3">
  <Avatar size="md" alt="Alliance Nord" fallback="AN" variant="gold" />
  <div>
    <div className="font-game">Alliance du Nord</div>
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <div className="flex -space-x-1">
        <Avatar size="xs" fallback="1" />
        <Avatar size="xs" fallback="2" />
        <Avatar size="xs" fallback="3" />
      </div>
      <span>12 membres</span>
    </div>
  </div>
</div>
```

### Avatar avec icônes (fallback)

```tsx
import { Avatar } from '@/ui';

// Avatar avec émojis comme fallback
<div className="flex gap-4">
  <Avatar size="lg" fallback="👑" variant="gold" />
  <Avatar size="lg" fallback="⚔️" variant="danger" />
  <Avatar size="lg" fallback="🛡️" variant="info" />
  <Avatar size="lg" fallback="🏰" variant="default" />
</div>

// Avatar avec icônes lucide-react
import { Crown, Sword, Shield, Castle } from 'lucide-react';

<div className="flex gap-4">
  <Avatar size="lg">
    <Crown className="w-6 h-6 text-white" />
  </Avatar>
  <Avatar size="lg" variant="danger">
    <Sword className="w-6 h-6 text-white" />
  </Avatar>
</div>
```

> **Voir la démo :** `/ui-test` pour tous les variants et tailles en action.

## Props

```ts
interface AvatarProps {
  src?: string;                  // URL de l'image
  alt?: string;                  // Texte alternatif (utilisé pour le fallback)
  fallback?: string;             // Texte personnalisé quand l'image n'est pas disponible
  variant?: 'default' | 'stone' | 'gold' | 'success' | 'info' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;            // Classes supplémentaires
}
```

## Caractéristiques

- ✅ **Fallback automatique** : Affiche les 2 premières lettres de `alt` ou `fallback`
- ✅ **Dégradés médiévaux** : Cohérent avec le thème du jeu
- ✅ **Bordure 2px** : Contour coloré pour définition
- ✅ **Image responsive** : `object-cover` pour un rendu optimal
- ✅ **Gestion d'erreur** : Affiche le fallback si l'image ne charge pas
- ✅ **6 variants** : Couvre tous les types d'entités du jeu
- ✅ **7 tailles** : Du mini avatar (24px) au XL (96px)
- ✅ **Composabilité** : Peut contenir des icônes ou autres éléments

## Bonnes pratiques

- Utiliser des images carrées pour un rendu optimal
- Privilégier `alt` descriptif pour l'accessibilité
- Utiliser `fallback` pour personnaliser le texte affiché
- `variant="gold"` pour les joueurs premium ou VIP
- `variant="success"` pour les alliés ou joueurs actifs
- `variant="danger"` pour les ennemis ou adversaires
- `variant="info"` pour les NPCs ou éléments système
- `size="xs"` à `sm` pour les listes compactes
- `size="md"` à `lg` pour les profils standards
- `size="xl"` et plus pour les vues détaillées
- Combiner avec `Badge` pour afficher le niveau ou statut

## Gestion des images

```tsx
// Avec URL absolue
<Avatar 
  src="https://example.com/avatar.jpg" 
  alt="Joueur" 
/>

// Avec import d'image locale
import playerAvatar from '@/assets/avatars/player.jpg';

<Avatar 
  src={playerAvatar} 
  alt="Joueur" 
/>

// Avec fallback personnalisé
<Avatar 
  src={invalidUrl} 
  alt="Joueur Alpha" 
  fallback="JA" 
  // Affichera "JA" si l'image ne charge pas
/>
```

## Accessibilité

- L'attribut `alt` est toujours requis pour l'accessibilité
- Le fallback utilise les 2 premières lettres pour l'identification
- Les couleurs de variant respectent les contrastes WCAG
- Supporte `forwardRef` pour l'intégration avec des bibliothèques d'accessibilité
