# BottomSheet

Composant de base pour créer des panels qui slide depuis le bas de l'écran (style Clash Royale / Material Design).

## Caractéristiques

✅ Overlay avec fade in/out  
✅ Animation slide up/down fluide  
✅ Séparation correcte des animations (évite le bug de l'overlay qui glisse)  
✅ Gestion automatique des pointer-events  
✅ Z-index configurable  
✅ Hauteur maximale personnalisable  
✅ Compatible avec tous les composants Panel  

---

## Usage

### Import

```tsx
import { BottomSheet } from '@/ui';
```

### Exemple de base

```tsx
import { BottomSheet, Panel, PanelHeader, PanelBody } from '@/ui';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Ouvrir</button>
      
      <BottomSheet 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        maxHeight="75vh"
      >
        <Panel variant="parchment" padding="none">
          <PanelHeader variant="wood">
            Mon Panel
          </PanelHeader>
          <PanelBody>
            Contenu du panel...
          </PanelBody>
        </Panel>
      </BottomSheet>
    </>
  );
}
```

---

## Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `isOpen` | `boolean` | **requis** | Contrôle l'ouverture/fermeture du panel |
| `onClose` | `() => void` | **requis** | Callback appelé lors de la fermeture |
| `children` | `ReactNode` | **requis** | Contenu du panel (généralement un composant Panel) |
| `maxHeight` | `string` | `'75vh'` | Hauteur maximale du panel (CSS) |
| `zIndex` | `number` | `40` | Z-index du conteneur |
| `className` | `string` | `''` | Classes CSS supplémentaires pour le panel container |

---

## Anatomie de l'animation

Le composant gère deux animations indépendantes :

```
┌─────────────────────────────────┐
│ Conteneur (pointer-events)      │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Overlay (fade in/out)      │ │
│  │ opacity: 0 → 0.5           │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ Panel (slide up/down)      │ │
│  │ translateY: 100% → 0%      │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

**⚠️ Important** : L'overlay et le panel ont des animations séparées pour éviter que l'overlay "glisse" avec le panel.

---

## Exemples

### Panel de gestion (75vh)

```tsx
<BottomSheet 
  isOpen={isManagementOpen} 
  onClose={() => setIsManagementOpen(false)}
  maxHeight="75vh"
  zIndex={50}
>
  <Panel variant="parchment" padding="none" className="rounded-t-3xl">
    <PanelHeader variant="wood">
      <div className="flex items-center justify-between">
        <span>Gestion du Village</span>
        <button onClick={() => setIsManagementOpen(false)}>
          <X size={24} />
        </button>
      </div>
    </PanelHeader>
    <PanelBody>
      {/* Liste scrollable des bâtiments */}
    </PanelBody>
  </Panel>
</BottomSheet>
```

### Panel compact (50vh)

```tsx
<BottomSheet 
  isOpen={isQueueOpen} 
  onClose={() => setIsQueueOpen(false)}
  maxHeight="50vh"
  zIndex={40}
>
  <Panel variant="parchment" padding="none" className="rounded-t-2xl">
    <PanelHeader variant="wood">
      File d'attente
    </PanelHeader>
    <PanelBody>
      {/* Liste de 3 items max */}
    </PanelBody>
  </Panel>
</BottomSheet>
```

### Panel plein écran

```tsx
<BottomSheet 
  isOpen={isDetailsOpen} 
  onClose={() => setDetailsOpen(false)}
  maxHeight="95vh"
  zIndex={60}
>
  <Panel variant="parchment" padding="none" className="rounded-t-3xl">
    <PanelHeader variant="stone">
      Détails complets
    </PanelHeader>
    <PanelBody>
      {/* Contenu complet */}
    </PanelBody>
  </Panel>
</BottomSheet>
```

---

## Bonnes pratiques

### 1. Toujours fournir un bouton de fermeture

```tsx
<PanelHeader variant="wood" className="flex items-center justify-between">
  <div>Titre</div>
  <button onClick={onClose} aria-label="Fermer">
    <X size={24} />
  </button>
</PanelHeader>
```

### 2. Gérer le z-index en fonction de la hiérarchie

```tsx
// Bottom bar: z-30
// Queue panel: z-40
// Building panel: z-50
// Modal: z-60

<BottomSheet zIndex={40}>...</BottomSheet>
```

### 3. Coordonner plusieurs panels

```tsx
// Masquer un panel quand un autre s'ouvre
<BottomSheet 
  isOpen={isQueueOpen && !isBuildingPanelOpen}
  onClose={() => setIsQueueOpen(false)}
>
  {/* Queue panel */}
</BottomSheet>

<BottomSheet 
  isOpen={isBuildingPanelOpen}
  onClose={() => setIsBuildingPanelOpen(false)}
  zIndex={50}
>
  {/* Building panel */}
</BottomSheet>
```

### 4. Utiliser maxHeight adapté au contenu

```tsx
// Peu d'items : 50vh
<BottomSheet maxHeight="50vh">...</BottomSheet>

// Liste moyenne : 75vh
<BottomSheet maxHeight="75vh">...</BottomSheet>

// Quasi plein écran : 90vh
<BottomSheet maxHeight="90vh">...</BottomSheet>
```

---

## Différence avec Modal

| Composant | Position | Animation | Usage |
|-----------|----------|-----------|-------|
| **BottomSheet** | Bas de l'écran | Slide up | Navigation, listes, actions contextuelles |
| **Modal** | Centre de l'écran | Fade + scale | Confirmations, formulaires, alertes |

**Préférer BottomSheet pour** :
- Navigation mobile-first
- Listes d'options
- Panels de gestion
- Actions contextuelles

**Préférer Modal pour** :
- Confirmations importantes
- Formulaires courts
- Alertes critiques

---

## Accessibilité

- L'overlay a `aria-hidden="true"` car non focusable
- Penser à ajouter `role="dialog"` sur le Panel si nécessaire
- Gérer le focus trap si le contenu a des inputs
- Ajouter `aria-label` sur le bouton de fermeture

---

## Architecture technique

### Pourquoi séparer les animations ?

**Problème initial** :
```tsx
// ❌ Le transform sur le parent affecte tous les enfants
<div className="transform translate-y-full">
  <div className="overlay" /> {/* Glisse avec le parent! */}
  <div className="panel" />
</div>
```

**Solution** :
```tsx
// ✅ Le transform est uniquement sur le panel
<div className="fixed inset-0">
  <div className="overlay transition-opacity" /> {/* Fade uniquement */}
  <div className="panel transform translate-y-full" /> {/* Slide uniquement */}
</div>
```

### Pointer-events

Le `pointer-events-none` sur le conteneur parent quand fermé permet d'éviter que l'overlay (invisible) bloque les clics.

---

## Migration depuis l'ancien pattern

**Avant** :
```tsx
<div className="fixed inset-0 z-40 transform transition-all translate-y-full">
  <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
  <div className="absolute bottom-0">
    <Panel>...</Panel>
  </div>
</div>
```

**Après** :
```tsx
<BottomSheet isOpen={isOpen} onClose={onClose} zIndex={40}>
  <Panel>...</Panel>
</BottomSheet>
```

---

## Maintenance

- **Auteur** : Kelvin Dupont
- **Version** : 1.0.0
- **Date** : 2025-01-06
- **Fichier** : `src/ui/panels/BottomSheet.tsx`
