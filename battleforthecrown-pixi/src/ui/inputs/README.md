# Inputs & Form Controls

Composants de formulaire stylisés avec variants pour différents états et support complet des formulaires.

## Composants

- **`Input`** : Champ de saisie principal avec variants et états
- **`InputLabel`** : Label avec indicateur required (astérisque rouge)
- **`InputHelperText`** : Texte d'aide ou message d'erreur
- **`Checkbox`** : Case à cocher stylisée avec icône Check
- **`Radio`** : Bouton radio stylisé avec point central

## Variants

| Variant     | Usage recommandé                        |
|-------------|-----------------------------------------|
| `default`   | Champ standard avec bordure marron      |
| `parchment` | Champ style parchemin (fond beige clair)|
| `success`   | Validation réussie, bordure verte       |
| `error`     | Erreur de validation, bordure rouge     |

## Tailles

| Size | Padding      | Texte       |
|------|--------------|-------------|
| `sm` | `px-3 py-2`  | `text-sm`   |
| `md` | `px-4 py-2.5`| `text-base` |
| `lg` | `px-5 py-3`  | `text-lg`   |

## Exemple d'utilisation

```tsx
import { Input, InputLabel, InputHelperText } from '@/ui';

// Input standard avec label required
<div>
  <InputLabel htmlFor="username" required>Nom d'utilisateur</InputLabel>
  <Input 
    id="username" 
    type="text" 
    placeholder="Entrez votre nom"
    variant="default"
    size="md"
  />
  <InputHelperText variant="default">3-20 caractères</InputHelperText>
</div>

// Input avec erreur
<div>
  <InputLabel htmlFor="email">Email</InputLabel>
  <Input 
    id="email" 
    type="email" 
    variant="error"
    defaultValue="email-invalide"
  />
  <InputHelperText variant="error">Format d'email invalide</InputHelperText>
</div>
```

> **Voir la démo :** `/ui-test` pour tous les variants et états en action.

## Props

### Input

```ts
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'parchment' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### InputLabel

```ts
interface InputLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  required?: boolean; // Affiche un astérisque rouge
  className?: string;
}
```

### InputHelperText

```ts
interface InputHelperTextProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning';
  className?: string;
}
```

## Caractéristiques

- ✅ **Effet enfoncé** : Ombre interne pour effet "creux"
- ✅ **Focus stylisé** : Bordure renforcée + halo coloré
- ✅ **États visuels** : Success (vert), Error (rouge), Disabled (opacité réduite)
- ✅ **Accessibilité** : Support `forwardRef`, spread des props HTML natives
- ✅ **Label avec required** : Astérisque rouge automatique si `required={true}`
- ✅ **Helper text coloré** : Texte adapté à l'état (success, error, warning)

## Bonnes pratiques

- Toujours associer un `InputLabel` avec `htmlFor` pointant vers l'`id` de l'Input
- Utiliser `variant="error"` + `InputHelperText variant="error"` pour les erreurs de validation
- Utiliser `required` sur le label pour les champs obligatoires (affiche l'astérisque)
- Privilégier `variant="parchment"` pour une cohérence visuelle avec le thème médiéval
- Utiliser `placeholder` pour guider l'utilisateur, mais pas comme remplacement du label

---

## Checkbox

Case à cocher stylisée avec icône Check intégrée de lucide-react.

### Variants

| Variant     | Couleur      | Usage recommandé                 |
|-------------|--------------|----------------------------------|
| `default`   | Marron       | Case standard                    |
| `parchment` | Parchemin    | Contexte médiéval                |
| `success`   | Vert         | Confirmation, accord             |
| `error`     | Rouge        | Validation d'erreur              |

### Tailles

| Size | Dimensions |
|------|------------|
| `sm` | 16x16px    |
| `md` | 20x20px    |
| `lg` | 24x24px    |

### Exemple d'utilisation

```tsx
import { Checkbox, InputLabel, InputHelperText } from '@/ui';

// Checkbox simple avec label
<Checkbox label="J'accepte les conditions" variant="default" />

// Checkbox avec état contrôlé
const [accepted, setAccepted] = useState(false);

<Checkbox 
  label="Activer les notifications"
  variant="success"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
/>

// Groupe de checkboxes
<div className="space-y-2">
  <InputLabel>Ressources à collecter</InputLabel>
  <div className="space-y-1">
    <Checkbox label="Bois" name="resources" value="wood" variant="parchment" />
    <Checkbox label="Pierre" name="resources" value="stone" variant="parchment" />
    <Checkbox label="Or" name="resources" value="gold" variant="parchment" />
  </div>
  <InputHelperText variant="default">
    Sélectionnez les ressources à collecter automatiquement
  </InputHelperText>
</div>
```

### Props

```ts
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'parchment' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}
```

### Caractéristiques

- ✅ **Icône Check** : Icône lucide-react intégrée avec transition
- ✅ **Dégradés colorés** : Fond avec gradient quand coché
- ✅ **Animation smooth** : Transition opacité 150ms
- ✅ **Hover & Focus** : États interactifs avec ring sur focus
- ✅ **Label cliquable** : Le label déclenche aussi le changement d'état
- ✅ **État désactivé** : Opacité réduite + curseur non autorisé
- ✅ **Accessibilité** : ID auto-généré, support forwardRef

---

## Radio

Bouton radio stylisé avec point central en gradient.

### Variants

| Variant     | Couleur      | Usage recommandé                 |
|-------------|--------------|----------------------------------|
| `default`   | Marron       | Sélection standard               |
| `parchment` | Parchemin    | Contexte médiéval                |
| `success`   | Vert         | Sélection positive               |
| `error`     | Rouge        | Sélection critique               |

### Tailles

| Size | Dimensions |
|------|------------|
| `sm` | 16x16px    |
| `md` | 20x20px    |
| `lg` | 24x24px    |

### Exemple d'utilisation

```tsx
import { Radio, InputLabel, InputHelperText } from '@/ui';

// Radio simple avec label
<Radio label="Option A" name="choice" value="a" variant="default" />

// Groupe de radios
<div className="space-y-2">
  <InputLabel>Type de bâtiment</InputLabel>
  <div className="space-y-1">
    <Radio label="Château" name="building" value="castle" variant="parchment" />
    <Radio label="Caserne" name="building" value="barracks" variant="parchment" />
    <Radio label="Quartier" name="building" value="quarter" variant="parchment" />
  </div>
  <InputHelperText variant="default">
    Choisissez le type de bâtiment à construire
  </InputHelperText>
</div>

// Radio avec état contrôlé
const [difficulty, setDifficulty] = useState('normal');

<Radio 
  label="Facile" 
  name="difficulty" 
  value="easy"
  variant="success"
  checked={difficulty === 'easy'}
  onChange={(e) => setDifficulty(e.target.value)}
/>
<Radio 
  label="Normal" 
  name="difficulty" 
  value="normal"
  variant="default"
  checked={difficulty === 'normal'}
  onChange={(e) => setDifficulty(e.target.value)}
/>
<Radio 
  label="Difficile" 
  name="difficulty" 
  value="hard"
  variant="error"
  checked={difficulty === 'hard'}
  onChange={(e) => setDifficulty(e.target.value)}
/>
```

### Props

```ts
interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'parchment' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}
```

### Caractéristiques

- ✅ **Point central** : Indicateur circulaire avec gradient
- ✅ **Forme circulaire** : Border-radius 50% parfait
- ✅ **Animation smooth** : Transition opacité 150ms
- ✅ **Hover & Focus** : États interactifs avec ring sur focus
- ✅ **Label cliquable** : Le label déclenche aussi le changement d'état
- ✅ **État désactivé** : Opacité réduite + curseur non autorisé
- ✅ **Accessibilité** : ID auto-généré, support forwardRef

---

## Bonnes pratiques (Checkbox & Radio)

- Toujours utiliser un `name` identique pour grouper les radios
- Combiner avec `InputLabel` pour décrire le groupe
- Utiliser `InputHelperText` pour donner des instructions
- Privilégier `variant="parchment"` pour cohérence médiévale
- **Checkbox** : Pour choix multiples (0, 1 ou plusieurs)
- **Radio** : Pour choix unique (1 seul parmi plusieurs)
- Toujours fournir un `value` unique pour chaque option
- Limiter le nombre d'options visibles (max 5-7 pour l'UX)
