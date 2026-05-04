# Panel

Panneau de contenu avec bordure, header optionnel, et footer. Parfait pour organiser l'interface en sections distinctes.

## Composants

- **Panel** : Conteneur principal avec variants et padding
- **PanelHeader** : En-tête avec titre et actions optionnelles
- **PanelBody** : Corps du panel avec padding par défaut
- **PanelFooter** : Pied de page pour actions/boutons

## Variants

| Variant     | Couleur       | Usage recommandé                |
|-------------|---------------|---------------------------------|
| `default`   | Beige uni     | Panneau standard                |
| `parchment` | Beige dégradé | Style médiéval (défaut recommandé) |
| `wood`      | Bois sombre   | Panneaux de construction        |
| `stone`     | Gris pierre   | Panneaux de défense             |
| `success`   | Vert          | Confirmation, succès            |
| `info`      | Bleu          | Information, aide               |
| `warning`   | Gold          | Avertissement, attention        |
| `danger`    | Rouge         | Danger, suppression             |

## Padding

| Padding | Espacement    |
|---------|---------------|
| `none`  | Aucun         |
| `sm`    | 12px (0.75rem)|
| `md`    | 16px (1rem)   |
| `lg`    | 24px (1.5rem) |
| `xl`    | 32px (2rem)   |

## Exemple d'utilisation

```tsx
import { Panel, PanelHeader, PanelBody, PanelFooter, Button } from '@/ui';

export default function BuildingPanel() {
  return (
    <Panel variant="parchment">
      <PanelHeader variant="parchment">
        <span>Château - Niveau 3</span>
        <span className="text-sm font-normal">⏱️ 2:30</span>
      </PanelHeader>
      <PanelBody>
        <p>Voulez-vous améliorer le château au niveau 4 ?</p>
        <ul className="mt-2 space-y-1">
          <li>Coût : 5.000 or</li>
          <li>Temps : 10 minutes</li>
        </ul>
      </PanelBody>
      <PanelFooter variant="parchment">
        <Button variant="neutral" size="sm">Annuler</Button>
        <Button variant="warning" size="sm">Améliorer</Button>
      </PanelFooter>
    </Panel>
  );
}
```

### Panel simple

```tsx
import { Panel } from '@/ui';

// Panel basique avec contenu
<Panel variant="parchment">
  <p>Contenu du panel</p>
</Panel>

// Panel avec padding personnalisé
<Panel variant="default" padding="lg">
  <p>Panel avec grand padding</p>
</Panel>

// Panel sans padding
<Panel variant="wood" padding="none">
  <img src="/image.png" alt="Image" />
</Panel>
```

### Panel avec header

```tsx
import { Panel, PanelHeader, PanelBody } from '@/ui';

<Panel variant="parchment" padding="none">
  <PanelHeader variant="parchment" size="md">
    <span>Titre du panel</span>
  </PanelHeader>
  <PanelBody>
    <p>Contenu du panel</p>
  </PanelBody>
</Panel>
```

### Panel avec header et actions

```tsx
import { Panel, PanelHeader, PanelBody, IconButton } from '@/ui';
import { Settings, X } from 'lucide-react';

<Panel variant="info" padding="none">
  <PanelHeader variant="info">
    <span>Paramètres</span>
    <div className="flex gap-2">
      <IconButton icon={Settings} variant="info" size="sm" label="Configurer" />
      <IconButton icon={X} variant="neutral" size="sm" label="Fermer" />
    </div>
  </PanelHeader>
  <PanelBody>
    <p>Configuration du jeu</p>
  </PanelBody>
</Panel>
```

### Panel complet avec footer

```tsx
import { Panel, PanelHeader, PanelBody, PanelFooter, Button } from '@/ui';

<Panel variant="warning" padding="none">
  <PanelHeader variant="warning">
    <span>⚠️ Confirmation requise</span>
  </PanelHeader>
  <PanelBody>
    <p>Êtes-vous sûr de vouloir supprimer ce bâtiment ?</p>
  </PanelBody>
  <PanelFooter variant="warning">
    <Button variant="neutral" size="sm">Annuler</Button>
    <Button variant="danger" size="sm">Supprimer</Button>
  </PanelFooter>
</Panel>
```

### Variants

```tsx
import { Panel, PanelHeader, PanelBody } from '@/ui';

// Default
<Panel variant="default" padding="none">
  <PanelHeader variant="default">Panel Default</PanelHeader>
  <PanelBody>Contenu</PanelBody>
</Panel>

// Parchment (recommandé)
<Panel variant="parchment" padding="none">
  <PanelHeader variant="parchment">Panel Parchment</PanelHeader>
  <PanelBody>Contenu médiéval</PanelBody>
</Panel>

// Wood
<Panel variant="wood" padding="none">
  <PanelHeader variant="wood">Panel Wood</PanelHeader>
  <PanelBody>Bâtiment en bois</PanelBody>
</Panel>

// Stone
<Panel variant="stone" padding="none">
  <PanelHeader variant="stone">Panel Stone</PanelHeader>
  <PanelBody>Fortifications en pierre</PanelBody>
</Panel>

// Success
<Panel variant="success" padding="none">
  <PanelHeader variant="success">Succès !</PanelHeader>
  <PanelBody>Opération réussie</PanelBody>
</Panel>
```

### Panel de statistiques

```tsx
import { Panel, PanelHeader, PanelBody } from '@/ui';

<Panel variant="parchment" padding="none">
  <PanelHeader variant="parchment">
    <span>Statistiques du joueur</span>
  </PanelHeader>
  <PanelBody>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <div className="text-2xl font-bold">🪵 8.500</div>
        <div className="text-sm text-gray-600">Bois</div>
      </div>
      <div>
        <div className="text-2xl font-bold">🪨 3.200</div>
        <div className="text-sm text-gray-600">Pierre</div>
      </div>
      <div>
        <div className="text-2xl font-bold">💰 1.500</div>
        <div className="text-sm text-gray-600">Or</div>
      </div>
      <div>
        <div className="text-2xl font-bold">🍖 12.000</div>
        <div className="text-sm text-gray-600">Nourriture</div>
      </div>
    </div>
  </PanelBody>
</Panel>
```

### Panel de liste

```tsx
import { Panel, PanelHeader, PanelBody, PanelFooter, Button } from '@/ui';

<Panel variant="wood" padding="none">
  <PanelHeader variant="wood">
    <span>Bâtiments disponibles</span>
    <span className="text-sm font-normal">5 / 10</span>
  </PanelHeader>
  <PanelBody>
    <ul className="space-y-2">
      <li className="flex justify-between items-center p-2 bg-white/10 rounded">
        <span>🏰 Château</span>
        <span className="text-sm">Niveau 3</span>
      </li>
      <li className="flex justify-between items-center p-2 bg-white/10 rounded">
        <span>⚔️ Caserne</span>
        <span className="text-sm">Niveau 5</span>
      </li>
      <li className="flex justify-between items-center p-2 bg-white/10 rounded">
        <span>🌾 Ferme</span>
        <span className="text-sm">Niveau 8</span>
      </li>
    </ul>
  </PanelBody>
  <PanelFooter variant="wood">
    <Button variant="success" size="sm">Construire</Button>
  </PanelFooter>
</Panel>
```

### Panel imbriqués

```tsx
import { Panel, PanelHeader, PanelBody } from '@/ui';

<Panel variant="parchment">
  <PanelHeader variant="parchment">Panel parent</PanelHeader>
  <PanelBody>
    <div className="space-y-4">
      <Panel variant="wood" padding="sm">
        <p>Sous-panel 1</p>
      </Panel>
      <Panel variant="stone" padding="sm">
        <p>Sous-panel 2</p>
      </Panel>
    </div>
  </PanelBody>
</Panel>
```

> **Voir la démo :** `/ui-test` pour tous les variants et exemples en action.

## Props

### Panel

```ts
interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'parchment' | 'wood' | 'stone' | 'success' | 'info' | 'warning' | 'danger';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
}
```

### PanelHeader

```ts
interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'parchment' | 'wood' | 'stone' | 'success' | 'info' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}
```

### PanelBody

```ts
interface PanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}
```

### PanelFooter

```ts
interface PanelFooterProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'parchment' | 'wood' | 'stone' | 'success' | 'info' | 'warning' | 'danger';
  children: ReactNode;
  className?: string;
}
```

## Caractéristiques

- ✅ **8 variants** : Du beige au rouge danger
- ✅ **5 niveaux de padding** : De 0 à 32px
- ✅ **Composable** : Panel, Header, Body, Footer
- ✅ **Bordures épaisses** : 2px pour l'effet médiéval
- ✅ **Dégradés** : from-to sur parchment, wood, stone
- ✅ **Ombres portées** : 0_4px_8px pour profondeur
- ✅ **Header flexible** : Titre + actions à droite
- ✅ **Footer aligné à droite** : Pour boutons d'action
- ✅ **Typographie Cinzel** : Sur les headers
- ✅ **Imbriquable** : Panels dans panels supportés

## Bonnes pratiques

- **Toujours utiliser `padding="none"`** sur Panel si vous utilisez Header/Body/Footer (ils ont leur propre padding)
- **Variant `parchment`** recommandé pour la plupart des cas (look médiéval)
- **Variant `wood`** pour construction, ressources en bois
- **Variant `stone`** pour défense, fortifications
- **Variant `success/info/warning/danger`** pour notifications/confirmations
- **PanelHeader** : Garder le contenu court, utiliser flex pour titre + actions
- **PanelBody** : C'est ici que va le contenu principal
- **PanelFooter** : Limiter à 2-3 boutons maximum
- **Imbrication** : Utiliser des variants différents pour distinguer parent/enfant

## Comparaison Panel vs Modal vs Card

| Critère          | Panel                    | Modal                     | Card                      |
|------------------|--------------------------|---------------------------|---------------------------|
| **Position**     | Dans le flow             | Overlay fixe              | Dans le flow              |
| **Usage**        | Sections de l'interface  | Actions critiques         | Éléments individuels      |
| **Fermeture**    | Toujours visible         | Bouton X + overlay        | Pas de fermeture          |
| **Taille**       | Variable                 | Fixe (sm/md/lg/xl)        | Fixe (sm/md/lg)           |
| **Complexité**   | Simple à complexe        | Actions avec validation   | Présentation d'item       |

**Utiliser Panel** pour diviser votre interface en zones logiques.  
**Utiliser Modal** pour les actions qui nécessitent l'attention de l'utilisateur.  
**Utiliser Card** pour afficher des items individuels (troupes, bâtiments, quêtes).

## Exemple complet dans un jeu

```tsx
'use client';

import { Panel, PanelHeader, PanelBody, PanelFooter, Button, ProgressBar } from '@/ui';
import { useState } from 'react';

export default function VillageDashboard() {
  const [isUpgrading, setIsUpgrading] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Panel de ressources */}
      <Panel variant="parchment" padding="none">
        <PanelHeader variant="parchment">
          <span>Ressources</span>
          <span className="text-sm font-normal">+120/h</span>
        </PanelHeader>
        <PanelBody>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>🪵 Bois</span>
              <span className="font-bold">8.500 / 10.000</span>
            </div>
            <ProgressBar value={85} variant="success" size="sm" />
            
            <div className="flex justify-between items-center">
              <span>💰 Or</span>
              <span className="font-bold">1.500 / 8.000</span>
            </div>
            <ProgressBar value={19} variant="danger" size="sm" />
          </div>
        </PanelBody>
      </Panel>

      {/* Panel d'amélioration */}
      <Panel variant="wood" padding="none">
        <PanelHeader variant="wood">
          <span>Château - Niveau 3</span>
          {isUpgrading && <span className="text-sm font-normal">⏱️ 2:30</span>}
        </PanelHeader>
        <PanelBody>
          {isUpgrading ? (
            <div className="space-y-2">
              <p>Amélioration en cours...</p>
              <ProgressBar value={45} animated variant="warning" />
            </div>
          ) : (
            <div className="space-y-2">
              <p>Améliorer au niveau 4</p>
              <ul className="text-sm space-y-1">
                <li>Coût : 5.000 or</li>
                <li>Temps : 10 minutes</li>
              </ul>
            </div>
          )}
        </PanelBody>
        <PanelFooter variant="wood">
          {isUpgrading ? (
            <Button variant="danger" size="sm" onClick={() => setIsUpgrading(false)}>
              Annuler
            </Button>
          ) : (
            <>
              <Button variant="neutral" size="sm">Détails</Button>
              <Button variant="warning" size="sm" onClick={() => setIsUpgrading(true)}>
                Améliorer
              </Button>
            </>
          )}
        </PanelFooter>
      </Panel>
    </div>
  );
}
```
