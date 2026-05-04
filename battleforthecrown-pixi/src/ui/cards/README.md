# Card

Carte stylisée avec effet 3D "clay" dans un thème médiéval, composable avec bannière, image, stats et footer d'actions.

## Composants

- **`Card`** : Conteneur principal avec effet 3D et variants
- **`CardBanner`** : Bannière supérieure avec pointes latérales
- **`CardBody`** : Corps de la carte avec padding
- **`CardFooter`** : Footer pour les actions (toujours présent)
- **`CardImage`** : Image/figure centrée avec drop-shadow
- **`CardTitle`** : Titre stylisé Cinzel avec ombre
- **`CardStats`** : Encart stats avec encoches latérales
- **`StatsContent`** : Contenu formaté pour CardStats

## Variants

| Variant     | Style                    | Usage recommandé                  |
|-------------|--------------------------|-----------------------------------|
| `parchment` | Beige parchemin (défaut) | Cartes standard, infos générales  |
| `default`   | Gris bleuté clay         | Cartes UI modernes                |
| `stone`     | Gris pierre              | Bâtiments en pierre, défense      |
| `wood`      | Marron bois              | Bâtiments en bois, ressources     |

## Tailles (Mobile-First)

| Size    | Comportement                        | Usage                                      |
|---------|-------------------------------------|--------------------------------------------|
| `fluid` | `100%` largeur (défaut)             | Prend toute la largeur du conteneur parent |
| `sm`    | `100%` + max `280px` sur desktop    | Petites cartes, résumés                    |
| `md`    | `100%` + max `360px` sur desktop    | Cartes standards                           |
| `lg`    | `100%` + max `440px` sur desktop    | Cartes détaillées                          |
| `xl`    | `100%` + max `520px` sur desktop    | Grandes cartes, vues complexes             |

**Note mobile-first** : Toutes les tailles (sauf `fluid`) prennent `100%` sur mobile et sont limitées par une `max-width` sur desktop. Cela garantit une adaptation parfaite à tous les écrans. Utilisez `size="fluid"` (défaut) pour des cartes dans des grilles responsive (ex: `grid grid-cols-2`).

## Exemple d'utilisation

```tsx
import { 
  Card, CardBanner, CardBody, CardFooter, 
  CardImage, CardTitle, CardStats, StatsContent, Button 
} from '@/ui';

<Card variant="parchment">  {/* size="fluid" par défaut (mobile-first) */}
  <CardBanner variant="warning">UPGRADE</CardBanner>
  <CardBody>
    <CardImage src="/buildings/archery.png" alt="Archery" />
    <CardTitle>Archerie</CardTitle>
    <CardStats>
      <StatsContent value="420 + 100" label="LVL 1 → LVL 3" />
    </CardStats>
  </CardBody>
  <CardFooter>
    <Button variant="info" size="lg">10.000 G</Button>
  </CardFooter>
</Card>
```

> **Voir la démo :** `/ui-test` pour tous les variants et bannières en action.

## Props

### Card

```ts
interface CardProps {
  variant?: 'default' | 'parchment' | 'stone' | 'wood';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fluid';
  children: ReactNode;
  className?: string;
}
```

### CardBanner

```ts
interface CardBannerProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  children: ReactNode;
}
```

### CardImage

```ts
interface CardImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### CardStats & StatsContent

```ts
interface CardStatsProps {
  children: ReactNode;
  className?: string;
}

interface StatsContentProps {
  value: string | ReactNode;
  label?: string;
}
```

## Caractéristiques

- ✅ **Effet 3D "clay"** : Liseré interne + ombres pour relief
- ✅ **Bordure double** : Border + outline pour effet épais
- ✅ **Bannière PNG** : Image de bannière médiévale avec texte par-dessus
- ✅ **Text-shadow coloré** : Ombres de texte adaptées aux variants de bannière
- ✅ **CardStats avec encoches** : Puit stylisé avec encoches latérales
- ✅ **Drop-shadow sur images** : Effet de profondeur
- ✅ **Composabilité totale** : Assembler librement les sous-composants
- ✅ **Footer obligatoire** : Toujours présent pour les actions

## Bonnes pratiques

- Toujours inclure un `CardFooter` avec au moins un bouton d'action
- Utiliser `CardBanner` pour les états importants (upgrade, nouveau, victoire)
- Privilégier `CardStats` pour les valeurs numériques (stats, coûts, niveaux)
- Adapter le `variant` au thème du contenu (wood pour bois, stone pour pierre)
- **Mobile-first** : Omettre `size` (ou utiliser `size="fluid"`) pour des cartes adaptatives
- Utiliser `size="sm/md/lg/xl"` uniquement pour limiter la largeur max sur desktop
- Garder le contenu du `CardBody` concis et centré
