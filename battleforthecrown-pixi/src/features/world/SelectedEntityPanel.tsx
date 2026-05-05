import { X } from 'lucide-react';
import { Badge, Button, IconButton, Panel, PanelBody, PanelHeader } from '@/ui';
import type { MapEntity } from '@/api/world-types';

interface SelectedEntityPanelProps {
  entity: MapEntity | null;
  onClose: () => void;
}

const KIND_LABEL: Record<MapEntity['kind'], string> = {
  PLAYER_VILLAGE: 'Village joueur',
  BARBARIAN_VILLAGE: 'Village barbare',
  OTHER: 'Entité',
};

const TIER_BADGE: Record<NonNullable<MapEntity['tier']>, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  T1: { label: 'Tier 1', variant: 'success' },
  T2: { label: 'Tier 2', variant: 'warning' },
  T3: { label: 'Tier 3', variant: 'error' },
};

export function SelectedEntityPanel({ entity, onClose }: SelectedEntityPanelProps) {
  if (!entity) return null;

  const tierInfo = entity.tier ? TIER_BADGE[entity.tier] : null;

  return (
    <div className="pointer-events-auto w-full max-w-xs">
      <Panel variant="stone" padding="none" className="shadow-lg">
        <PanelHeader variant="default" className="!py-2">
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex-1">
              <p className="text-[10px] font-cinzel uppercase tracking-widest text-game-gold-light">
                {KIND_LABEL[entity.kind]}
              </p>
              <h2 className="font-cinzel text-base text-white text-shadow-game">{entity.name}</h2>
            </div>
            <IconButton
              size="sm"
              variant="danger"
              icon={X}
              label="Fermer"
              onClick={onClose}
            />
          </div>
        </PanelHeader>

        <PanelBody className="p-3 space-y-3 text-sm text-white">
          {tierInfo && (
            <Badge variant={tierInfo.variant} size="sm">
              {tierInfo.label}
            </Badge>
          )}

          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-white/60">Coord. X</dt>
              <dd className="font-bold tabular-nums">{entity.x}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-white/60">Coord. Y</dt>
              <dd className="font-bold tabular-nums">{entity.y}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[10px] uppercase tracking-widest text-white/60">Propriétaire</dt>
              <dd>
                {entity.isMine
                  ? 'Toi'
                  : entity.kind === 'BARBARIAN_VILLAGE'
                    ? 'Barbare'
                    : 'Inconnu'}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            {!entity.isMine && entity.kind !== 'OTHER' && (
              <Button variant="danger" size="sm" disabled title="Disponible en Phase 6">
                Attaquer (Phase 6)
              </Button>
            )}
            {entity.isMine && (
              <Button variant="info" size="sm" disabled title="Disponible en Phase 5">
                Entrer dans le village (Phase 5)
              </Button>
            )}
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}
