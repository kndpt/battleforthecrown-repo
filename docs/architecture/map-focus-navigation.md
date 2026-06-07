# Navigation focus carte monde

La carte monde expose un contrat de navigation interne pour ouvrir `/game/world` centrée sur des coordonnées connues. Le contrat est volontairement **coordonnées-first** : il ne sélectionne pas d'entité et fonctionne même si la cible est masquée par le fog-of-war.

## Contrat URL

Le contrat public lisible est :

```text
/game/world?focusX=<x>&focusY=<y>
```

- `focusX` : coordonnée monde X finie.
- `focusY` : coordonnée monde Y finie.
- Les autres query params sont préservés quand le focus est consommé ou remplacé.
- Après application par `WorldMapScreen`, `focusX` et `focusY` sont retirés avec `replace` pour éviter de rejouer le focus à chaque navigation historique.

## API frontend à utiliser

Les callsites React doivent passer par `useWorldMapNavigation()` depuis `battleforthecrown-pixi/src/features/world/worldMapNavigation.ts`.

```tsx
const { navigateToWorldMapFocus } = useWorldMapNavigation();

navigateToWorldMapFocus({ x: report.targetX, y: report.targetY });
```

Le hook :

1. écrit le focus dans l'URL pour garder un deeplink debug/reload-friendly ;
2. alimente `pendingFocus` dans `useWorldMapStore` comme pont runtime interne, utile si la carte ou son canvas ne sont pas encore prêts ;
3. conserve les query params non liés au focus quand l'utilisateur est déjà sur `/game/world`.

Les callsites ne doivent pas dupliquer le pattern `setPendingFocus(...); navigate('/game/world')`.

## Consommation par `WorldMapScreen`

`WorldMapScreen` est le consommateur unique du focus carte :

1. il parse `focusX` / `focusY` depuis l'URL ;
2. il retombe sur `pendingFocus` si aucun focus URL valide n'existe ;
3. il attend que `WorldMapCanvas` expose `centerOn` ;
4. il demande le recentrage au canvas Pixi ;
5. il nettoie le `pendingFocus` consommé et les query params `focusX` / `focusY` sans supprimer les autres paramètres.

Pixi conserve la source de vérité caméra : React demande un recentrage, mais `pixi-viewport` reste propriétaire de la position réelle.

## Fog-of-war et sélection

Le focus ne sélectionne jamais automatiquement un village. Si les coordonnées pointent vers une entité hors vision ou un blip fog-of-war, la caméra se centre uniquement sur `{ x, y }`. `WorldMapScreen` efface la sélection courante au moment du focus pour éviter d'afficher un panneau ou tooltip sans rapport avec la nouvelle zone.

## Exemples de callsites

### Rapport de combat

```tsx
navigateToWorldMapFocus({ x: report.targetX, y: report.targetY });
```

Cette action ouvre `/game/world?focusX=<targetX>&focusY=<targetY>` depuis l'inbox puis centre la caméra sur le village cible du rapport.

### Modal de victoire conquête

```tsx
navigateToWorldMapFocus({ x: victory.x, y: victory.y });
```

Le CTA « Voir le village » réutilise la même primitive au lieu d'appeler directement le store carte.
