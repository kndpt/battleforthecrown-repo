# Spinner

Indicateur de chargement rotatif avec variants colorés et label optionnel.

## Variants

| Variant   | Couleur    | Usage recommandé              |
|-----------|------------|-------------------------------|
| `default` | Marron     | Chargement standard           |
| `success` | Vert       | Opération positive en cours   |
| `error`   | Rouge      | Erreur, retry en cours        |
| `warning` | Gold       | Chargement avec avertissement |
| `info`    | Bleu       | Information en chargement     |
| `neutral` | Gris pierre| Chargement désactivé/inactif  |

## Tailles

| Size | Dimensions | Bordure |
|------|------------|---------|
| `sm` | `16x16px`  | 2px     |
| `md` | `32x32px`  | 4px     |
| `lg` | `48x48px`  | 4px     |
| `xl` | `64x64px`  | 6px     |

## Exemple d'utilisation

```tsx
import { Spinner } from '@/ui';

// Spinner simple
<Spinner />

// Spinner avec variant
<Spinner variant="success" />

// Spinner avec label
<Spinner variant="info" label="Chargement des données..." />

// Spinner de différentes tailles
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />
<Spinner size="xl" />
```

### Dans un bouton

```tsx
import { Spinner, Button } from '@/ui';
import { useState } from 'react';

export default function LoadingButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await someAsyncOperation();
    setIsLoading(false);
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={isLoading}
      variant="success"
    >
      {isLoading ? (
        <>
          <Spinner size="sm" variant="default" />
          <span className="ml-2">Chargement...</span>
        </>
      ) : (
        'Améliorer'
      )}
    </Button>
  );
}
```

### Overlay de chargement

```tsx
import { Spinner } from '@/ui';

export default function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <Spinner 
          size="xl" 
          variant="info" 
          label="Chargement du village..."
        />
      </div>
    </div>
  );
}
```

### Dans une Card

```tsx
import { Spinner, Card, CardBody } from '@/ui';

export default function DataCard({ isLoading, data }: Props) {
  return (
    <Card>
      <CardBody>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner 
              size="lg" 
              variant="default" 
              label="Chargement..."
            />
          </div>
        ) : (
          <div>{data}</div>
        )}
      </CardBody>
    </Card>
  );
}
```

### Spinner centré dans une page

```tsx
import { Spinner } from '@/ui';

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner 
        size="xl" 
        variant="info" 
        label="Chargement de la partie..."
      />
    </div>
  );
}
```

### Spinner inline avec texte

```tsx
import { Spinner } from '@/ui';

<div className="flex items-center gap-2">
  <Spinner size="sm" variant="success" />
  <span>Synchronisation en cours...</span>
</div>
```

> **Voir la démo :** `/ui-test` pour tous les variants et tailles en action.

## Props

```ts
interface SpinnerProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;                // Label affiché sous le spinner
  className?: string;            // Classes supplémentaires
}
```

## Caractéristiques

- ✅ **Animation CSS native** : Utilise `animate-spin` de Tailwind
- ✅ **6 variants colorés** : Adaptés au thème médiéval
- ✅ **4 tailles** : De 16px à 64px
- ✅ **Label optionnel** : Texte explicatif sous le spinner
- ✅ **Accessible** : `role="status"` et `aria-label`
- ✅ **Bordure bicolore** : Crée l'effet de rotation
- ✅ **Inline-flex** : S'intègre facilement dans n'importe quel layout
- ✅ **Léger** : Pas de JavaScript, pure CSS

## Bonnes pratiques

- **Toujours** fournir un label pour les spinners de page/overlay
- **Utiliser `size="sm"`** dans les boutons ou éléments compacts
- **Utiliser `size="xl"`** pour les overlays pleine page
- **Variant `default`** pour la plupart des cas
- **Variant `success`** pour les opérations de validation
- **Variant `error`** pour les retry après erreur
- **Éviter** les spinners sans contexte (toujours expliquer ce qui charge)
- **Combiner** avec un message explicatif pour l'UX
- **Timeout** : Prévoir un fallback si le chargement dépasse 30s
- **Skeleton screens** : Privilégier les skeletons pour le contenu structuré

## Comparaison Spinner vs Skeleton

| Critère               | Spinner                      | Skeleton Screen       |
|-----------------------|------------------------------|-----------------------|
| **Usage**             | Chargement court (< 3s)      | Chargement long       |
| **Contexte**          | Peu de contexte visuel       | Structure visible     |
| **UX**                | Satisfaisant si rapide       | Meilleure perception  |
| **Complexité**        | Simple (1 composant)         | Plus complexe         |

**Recommandation** : Utiliser Spinner pour des actions rapides (< 3s), sinon préférer des skeleton screens.

## Exemple complet dans un jeu

```tsx
'use client';

import { Spinner, Button, Card, CardBody } from '@/ui';
import { useState, useEffect } from 'react';

export default function BuildingUpgrade() {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isUpgrading) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsUpgrading(false);
          return 0;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isUpgrading]);

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h3 className="font-cinzel text-lg">Château - Niveau 3</h3>
          
          {isUpgrading ? (
            <div className="text-center py-8">
              <Spinner 
                size="lg" 
                variant="warning" 
                label={`Amélioration en cours... ${progress}%`}
              />
            </div>
          ) : (
            <Button 
              onClick={() => setIsUpgrading(true)} 
              variant="warning"
            >
              Améliorer au niveau 4
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
```
