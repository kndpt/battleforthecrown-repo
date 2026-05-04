# Textarea

Zone de texte multi-lignes stylisée avec variants colorés et tailles configurables.

## Variants

| Variant     | Couleur              | Usage recommandé              |
|-------------|----------------------|-------------------------------|
| `default`   | Blanc                | Zone de texte standard        |
| `parchment` | Beige médiéval       | Messages, descriptions        |
| `success`   | Vert clair           | Texte validé                  |
| `error`     | Rouge clair          | Texte invalide, erreur        |

## Tailles

| Size | Min Height | Padding  | Text Size |
|------|------------|----------|-----------|
| `sm` | 60px       | 6px 8px  | 14px      |
| `md` | 100px      | 8px 12px | 16px      |
| `lg` | 150px      | 12px 16px| 18px      |

## Exemple d'utilisation

```tsx
import { Textarea, InputLabel, InputHelperText } from '@/ui';

export default function MessageForm() {
  return (
    <div>
      <InputLabel htmlFor="message">Message</InputLabel>
      <Textarea
        id="message"
        variant="parchment"
        size="md"
        placeholder="Écrivez votre message..."
        rows={5}
      />
      <InputHelperText>Maximum 500 caractères</InputHelperText>
    </div>
  );
}
```

### Textarea simple

```tsx
import { Textarea } from '@/ui';

// Sans props
<Textarea placeholder="Votre texte..." />

// Avec variant
<Textarea variant="parchment" placeholder="Message médiéval..." />

// Avec taille
<Textarea size="lg" placeholder="Grande zone de texte..." />
```

### Avec label et helper text

```tsx
import { Textarea, InputLabel, InputHelperText } from '@/ui';

<div className="space-y-2">
  <InputLabel htmlFor="description" required>
    Description du bâtiment
  </InputLabel>
  <Textarea
    id="description"
    variant="parchment"
    size="md"
    placeholder="Décrivez votre bâtiment..."
  />
  <InputHelperText variant="default">
    Minimum 20 caractères, maximum 500 caractères
  </InputHelperText>
</div>
```

### Avec état contrôlé

```tsx
import { Textarea, InputLabel } from '@/ui';
import { useState } from 'react';

export default function MessageEditor() {
  const [message, setMessage] = useState('');
  const maxChars = 500;

  return (
    <div className="space-y-2">
      <InputLabel htmlFor="message">
        Message ({message.length} / {maxChars})
      </InputLabel>
      <Textarea
        id="message"
        variant="parchment"
        size="md"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
        placeholder="Écrivez votre message..."
      />
    </div>
  );
}
```

### Textarea avec validation

```tsx
import { Textarea, InputLabel, InputHelperText } from '@/ui';
import { useState } from 'react';

export default function ValidatedTextarea() {
  const [text, setText] = useState('');
  const isValid = text.length >= 20 && text.length <= 500;

  return (
    <div className="space-y-2">
      <InputLabel htmlFor="validated" required>
        Description
      </InputLabel>
      <Textarea
        id="validated"
        variant={isValid ? 'success' : 'error'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Minimum 20 caractères..."
      />
      <InputHelperText variant={isValid ? 'success' : 'error'}>
        {text.length < 20
          ? `${20 - text.length} caractères restants minimum`
          : text.length > 500
          ? `${text.length - 500} caractères en trop`
          : '✓ Format valide'}
      </InputHelperText>
    </div>
  );
}
```

### Textarea désactivée

```tsx
import { Textarea, InputLabel } from '@/ui';

<div className="space-y-2">
  <InputLabel htmlFor="disabled">Message (verrouillé)</InputLabel>
  <Textarea
    id="disabled"
    variant="default"
    value="Ce texte ne peut pas être modifié"
    disabled
  />
</div>
```

### Textarea avec rows fixe

```tsx
import { Textarea } from '@/ui';

// 3 lignes
<Textarea rows={3} placeholder="Commentaire court..." />

// 10 lignes
<Textarea rows={10} placeholder="Article long..." />
```

### Textarea sans redimensionnement

```tsx
import { Textarea } from '@/ui';

// Ajouter className pour désactiver resize
<Textarea 
  variant="parchment"
  className="resize-none"
  placeholder="Zone de texte fixe..."
/>
```

> **Voir la démo :** `/ui-test` pour tous les variants et tailles en action.

## Props

```ts
interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: 'default' | 'parchment' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  rows?: number;                // Nombre de lignes (défaut: 3)
  value?: string;               // Valeur contrôlée
  defaultValue?: string;        // Valeur par défaut (non contrôlée)
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;           // Limite de caractères
  className?: string;
}
```

## Caractéristiques

- ✅ **4 variants** : default, parchment, success, error
- ✅ **3 tailles** : sm (60px min), md (100px min), lg (150px min)
- ✅ **Redimensionnable** : Vertical seulement par défaut
- ✅ **Focus ring** : Anneau de focus coloré selon le variant
- ✅ **Transitions** : Animation smooth sur focus/hover
- ✅ **Placeholder** : Texte gris clair
- ✅ **Disabled state** : Opacité 50% + cursor not-allowed
- ✅ **Font game** : Police cohérente avec le reste de l'UI
- ✅ **Accessible** : Support natif du clavier et lecteurs d'écran
- ✅ **ForwardRef** : Supporte les refs

## Bonnes pratiques

- **Toujours fournir un label** via `InputLabel`
- **Utiliser `InputHelperText`** pour indiquer les limites (min/max caractères)
- **Variant `parchment`** recommandé pour le thème médiéval
- **Variant `success`** quand la validation est OK
- **Variant `error`** quand la validation échoue
- **Définir `rows`** approprié : 3-5 pour commentaires, 10+ pour articles
- **maxLength** : Définir une limite pour éviter les abus
- **Compteur de caractères** : Afficher X / max dans le label ou helper text
- **Validation** : Valider en temps réel ou au blur
- **Resize** : Laisser activé pour la flexibilité, sauf cas spécifique
- **Placeholder descriptif** : Donner un exemple du contenu attendu

## Exemples contextuels

### Message de guilde

```tsx
import { Textarea, InputLabel, Button } from '@/ui';
import { useState } from 'react';

export default function GuildMessageForm() {
  const [message, setMessage] = useState('');
  const maxChars = 500;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <InputLabel htmlFor="guild-message">
          Message de la guilde ({message.length} / {maxChars})
        </InputLabel>
        <Textarea
          id="guild-message"
          variant="parchment"
          size="md"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, maxChars))}
          placeholder="Annoncez quelque chose à votre guilde..."
          rows={5}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="neutral" size="sm">Annuler</Button>
        <Button variant="success" size="sm" disabled={message.length < 10}>
          Envoyer
        </Button>
      </div>
    </div>
  );
}
```

### Description de bâtiment personnalisé

```tsx
import { Textarea, InputLabel, InputHelperText } from '@/ui';
import { useState } from 'react';

export default function BuildingDescription() {
  const [description, setDescription] = useState('');
  const isValid = description.length >= 20 && description.length <= 200;

  return (
    <div className="space-y-2">
      <InputLabel htmlFor="building-desc" required>
        Description du bâtiment
      </InputLabel>
      <Textarea
        id="building-desc"
        variant={description.length === 0 ? 'parchment' : isValid ? 'success' : 'error'}
        size="md"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Décrivez votre bâtiment personnalisé..."
        rows={4}
        maxLength={200}
      />
      <InputHelperText variant={isValid ? 'success' : 'error'}>
        {description.length === 0
          ? 'Minimum 20 caractères requis'
          : description.length < 20
          ? `${20 - description.length} caractères minimum`
          : `✓ ${description.length} / 200 caractères`}
      </InputHelperText>
    </div>
  );
}
```

### Rapport de bug

```tsx
import { Textarea, InputLabel, InputHelperText, Button, Panel, PanelHeader, PanelBody, PanelFooter } from '@/ui';
import { useState } from 'react';

export default function BugReportForm() {
  const [bugDescription, setBugDescription] = useState('');

  return (
    <Panel variant="danger" padding="none">
      <PanelHeader variant="danger">
        <span>Signaler un bug</span>
      </PanelHeader>
      <PanelBody>
        <div className="space-y-2">
          <InputLabel htmlFor="bug-desc" required>
            Description du problème
          </InputLabel>
          <Textarea
            id="bug-desc"
            variant="parchment"
            size="lg"
            value={bugDescription}
            onChange={(e) => setBugDescription(e.target.value)}
            placeholder="Décrivez le bug en détail : étapes à reproduire, comportement attendu, comportement observé..."
            rows={8}
          />
          <InputHelperText>
            Plus vous êtes précis, plus vite nous pourrons corriger le problème.
          </InputHelperText>
        </div>
      </PanelBody>
      <PanelFooter variant="danger">
        <Button variant="neutral" size="sm">Annuler</Button>
        <Button variant="danger" size="sm" disabled={bugDescription.length < 50}>
          Envoyer le rapport
        </Button>
      </PanelFooter>
    </Panel>
  );
}
```

### Notes de stratégie

```tsx
import { Textarea, InputLabel } from '@/ui';
import { useState, useEffect } from 'react';

export default function StrategyNotes() {
  const [notes, setNotes] = useState('');

  // Auto-save toutes les 5 secondes
  useEffect(() => {
    if (!notes) return;
    
    const timer = setTimeout(() => {
      localStorage.setItem('strategy-notes', notes);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notes]);

  return (
    <div className="space-y-2">
      <InputLabel htmlFor="notes">
        Notes de stratégie
        <span className="ml-2 text-xs font-normal opacity-70">
          (sauvegarde automatique)
        </span>
      </InputLabel>
      <Textarea
        id="notes"
        variant="parchment"
        size="lg"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notez vos stratégies, plans d'attaque, etc..."
        rows={15}
        className="font-mono text-sm"
      />
    </div>
  );
}
```

## Comparaison Textarea vs Input

| Critère          | Textarea                    | Input                       |
|------------------|-----------------------------|-----------------------------|
| **Lignes**       | Multi-lignes                | Mono-ligne                  |
| **Usage**        | Texte long (messages, etc.) | Texte court (nom, email)    |
| **Resize**       | Oui (vertical)              | Non                         |
| **Min height**   | 60px-150px                  | 40px-56px                   |
| **Validation**   | Compteur de caractères      | Format (email, URL, etc.)   |

**Utiliser Textarea** pour : descriptions, messages, commentaires, rapports, notes.  
**Utiliser Input** pour : noms, emails, nombres, URLs, recherche.
