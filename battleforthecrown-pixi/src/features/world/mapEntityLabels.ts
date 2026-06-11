import type { MapEntity } from '@/api/world-types';

export function mapEntityCalloutSubtitle(entity: MapEntity): string {
  if (entity.kind === 'BARBARIAN_VILLAGE') return 'Inhabité · pillable';
  if (entity.kind === 'PLAYER_VILLAGE') {
    if (entity.isMine) return 'Mon village';
    if (entity.ownerDisplayName) return `${entity.ownerDisplayName} · Village joueur`;
    return 'Village joueur';
  }
  return 'Entité';
}

/** Canvas label when a village is selected or owned (Pixi multiline). */
export function mapEntityCanvasLabel(entity: MapEntity): string {
  if (
    entity.kind === 'PLAYER_VILLAGE'
    && !entity.isMine
    && entity.ownerDisplayName
  ) {
    return `${entity.name}\n${entity.ownerDisplayName}`;
  }
  return entity.name;
}
