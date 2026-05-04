# Tooltip

Info-bulle stylisée qui apparaît au survol, avec 4 positions et délai configurable.

## Variants

| Variant   | Couleur      | Usage recommandé                 |
|-----------|--------------|----------------------------------|
| `default` | Marron       | Tooltip standard                 |
| `dark`    | Gris foncé   | Mode sombre                      |
| `success` | Vert         | Information positive             |
| `error`   | Rouge        | Avertissement ou erreur          |
| `info`    | Bleu         | Information neutre               |

## Positions

| Position | Description                        |
|----------|------------------------------------|
| `top`    | Au-dessus de l'élément (défaut)   |
| `bottom` | En-dessous de l'élément            |
| `left`   | À gauche de l'élément              |
| `right`  | À droite de l'élément              |

## Exemple d'utilisation

```tsx
import { Tooltip, IconButton } from '@/ui';
import { Info } from 'lucide-react';

// Tooltip simple
<Tooltip content="Cliquez pour plus d'informations">
  <IconButton icon={Info} variant="info" label="Info" />
</Tooltip>

// Tooltip avec position
<Tooltip content="Caserne niveau 5" position="right" variant="default">
  <span className="cursor-help">⚔️ Caserne</span>
</Tooltip>

// Tooltip avec délai personnalisé
<Tooltip content="Chargement..." delay={500} variant="dark">
  <button>Survolez-moi</button>
</Tooltip>

// Tooltip avec contenu riche
<Tooltip 
  content={
    <div>
      <strong>Château</strong>
      <div>Niveau 3 → 4</div>
      <div>Coût: 5000 Or</div>
    </div>
  }
  position="top"
  variant="info"
>
  <span className="cursor-help">🏰</span>
</Tooltip>
```

### Avec IconButton

```tsx
import { Tooltip, IconButton } from '@/ui';
import { Settings, Trash2, Info, HelpCircle } from 'lucide-react';

<div className="flex gap-2">
  <Tooltip content="Paramètres" position="top">
    <IconButton icon={Settings} variant="info" label="Paramètres" />
  </Tooltip>
  
  <Tooltip content="Supprimer" position="top" variant="error">
    <IconButton icon={Trash2} variant="danger" label="Supprimer" />
  </Tooltip>
  
  <Tooltip content="Aide disponible" position="bottom" variant="success">
    <IconButton icon={HelpCircle} variant="success" label="Aide" />
  </Tooltip>
</div>
```

### Dans un contexte de jeu

```tsx
import { Tooltip, Button } from '@/ui';

// Bâtiment avec infos
<Tooltip 
  content="Caserne Niv.5 - Production: 2 unités/h"
  position="top"
  variant="default"
>
  <div className="building-slot">
    <img src="/barracks.png" alt="Caserne" />
  </div>
</Tooltip>

// Ressource avec détails
<Tooltip 
  content={
    <div className="text-center">
      <div className="font-bold">Bois</div>
      <div>8.500 / 10.000</div>
      <div className="text-xs">+120 / heure</div>
    </div>
  }
  position="bottom"
  variant="success"
>
  <div className="resource-icon">🪵</div>
</Tooltip>

// Action avec description
<Tooltip 
  content="Améliorer le château augmente la capacité de stockage"
  position="right"
  variant="info"
>
  <Button variant="warning">Améliorer</Button>
</Tooltip>
```

> **Voir la démo :** `/ui-test` pour tous les variants et positions en action.

## Props

```ts
interface TooltipProps {
  children: ReactNode;                // Élément qui déclenche le tooltip
  content: string | ReactNode;        // Contenu du tooltip (texte ou JSX)
  variant?: 'default' | 'dark' | 'success' | 'error' | 'info';
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;                     // Délai en ms avant affichage (défaut: 200)
}
```

## Caractéristiques

- ✅ **Flèche directionnelle** : Pointe vers l'élément survolé
- ✅ **Alignement intelligent** : Ajuste la flèche même en cas de repositionnement
- ✅ **4 positions** : top, bottom, left, right
- ✅ **Délai configurable** : Évite l'affichage accidentel
- ✅ **Contenu flexible** : Texte simple ou JSX complexe
- ✅ **Transition smooth** : Fade in/out 200ms
- ✅ **Dégradés médiévaux** : Cohérent avec le thème
- ✅ **Bordure colorée** : Bordure 2px selon le variant
- ✅ **Z-index élevé** : Toujours au-dessus (`z-[9999]`)
- ✅ **Whitespace nowrap** : Pas de retour à la ligne (texte simple)
- ✅ **Repositionnement dynamique** : Recalcule sur `scroll` et `resize`
- ✅ **Gestion des bords** : Reste dans la fenêtre même près des limites

## Bonnes pratiques

- Utiliser sur des éléments avec `cursor-help` ou `cursor-pointer`
- Garder le contenu concis (max 2-3 lignes)
- Privilégier `variant="default"` pour cohérence médiévale
- Utiliser `position="top"` par défaut (moins intrusif)
- Augmenter le `delay` (500ms) pour éviter l'affichage accidentel
- Combiner avec IconButton pour des actions claires
- Éviter sur mobile (pas de hover) - prévoir une alternative
- Pour contenu riche, limiter la largeur avec CSS
- Ne pas mettre d'éléments interactifs dans le tooltip

## Limitations

- Pas de support mobile/touch (hover uniquement)
- `whitespace-nowrap` désactivé si contenu JSX complexe
