# ProgressBar

Barre de progression stylisée pour afficher l'avancement de constructions, recherches ou autres processus dans le jeu.

## Variants

| Variant   | Couleur      | Usage recommandé                      |
|-----------|--------------|---------------------------------------|
| `default` | Gris pierre  | Barres génériques                     |
| `success` | Vert         | Constructions, améliorations réussies |
| `info`    | Bleu         | Recherches, processus d'information   |
| `warning` | Gold         | Avertissements, ressources faibles    |
| `danger`  | Rouge        | Actions critiques, santé faible       |

## Tailles

| Size | Hauteur | Usage                        |
|------|---------|------------------------------|
| `sm` | `h-4`   | Barres compactes, listes     |
| `md` | `h-6`   | Barres standards (défaut)    |
| `lg` | `h-8`   | Barres importantes, détails  |

## Exemples d'utilisation

```tsx
import { ProgressBar } from '@/ui';

// Barre simple avec pourcentage
<ProgressBar value={65} showPercentage variant="success" />

// Barre avec label personnalisé
<ProgressBar 
  value={30} 
  label="Construction en cours..." 
  variant="info"
  size="lg"
/>

// Barre animée (shimmer effect)
<ProgressBar 
  value={45} 
  showPercentage 
  animated 
  variant="warning"
/>

// Exemple complet dans un contexte
<div className="space-y-2">
  <p className="font-game text-sm text-gray-700">
    Amélioration du Château
  </p>
  <ProgressBar 
    value={75} 
    label="5:30 restantes"
    variant="success"
    animated
  />
</div>
```

> **Voir la démo :** `/ui-test` pour tous les variants et animations en action.

## Props

```ts
interface ProgressBarProps {
  value: number;                    // 0-100 (clamped automatiquement)
  variant?: 'default' | 'success' | 'info' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label?: string;                   // Label personnalisé (remplace le %)
  showPercentage?: boolean;         // Afficher le pourcentage (défaut: false)
  animated?: boolean;               // Activer l'animation shimmer (défaut: false)
  className?: string;
}
```

## Caractéristiques

- ✅ **Effet 3D** : Bordure épaisse + ombre interne pour effet "enfoncé"
- ✅ **Dégradés** : Fond sombre + fill coloré avec dégradé horizontal
- ✅ **Animation shimmer** : Effet de brillance qui traverse la barre (activable)
- ✅ **Transition fluide** : Animation de 500ms sur le changement de valeur
- ✅ **Clamping automatique** : La valeur est automatiquement limitée entre 0 et 100
- ✅ **Label flexible** : Afficher un pourcentage ou un label personnalisé (temps, texte)

## Bonnes pratiques

- Utiliser `animated={true}` pour les processus en cours (construction, recherche)
- Privilégier `showPercentage` pour les barres simples sans contexte
- Utiliser `label` pour afficher un temps restant ou un statut textuel
- Adapter le `variant` au contexte (success pour construction, warning pour ressources)
- Utiliser `size="lg"` pour les barres importantes dans une vue détaillée
- Combiner avec un texte explicatif au-dessus de la barre pour plus de clarté
