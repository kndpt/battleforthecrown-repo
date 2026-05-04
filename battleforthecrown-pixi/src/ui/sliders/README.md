# Slider

Curseur de réglage (range input) stylisé avec variants colorés et tailles configurables.

## Variants

| Variant   | Couleur    | Usage recommandé           |
|-----------|------------|----------------------------|
| `default` | Marron     | Réglage standard           |
| `success` | Vert       | Volume, santé, ressources  |
| `info`    | Bleu       | Configuration neutre       |
| `warning` | Gold       | Niveau de difficulté       |
| `danger`  | Rouge      | Paramètres critiques       |

## Tailles

| Size | Track | Thumb   |
|------|-------|---------|
| `sm` | 4px   | 12x12px |
| `md` | 8px   | 20x20px |
| `lg` | 12px  | 24x24px |

## Exemple d'utilisation

```tsx
import { Slider } from '@/ui';
import { useState } from 'react';

export default function VolumeControl() {
  const [volume, setVolume] = useState(50);

  return (
    <Slider
      variant="success"
      size="md"
      label="Volume"
      showValue
      min={0}
      max={100}
      value={volume}
      onChange={(e) => setVolume(Number(e.target.value))}
    />
  );
}
```

### Slider simple

```tsx
import { Slider } from '@/ui';

// Sans label ni valeur
<Slider defaultValue={50} />

// Avec label
<Slider label="Luminosité" defaultValue={75} />

// Avec valeur affichée
<Slider label="Volume" showValue defaultValue={60} />
```

### Variants

```tsx
import { Slider } from '@/ui';

// Default
<Slider variant="default" defaultValue={50} />

// Success (vert)
<Slider variant="success" label="Santé" defaultValue={80} />

// Info (bleu)
<Slider variant="info" label="Distance" defaultValue={50} />

// Warning (gold)
<Slider variant="warning" label="Difficulté" defaultValue={30} />

// Danger (rouge)
<Slider variant="danger" label="Alarme" defaultValue={20} />
```

### Tailles

```tsx
import { Slider } from '@/ui';

<Slider size="sm" defaultValue={50} />
<Slider size="md" defaultValue={50} />
<Slider size="lg" defaultValue={50} />
```

### Avec état contrôlé

```tsx
import { Slider } from '@/ui';
import { useState } from 'react';

export default function TroopTraining() {
  const [troopCount, setTroopCount] = useState(10);

  return (
    <div>
      <Slider
        variant="warning"
        label="Nombre de troupes à entraîner"
        showValue
        min={1}
        max={50}
        value={troopCount}
        onChange={(e) => setTroopCount(Number(e.target.value))}
      />
      <p className="mt-2 text-sm text-gray-600">
        Coût total : {troopCount * 100} or
      </p>
    </div>
  );
}
```

### Min/Max personnalisés

```tsx
import { Slider } from '@/ui';

// Niveau (1 à 10)
<Slider
  label="Niveau du bâtiment"
  min={1}
  max={10}
  defaultValue={5}
  showValue
/>

// Pourcentage (0 à 100)
<Slider
  label="Taxes (%)"
  min={0}
  max={100}
  step={5}
  defaultValue={15}
  showValue
/>

// Valeur négative à positive
<Slider
  label="Ajustement"
  min={-10}
  max={10}
  defaultValue={0}
  showValue
/>
```

### Step personnalisé

```tsx
import { Slider } from '@/ui';

// Par pas de 10
<Slider
  label="Production horaire"
  min={0}
  max={1000}
  step={10}
  defaultValue={500}
  showValue
/>

// Par pas de 0.5
<Slider
  label="Multiplicateur"
  min={0}
  max={5}
  step={0.5}
  defaultValue={1}
  showValue
/>
```

### Slider désactivé

```tsx
import { Slider } from '@/ui';

<Slider
  label="Configuration verrouillée"
  defaultValue={50}
  disabled
/>
```

> **Voir la démo :** `/ui-test` pour tous les variants et tailles en action.

## Props

```ts
interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'success' | 'info' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label?: string;              // Label affiché au-dessus
  showValue?: boolean;         // Afficher la valeur à droite du label
  min?: number;                // Valeur minimum (défaut: 0)
  max?: number;                // Valeur maximum (défaut: 100)
  step?: number;               // Incrément (défaut: 1)
  value?: number;              // Valeur contrôlée
  defaultValue?: number;       // Valeur par défaut (non contrôlée)
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}
```

## Caractéristiques

- ✅ **5 variants colorés** : Adaptés au thème médiéval
- ✅ **3 tailles** : Track de 4px à 12px, thumb de 12px à 24px
- ✅ **Label optionnel** : Affiché au-dessus du slider
- ✅ **Affichage de la valeur** : Option `showValue` pour afficher la valeur courante
- ✅ **Min/Max/Step configurables** : Contrôle total sur les valeurs
- ✅ **Dégradé sur le thumb** : Effet 3D médiéval
- ✅ **Hover effect** : Le thumb grossit au survol (scale 1.1)
- ✅ **Disabled state** : Opacité réduite + cursor not-allowed
- ✅ **Accessible** : Support natif du clavier (flèches gauche/droite)
- ✅ **Cross-browser** : Styles pour WebKit et Firefox

## Exemples contextuels

### Paramètres audio

```tsx
import { Slider } from '@/ui';
import { useState } from 'react';

export default function AudioSettings() {
  const [musicVolume, setMusicVolume] = useState(70);
  const [sfxVolume, setSfxVolume] = useState(85);

  return (
    <div className="space-y-4">
      <Slider
        variant="success"
        label="Volume musique"
        showValue
        value={musicVolume}
        onChange={(e) => setMusicVolume(Number(e.target.value))}
      />
      
      <Slider
        variant="info"
        label="Volume effets sonores"
        showValue
        value={sfxVolume}
        onChange={(e) => setSfxVolume(Number(e.target.value))}
      />
    </div>
  );
}
```

### Configuration de partie

```tsx
import { Slider } from '@/ui';
import { useState } from 'react';

export default function GameSetup() {
  const [difficulty, setDifficulty] = useState(5);
  const [startingGold, setStartingGold] = useState(1000);

  const difficultyLabels = ['Très facile', 'Facile', 'Normal', 'Difficile', 'Très difficile'];

  return (
    <div className="space-y-4">
      <Slider
        variant="warning"
        label={`Difficulté : ${difficultyLabels[Math.floor((difficulty / 100) * 4)]}`}
        min={0}
        max={100}
        value={difficulty}
        onChange={(e) => setDifficulty(Number(e.target.value))}
      />
      
      <Slider
        variant="success"
        label="Or de départ"
        showValue
        min={500}
        max={5000}
        step={100}
        value={startingGold}
        onChange={(e) => setStartingGold(Number(e.target.value))}
      />
    </div>
  );
}
```

### Répartition de ressources

```tsx
import { Slider } from '@/ui';
import { useState } from 'react';

export default function ResourceAllocation() {
  const [wood, setWood] = useState(33);
  const [stone, setStone] = useState(33);
  const [gold, setGold] = useState(34);

  // Normaliser pour que la somme soit 100
  const handleWoodChange = (value: number) => {
    setWood(value);
    const remaining = 100 - value;
    setStone(Math.floor(remaining / 2));
    setGold(Math.ceil(remaining / 2));
  };

  return (
    <div className="space-y-4">
      <Slider
        variant="success"
        label="Bois 🪵"
        showValue
        value={wood}
        onChange={(e) => handleWoodChange(Number(e.target.value))}
      />
      
      <Slider
        variant="default"
        label="Pierre 🪨"
        showValue
        value={stone}
        onChange={(e) => {
          setStone(Number(e.target.value));
          setGold(100 - wood - Number(e.target.value));
        }}
      />
      
      <Slider
        variant="warning"
        label="Or 💰"
        showValue
        value={gold}
        disabled
      />
      
      <p className="text-sm text-gray-600">
        Total : {wood + stone + gold}%
      </p>
    </div>
  );
}
```

### Niveau de zoom

```tsx
import { Slider } from '@/ui';
import { useState } from 'react';

export default function MapZoom() {
  const [zoom, setZoom] = useState(100);

  return (
    <Slider
      variant="info"
      label="Zoom de la carte"
      showValue
      min={50}
      max={200}
      step={10}
      value={zoom}
      onChange={(e) => setZoom(Number(e.target.value))}
    />
  );
}
```

## Bonnes pratiques

- **Utiliser `showValue`** pour les réglages où la valeur exacte est importante
- **Définir min/max/step appropriés** : par exemple step={5} pour des pourcentages, step={10} pour de grandes valeurs
- **Variant `success`** pour volume, santé, ressources positives
- **Variant `warning`** pour difficulté, paramètres à surveiller
- **Variant `danger`** pour paramètres critiques (alarmes, seuils d'alerte)
- **Label descriptif** : toujours indiquer ce que contrôle le slider
- **Feedback visuel** : combiner avec d'autres composants (Badge, ProgressBar) pour montrer l'impact
- **Valeurs par défaut sensées** : 50% pour un curseur de 0 à 100
- **Disabled state** : utiliser quand une condition doit être remplie pour déverrouiller

## Accessibilité

- ✅ **Clavier** : Flèches gauche/droite pour ajuster (±1), Home/End pour min/max
- ✅ **Label** : Toujours fournir un label descriptif
- ✅ **Attributs ARIA** : `aria-label`, `aria-valuemin`, `aria-valuemax` supportés via props natives
- ✅ **Focus visible** : Outline au focus clavier

## Exemple complet dans un jeu

```tsx
'use client';

import { Slider } from '@/ui';
import { useState } from 'react';

export default function TroopTrainingPanel() {
  const [warriors, setWarriors] = useState(10);
  const [archers, setArchers] = useState(5);
  const [knights, setKnights] = useState(2);

  const totalCost = warriors * 50 + archers * 75 + knights * 150;
  const trainingTime = warriors * 1 + archers * 2 + knights * 5;

  return (
    <div className="bg-white/50 rounded-lg p-6 border-2 border-[#d4c094]">
      <h3 className="font-cinzel text-xl font-bold mb-4">Entraînement de troupes</h3>
      
      <div className="space-y-6">
        <Slider
          variant="success"
          size="md"
          label="Guerriers 🗡️"
          showValue
          min={0}
          max={50}
          value={warriors}
          onChange={(e) => setWarriors(Number(e.target.value))}
        />
        
        <Slider
          variant="info"
          size="md"
          label="Archers 🏹"
          showValue
          min={0}
          max={30}
          value={archers}
          onChange={(e) => setArchers(Number(e.target.value))}
        />
        
        <Slider
          variant="warning"
          size="md"
          label="Chevaliers 🛡️"
          showValue
          min={0}
          max={10}
          value={knights}
          onChange={(e) => setKnights(Number(e.target.value))}
        />
      </div>
      
      <div className="mt-6 pt-4 border-t-2 border-[#d4c094] space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-game">Coût total :</span>
          <span className="font-game font-bold">💰 {totalCost} or</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-game">Temps d'entraînement :</span>
          <span className="font-game font-bold">⏱️ {trainingTime} min</span>
        </div>
      </div>
    </div>
  );
}
```
