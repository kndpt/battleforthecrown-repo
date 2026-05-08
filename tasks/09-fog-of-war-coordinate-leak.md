# 09 — Fog of war : positions des entités cachées exposées au client

**Sévérité** : 🟡 Majeure
**Workspace(s)** : `battleforthecrown-backend`, `packages/shared`
**Tags** : security, fog-of-war, data-leak, design-intent

## Contexte

Trouvé en écrivant le smoke fog of war (ticket 02). Quand une entité (village barbare, futur autre joueur) est en dehors de tous les vision disks du joueur, `VisionService.applyFogOfWar` la **garde dans le payload** mais remplace le data utile par `{ kind: 'fogged', id, x, y }`. L'`id` et les coordonnées `x, y` sortent en clair. Selon l'intent design, ça peut être :

- **OK** : convention type Tribal Wars / KingsAge — "il y a quelque chose ici, mais on ne sait pas quoi". Connaître la position est attendu.
- **PAS OK** : si le but du fog est de cacher *où* sont les ennemis (pour que le joueur découvre la map), exposer x,y de tout barbare/joueur du monde dès la première requête `/world/:id/entities` annule le fog.

Le contrat de fog of war est incohérent : on cache `tier`, `name`, `villageId` (data interne) mais on garde l'`id` de l'entity et les coords. Un client malveillant scrape `/world/:id/entities` une fois et obtient la **map complète** des positions ennemies.

## État actuel

`src/modules/world/vision.service.ts:62-73` :

```ts
applyFogOfWar<T extends PositionedEntity>(
  entities: readonly T[],
  disks: readonly VisionDisk[],
): FogResult<T>[] {
  if (disks.some((d) => d.radius === null)) {
    return [...entities];   // master vision : tout visible
  }
  return entities.map<FogResult<T>>((entity) => {
    if (this.isInVision(entity, disks)) return entity;
    return { kind: 'fogged', id: entity.id, x: entity.x, y: entity.y };
  });
}
```

Et le fog est appliqué dans `WorldController.getWorldEntities` → `applyFogIfEnabled` → `applyFogOfWar`. Donc tout ce qui sort de `/world/:id/entities` passe par cette transformation.

Sample reçu par le client (smoke fog) :
```json
[{ "kind": "fogged", "id": "cmoxblzst000c...", "x": 250, "y": 250 }, ...]
```

Le client connaît :
- `id` : peut servir à corréler avec d'autres requêtes (info disclosure)
- `x, y` : position **exacte** de l'entité

## Pistes

### A. Confirmer que c'est intentionnel + documenter

- Si l'intent est "voir qu'il y a quelque chose mais pas quoi" (style TW), c'est OK.
- Coller un commentaire dans `vision.service.ts` qui le confirme + ajouter une mention dans `docs/architecture/realtime.md` ou `decisions.md`.
- Coût : ~10 min.

### B. Cacher `x, y` aussi (vraie fog)

- Retourner `{ kind: 'fogged', id: <hash> }` ou simplement omettre l'entité du payload.
- Avantage : le client ne sait rien des entités hors vision.
- Risque : le frontend Pixi doit toujours afficher un overlay "brouillard" sur les zones non explorées. Sans coordonnées, comment dessiner ce overlay ?
  - Solution : envoyer un masque `exploredAreas[]` (rectangles ou tiles ID) dérivé des vision disks, sans révéler le contenu.

### C. Compromis : cacher `x, y` mais garder une entrée vague par tile

- Pour chaque tile dans la zone "monde mais hors vision", retourner `{ kind: 'fog' }` (sans id, sans coords précises). C'est seulement les tiles **dans la vision** qui livrent du detail.
- Demande de basculer le contrat de l'API : le payload est tile-centric, pas entity-centric.
- Coût : refactor ~moyen côté `WorldEntitiesQueryService` + adaptation pixi.

### D. Cacher l'`id` aussi, garder x/y

- Retourner `{ kind: 'fogged', x, y }` sans id. Le client sait qu'il y a quelque chose mais ne peut pas tracker une entité spécifique entre 2 requêtes.
- Avantage : minimal change.
- Risque : si l'entité reste hors vision et bouge (pas le cas actuel pour villages, mais armées potentiellement), le client perd la corrélation — c'est OK pour le fog.

## Question à trancher

Avant tout : **l'intent design**. C'est :

1. *"Voir qu'il y a un village sans en savoir plus"* (style TW/KingsAge classique) → A suffit, c'est volontaire.
2. *"Découvrir la map au fur et à mesure de l'exploration"* → leak réel, B/C/D nécessaire.

À décider en relation avec le gameplay visé.

## Dimensions à valider en sortie

- Décision claire (1 ou 2) consignée dans `docs/architecture/decisions.md` ou `docs/gameplay/`.
- Si A : commentaire JSDoc sur `applyFogOfWar` qui explicite le contrat retourné.
- Si B/C/D : smoke fog mis à jour pour asserter le nouveau contrat. Audit pixi pour voir si le frontend dépend des coords fogged (probable — pour positionner le brouillard) et adapter.

## Tickets liés

- [02 — Smoke tests](./archive/02-smoke-tests-strategy.md) ✅ — le smoke fog asserte aujourd'hui que `kind === 'fogged'` ; à durcir si la décision change le payload.
