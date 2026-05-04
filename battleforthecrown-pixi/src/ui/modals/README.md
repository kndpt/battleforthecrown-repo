# Modal

Fenêtre modale stylisée dans un thème médiéval avec overlay, header, body et footer.

## Composants

- **`Modal`** : Conteneur principal avec overlay et gestion des états
- **`ModalBody`** : Corps de la modale avec scroll automatique
- **`ModalFooter`** : Footer pour les actions (boutons)

## Variants

| Variant   | Couleur   | Usage recommandé                           |
|-----------|-----------|-------------------------------------------|
| `default` | Parchemin | Modales standard (infos, formulaires)     |
| `warning` | Gold      | Avertissements, confirmations importantes |
| `danger`  | Rouge     | Actions dangereuses, suppressions         |
| `info`    | Bleu      | Informations, tutoriels                   |

## Tailles

| Size | Largeur max  | Usage                              |
|------|-------------|------------------------------------|
| `sm` | `max-w-md`  | Petites confirmations, alertes     |
| `md` | `max-w-2xl` | Formulaires, infos standards       |
| `lg` | `max-w-4xl` | Grandes listes, tableaux           |
| `xl` | `max-w-6xl` | Vues détaillées, cartes complexes  |

## Exemple d'utilisation

```tsx
import { Modal, ModalBody, ModalFooter, Button } from '@/ui';
import { useState } from 'react';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Améliorer le Château"
  variant="default"
  size="md"
>
  <ModalBody>
    <p>Contenu de la modale...</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="neutral" onClick={() => setIsOpen(false)}>Annuler</Button>
    <Button variant="success">Confirmer</Button>
  </ModalFooter>
</Modal>
```

> **Voir la démo :** `/ui-test` pour tous les variants en action.

## Props

### Modal

```ts
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'warning' | 'danger' | 'info';
  showCloseButton?: boolean;        // défaut: true
  closeOnOverlayClick?: boolean;    // défaut: true
  closeOnEscape?: boolean;          // défaut: true
  className?: string;
}
```

### ModalBody

```ts
interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}
```

### ModalFooter

```ts
interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}
```

## Caractéristiques

- ✅ **Overlay sombre** : Fond noir avec transparence et blur
- ✅ **Style médiéval** : Dégradé parchemin, bordures dorées/marron
- ✅ **Centrage automatique** : Position fixe centrée à l'écran
- ✅ **Scroll interne** : Le body est scrollable si contenu > 70vh
- ✅ **Animations** : Transitions fluides à l'ouverture/fermeture
- ✅ **Accessibilité** :
  - Fermeture avec Escape (configurable)
  - Fermeture au clic sur l'overlay (configurable)
  - Bouton X stylisé
  - Blocage du scroll de la page

## Bonnes pratiques

- Toujours gérer l'état `isOpen` avec `useState` dans le composant parent
- Utiliser `ModalFooter` pour les actions (boutons)
- Privilégier `variant="warning"` ou `variant="danger"` pour les actions critiques
- Désactiver `closeOnOverlayClick` pour les actions irréversibles
- Utiliser `size="sm"` pour les confirmations simples, `md` pour les formulaires
