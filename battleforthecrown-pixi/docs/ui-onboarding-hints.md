# Coachmarks & hints d'onboarding — `battleforthecrown-pixi`

Affordances animées pour guider le joueur (tutoriel, découverte de feature) : ghost qui voyage d'un élément source vers une cible (drag), anneau pulsant sur un contrôle (tap), pulse de « prêt ». Génériques et réutilisables — pas couplés à l'onboarding.

## Pièces

| Pièce | Où | Rôle |
|---|---|---|
| `DragHintOverlay` | `src/features/design-system/components/DragHintOverlay.tsx` | Anime un ghost en boucle d'une source vers une cible (geste de drag). |
| `bftc-hint-drag` | `src/index.css` (keyframes) | Trajet source→cible (fade + scale), piloté par CSS vars. |
| `bftc-hint-tap` | `src/index.css` | Anneau qui s'étend autour d'un contrôle à pointer. |
| `bftc-hint-ready` | `src/index.css` | Pulse de luminosité quand une action devient possible. |

## `DragHintOverlay`

```tsx
import { DragHintOverlay } from '@/features/design-system/components';

// Le parent doit être positionné (`relative`) : c'est l'origine des coordonnées.
<div className="relative ...">
  {/* source : un élément portant un sélecteur stable */}
  <button data-troop-id="MILITIA">…</button>
  {/* cible : un élément référencé */}
  <div ref={dropRef}>…</div>

  {showHint ? (
    <DragHintOverlay fromSelector='[data-troop-id="MILITIA"]' toRef={dropRef} showHalo>
      <GhostChip troop={militia} /> {/* le visuel mobile, centré sur le point animé */}
    </DragHintOverlay>
  ) : null}
</div>
```

Props : `fromSelector` (CSS, résolu dans le parent positionné), `toRef` (ref de la cible), `children` (visuel mobile), `showHalo?`, `durationMs?` (défaut 2400), `className?`.

### Détection robuste (gotcha React important)

L'origine des coordonnées est **le propre nœud de l'overlay**, pas un ref d'ancêtre.

> React attache les refs en remontant l'arbre (bottom-up) : le `useLayoutEffect` d'un **enfant** s'exécute **avant** que le ref d'un **ancêtre** soit attaché. Mesurer via un ref d'ancêtre lit donc `null` au premier mount → la mesure échoue → le hint n'apparaît jamais (sauf `resize` qui relance la mesure). Symptôme observé : « il faut refresh / revenir sur l'écran pour le voir ».

`DragHintOverlay` lit `selfRef.current.getBoundingClientRect()` (son nœud, attaché avant son propre layout-effect) + re-mesure en `requestAnimationFrame` (shifts de layout tardifs : images/fonts) + sur `resize`.

### Quand l'afficher / le masquer

C'est au consommateur de décider, via le rendu conditionnel. Règle suivie pour l'army (`ArmyScreen.tsx`) : afficher tant que l'objectif n'est pas atteint, c.-à-d. **étape onboarding active ET cible non encore réalisée** (ici : aucun milicien en file ni au village). Masquer quand une modale prend le relais.

## Hints « tap » et « ready »

Pas de composant dédié — ce sont deux keyframes globales appliquées via Tailwind `animate-[…]` :

```tsx
{/* anneau pulsant autour d'un bouton à pointer */}
<span className="absolute inset-[-3px] rounded-xl border-2 border-[var(--game-gold-glow)]
                 animate-[bftc-hint-tap_1.2s_ease-in-out_infinite]" />

{/* bouton qui pulse une fois l'action débloquée */}
<button className={cn('…', ready && 'animate-[bftc-hint-ready_1.1s_ease-in-out_infinite]')} />
```

## Exemple bout-en-bout : onboarding « Former la milice » (étape 3)

`ArmyScreen.tsx` + `ArmyViewDesign.tsx` :

- **Drag hint** : `ArmyContentDesign` reçoit `onboardingDragHintTroopId` et rend `DragHintOverlay` (ghost milice → zone de file). La zone de drop est forcée en état « dragging » (pulse `bftcDropPulse`).
- **Modale guidée** : `ArmyRecruitPopup` reçoit `requiredValue` → anneau `bftc-hint-tap` sur `+1`, légende « Monte jusqu'à 5 », bouton « Entraîner » en `bftc-hint-ready` à la cible.
- **Quantité exacte requise** (front, onboarding) : `requiredValue = ONBOARDING_TRAIN_TROOPS_TARGET − milices au village − milices en file` (recalculé dynamiquement, donc robuste à l'annulation d'un batch partiel). `recruitMax` plafonné à ce restant, `canRecruit` vrai uniquement à `boundedValue === requiredValue`, garde miroir dans `handleRecruit`.

## Réutiliser ailleurs

1. Mettre le conteneur cible en `relative`.
2. Donner un sélecteur stable à la source (ex. `data-…`) et un ref à la cible.
3. Monter `DragHintOverlay` (ou les keyframes tap/ready) sous condition, et le démonter dès l'objectif atteint.
