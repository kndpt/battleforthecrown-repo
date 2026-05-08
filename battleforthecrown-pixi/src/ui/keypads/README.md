# Keypads

Pavé numérique tactile pour saisir une quantité au doigt, sans clavier système. Conçu mobile-first pour les écrans où la précision unité est nécessaire (recrutement, expéditions, attaques ciblées) sans casser l'ergonomie one-touch.

## Composants

| Composant              | Rôle                                                                    |
|------------------------|-------------------------------------------------------------------------|
| `NumericKeypad`        | Primitive idiote : display valeur + max secondaire + grid 4×3.          |
| `NumericKeypadSheet`   | `NumericKeypad` enrobé dans un `BottomSheet` avec `Annuler` / `OK`.     |

## NumericKeypad

### Props

| Prop            | Type                                                       | Défaut   | Description                                                                  |
|-----------------|------------------------------------------------------------|----------|------------------------------------------------------------------------------|
| `value`         | `number`                                                   | —        | Valeur courante.                                                             |
| `onChange`      | `(next: number) => void`                                   | —        | Appelé après chaque digit / ⌫ / MAX, déjà clampé.                            |
| `min`           | `number`                                                   | `0`      | Borne basse (clamp + désactivation ⌫).                                       |
| `max`           | `number`                                                   | —        | Borne haute. Active le bouton MAX si `showMaxButton` est laissé à `true`.    |
| `variant`       | `'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `info`   | Couleur des touches chiffres. ⌫ reste neutre, MAX reste warning (gold).     |
| `size`          | `'md' \| 'lg'`                                              | `lg`     | Taille des touches (lg = ~h-12, confort tactile mobile).                     |
| `showMaxButton` | `boolean`                                                  | `true`   | Si `false` ou si `max` n'est pas fourni → la 12ᵉ case est vide.              |
| `unitLabel`     | `string`                                                   | `/ {max}` | Label secondaire sous la valeur. Override le `/ {max}` par défaut.           |
| `clearOnFirstDigit` | `boolean`                                              | `false`  | Si `true`, la 1ʳᵉ frappe d'un chiffre remplace `value` au lieu d'append. ⌫/MAX consomment l'état pristine sans remplacer. Réarmer via `key`. |

### Comportement

- **Append digit** : `value === 0` → remplace ; sinon `value * 10 + digit`. Toujours clampé à `max`.
- **⌫** : `Math.floor(value / 10)`, clampé à `min`. Désactivé quand `value === min`.
- **MAX** : set direct à `max`. Désactivé quand `value === max`.
- **Verrouillé** : si `max <= 0` (rien à recruter) → toutes les touches sauf affichage en `disabled`.
- **Restart au plafond** : si `value >= max`, la frappe d'un chiffre **remplace** la valeur (au lieu d'append + clamp) — évite à l'utilisateur de devoir backspace pour repartir.
- **Restart à l'ouverture** (via `clearOnFirstDigit`) : voir tableau des props.

### Exemple

```tsx
const [qty, setQty] = useState(0);

<NumericKeypad
  value={qty}
  onChange={setQty}
  max={10000}
  variant="info"
/>
```

## NumericKeypadSheet

Wrapper mobile-first pour ouvrir le keypad dans un `BottomSheet` avec un bouton de confirmation explicite. Hérite des props du `NumericKeypad`.

### Props supplémentaires

| Prop           | Type                       | Défaut       | Description                                                |
|----------------|----------------------------|--------------|------------------------------------------------------------|
| `open`         | `boolean`                  | —            | Ouverture/fermeture du sheet.                              |
| `onClose`      | `() => void`               | —            | Fermé sur clic overlay ou Annuler.                         |
| `onConfirm`    | `(value: number) => void`  | —            | Appelé sur OK avec la valeur draft. Le `value` parent ne se met à jour qu'à ce moment. |
| `value`        | `number`                   | —            | Valeur initiale du draft (réinitialisée à chaque `open`).  |
| `title`        | `string`                   | `undefined`  | Affiché dans le header. Si absent → header masqué.         |
| `confirmLabel` | `string`                   | `'OK'`       | Label du bouton de confirmation.                           |
| `cancelLabel`  | `string`                   | `'Annuler'`  | Label du bouton d'annulation.                              |

### Pattern

L'état d'édition reste local au sheet (draft). Le parent ne reçoit la valeur qu'au moment du `onConfirm` — Annuler et clic overlay rejettent les modifications.

À chaque ouverture, le sheet active `clearOnFirstDigit` et remonte le pavé via une `key` interne. Concrètement : le draft est initialisé à `value`, et la 1ʳᵉ frappe d'un chiffre remplace cette valeur (au lieu d'append). ⌫ ou MAX agissent normalement et consomment l'état "pristine".

```tsx
const [qty, setQty] = useState(1);
const [open, setOpen] = useState(false);

<button onClick={() => setOpen(true)}>{qty}</button>

<NumericKeypadSheet
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={setQty}
  value={qty}
  max={10000}
  title="ÉCUYER"
/>
```

## Quand utiliser

- Saisie d'une quantité **précise** sur mobile, en complément d'un slider.
- Toute échelle où le slider seul devient imprécis (≥ 100 unités).

## Quand ne pas utiliser

- Saisie de texte, dates, ou tout ce qui n'est pas un entier positif.
- Écrans desktop où le clavier physique est plus rapide → préférer un `Input` standard.
