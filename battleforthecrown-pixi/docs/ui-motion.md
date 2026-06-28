# Animations UI — `<Motion>` + presets

Petite lib d'animation plug-and-play pour le HUD React. Un composant générique typé
(`<Motion>`) + un enum de presets. Objectif : brancher une animation en une ligne, sans
réécrire de keyframes ni éparpiller des classes Tailwind.

> Source : [`src/ui/motion/`](../src/ui/motion/). Keyframes : [`src/index.css`](../src/index.css)
> (préfixe `bftc-`). Démo : route `/design-system` (section RoyalSeal).

## Composant `<Motion>`

```tsx
import { Motion } from '@/ui';

<Motion preset="wizz" active={hasPendingTasks}>
  <CrownIcon />
</Motion>
```

| Prop       | Type                       | Défaut   | Rôle                                            |
|------------|----------------------------|----------|-------------------------------------------------|
| `preset`   | `MotionPreset`             | —        | Quelle animation jouer (voir table).            |
| `active`   | `boolean`                  | `true`   | Si `false`, aucune animation (wrapper inerte).  |
| `as`       | `ElementType`              | `'span'` | Élément rendu.                                   |
| `className`| `string`                   | —        | Classes additionnelles.                         |
| `style`    | `CSSProperties`            | —        | Styles additionnels.                            |

Le composant applique `style.animation = MOTION_PRESETS[preset]` quand `active`, et porte la
classe `bftc-motion` (cible du guard `prefers-reduced-motion`).

## Presets disponibles

| Preset  | Effet                                                              | Usage type                          |
|---------|-------------------------------------------------------------------|-------------------------------------|
| `wizz`  | Rafale de tremblement courte puis pause, en boucle (~toutes 3 s). | Attirer l'œil sur un bouton à action |
| `pulse` | Respiration douce (scale 1.08), en boucle.                        | Mettre en avant un élément prêt      |
| `shake` | Tremblement horizontal continu rapide.                            | Erreur / refus / feedback négatif    |

## Accessibilité

Un guard global dans `index.css` neutralise toutes les animations `<Motion>` pour les
utilisateurs `prefers-reduced-motion: reduce` :

```css
@media (prefers-reduced-motion: reduce) {
  .bftc-motion { animation: none !important; }
}
```

## Ajouter un preset

1. Déclarer la keyframe dans [`src/index.css`](../src/index.css), **préfixe `bftc-`** :
   ```css
   @keyframes bftc-bounce {
     50% { transform: translateY(-4px); }
   }
   ```
2. Ajouter l'entrée dans `MOTION_PRESETS` ([`src/ui/motion/motionPresets.ts`](../src/ui/motion/motionPresets.ts)) :
   ```ts
   bounce: 'bftc-bounce 0.6s ease-in-out infinite',
   ```
3. L'utiliser : `<Motion preset="bounce" />`. Le type `MotionPreset` se met à jour tout seul.

## Exemple réel — wizz du Devoir royal

Le sceau royal (`RoyalSeal`, prop `animate`) enveloppe sa face dans `<Motion preset="wizz">`.
Le widget `DailyRetentionWidget` active le wizz tant qu'il reste une action à faire (tâches
restantes ou récompense à récupérer), et le coupe une fois tout récupéré.
