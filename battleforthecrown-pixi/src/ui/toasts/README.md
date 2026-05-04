# Toast

Système de notifications temporaires avec auto-dismiss et positionnement configurable.

## Variants

| Variant   | Couleur | Icône          | Usage recommandé                   |
|-----------|---------|----------------|-----------------------------------|
| `success` | Vert    | CheckCircle    | Action réussie                     |
| `error`   | Rouge   | AlertCircle    | Erreur, action échouée             |
| `warning` | Gold    | AlertTriangle  | Avertissement important            |
| `info`    | Bleu    | Info           | Information neutre                 |
| `default` | Marron  | Info           | Notification standard              |

## Positions

| Position        | Description                  |
|-----------------|------------------------------|
| `top-right`     | Coin supérieur droit (défaut)|
| `top-left`      | Coin supérieur gauche        |
| `bottom-right`  | Coin inférieur droit         |
| `bottom-left`   | Coin inférieur gauche        |

## Installation

### 1. Wrap your app with ToastProvider

```tsx
// app/layout.tsx or pages/_app.tsx
import { ToastProvider } from '@/ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider position="top-right">
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
```

### 2. Use the `useToast` hook

```tsx
'use client';

import { useToast } from '@/ui';
import { Button } from '@/ui';

export default function MyComponent() {
  const { addToast } = useToast();

  const showSuccess = () => {
    addToast({
      variant: 'success',
      title: 'Succès !',
      message: 'Bâtiment amélioré avec succès',
      duration: 3000,
    });
  };

  return <Button onClick={showSuccess}>Améliorer</Button>;
}
```

## Exemples d'utilisation

### Toast simple

```tsx
import { useToast } from '@/ui';

const { addToast } = useToast();

// Toast de succès
addToast({
  variant: 'success',
  message: 'Ressources collectées !',
});

// Toast d'erreur
addToast({
  variant: 'error',
  message: 'Ressources insuffisantes',
});

// Toast avec titre
addToast({
  variant: 'info',
  title: 'Nouvelle mise à jour',
  message: 'Le jeu a été mis à jour vers la version 2.0',
  duration: 5000,
});
```

### Toast de jeu

```tsx
import { useToast, Button } from '@/ui';

export default function GameActions() {
  const { addToast } = useToast();

  const upgradeBuilding = () => {
    // Simulation d'amélioration
    setTimeout(() => {
      addToast({
        variant: 'success',
        title: 'Amélioration terminée',
        message: 'Votre château est maintenant niveau 4 !',
        duration: 4000,
      });
    }, 2000);
  };

  const collectResources = () => {
    addToast({
      variant: 'success',
      title: 'Ressources collectées',
      message: '+1.200 Bois, +800 Pierre, +500 Or',
      duration: 3000,
    });
  };

  const attackFailed = () => {
    addToast({
      variant: 'error',
      title: 'Attaque échouée',
      message: 'Vos troupes ont été vaincues',
      duration: 5000,
    });
  };

  const lowResources = () => {
    addToast({
      variant: 'warning',
      title: 'Ressources faibles',
      message: 'Or : 15% - Pensez à collecter',
      duration: 6000,
    });
  };

  return (
    <div className="flex gap-2">
      <Button onClick={upgradeBuilding} variant="success">
        Améliorer
      </Button>
      <Button onClick={collectResources} variant="info">
        Collecter
      </Button>
      <Button onClick={attackFailed} variant="danger">
        Attaquer
      </Button>
      <Button onClick={lowResources} variant="warning">
        Alerte
      </Button>
    </div>
  );
}
```

### Toast avec contenu JSX

```tsx
import { useToast } from '@/ui';

const { addToast } = useToast();

addToast({
  variant: 'info',
  title: 'Nouvelle troupe disponible',
  message: (
    <div>
      <p>Le <strong>Chevalier</strong> est maintenant disponible !</p>
      <p className="text-xs mt-1">Coût : 150 Or | Formation : 10 min</p>
    </div>
  ),
  duration: 8000,
});
```

### Toast persistant (sans auto-dismiss)

```tsx
import { useToast } from '@/ui';

const { addToast } = useToast();

addToast({
  variant: 'error',
  title: 'Action requise',
  message: 'Votre village est attaqué !',
  duration: 0, // Ne se ferme pas automatiquement
});
```

> **Voir la démo :** `/ui-test` pour tous les variants et positions en action.

## Props

### ToastProvider

```ts
interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'; // défaut: 'top-right'
}
```

### useToast hook

```ts
interface UseToastReturn {
  addToast: (toast: {
    variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
    title?: string;
    message: string | ReactNode;
    duration?: number; // en ms, défaut: 5000 (0 = persistant)
  }) => void;
  removeToast: (id: string) => void;
}
```

## Caractéristiques

- ✅ **Auto-dismiss** : Disparaît automatiquement après la durée définie
- ✅ **Animation** : Slide-in + fade-in smooth
- ✅ **Empilable** : Plusieurs toasts peuvent s'afficher en même temps
- ✅ **Icônes** : Icône lucide-react adaptée au variant
- ✅ **Close button** : Bouton X pour fermer manuellement
- ✅ **Positionnement** : 4 positions disponibles
- ✅ **Contenu flexible** : Texte simple ou JSX
- ✅ **Dégradés médiévaux** : Cohérent avec le thème
- ✅ **Z-index élevé** : Toujours visible (z-100)
- ✅ **Responsive** : min-width 300px, max-width 500px

## Bonnes pratiques

- **Utiliser `variant="success"`** pour les actions réussies (amélioration, collecte)
- **Utiliser `variant="error"`** pour les erreurs bloquantes
- **Utiliser `variant="warning"`** pour les alertes non-critiques (ressources faibles)
- **Utiliser `variant="info"`** pour les informations neutres (nouveautés, tips)
- **Durée recommandée** : 
  - 3000ms pour succès rapide
  - 4000-5000ms pour infos importantes
  - 6000-8000ms pour messages complexes
  - 0ms (persistant) pour alertes critiques
- **Limiter le nombre** de toasts simultanés (max 3-4)
- **Titre court** : 2-4 mots maximum
- **Message concis** : 1-2 lignes idéalement
- **Éviter** les toasts pour des actions mineures répétitives
- **Position top-right** : Standard pour la plupart des apps
- **Position bottom-right** : Si navbar en haut

## Exemple complet dans un jeu

```tsx
'use client';

import { useToast, Button, Card, CardBody } from '@/ui';

export default function VillageDashboard() {
  const { addToast } = useToast();

  const handleBuildingUpgrade = async (buildingName: string, level: number) => {
    // Début
    addToast({
      variant: 'info',
      message: `Amélioration du ${buildingName} en cours...`,
      duration: 2000,
    });

    // Simuler l'amélioration
    setTimeout(() => {
      addToast({
        variant: 'success',
        title: 'Amélioration terminée !',
        message: `${buildingName} niveau ${level} → ${level + 1}`,
        duration: 4000,
      });
    }, 3000);
  };

  const handleResourceCollection = () => {
    const wood = Math.floor(Math.random() * 1000) + 500;
    const stone = Math.floor(Math.random() * 800) + 300;
    const gold = Math.floor(Math.random() * 500) + 100;

    addToast({
      variant: 'success',
      title: 'Ressources collectées',
      message: `+${wood} 🌲  +${stone} 🪨  +${gold} 💰`,
      duration: 3000,
    });
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <h2 className="font-cinzel text-xl">Actions du village</h2>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => handleBuildingUpgrade('Château', 3)}
              variant="warning"
            >
              Améliorer Château
            </Button>
            
            <Button 
              onClick={handleResourceCollection}
              variant="success"
            >
              Collecter ressources
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
```
