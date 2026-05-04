import { Button } from '@/ui/buttons';
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

const TIER_LABEL: Record<NonNullable<MapEntity['tier']>, { label: string; color: string }> = {
  T1: { label: 'Tier 1', color: 'text-game-green-light' },
  T2: { label: 'Tier 2', color: 'text-game-gold-light' },
  T3: { label: 'Tier 3', color: 'text-game-red-light' },
};

export function SelectedEntityPanel({ entity, onClose }: SelectedEntityPanelProps) {
  if (!entity) return null;

  const tierInfo = entity.tier ? TIER_LABEL[entity.tier] : null;

  return (
    <aside className="pointer-events-auto w-full max-w-xs rounded-md border-2 border-game-gold-border bg-[#1a120b]/95 p-4 text-sm text-parchment shadow-game-inset">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-game-gold-light">
            {KIND_LABEL[entity.kind]}
          </p>
          <h2 className="font-game text-lg text-game-gold-light text-shadow-game">{entity.name}</h2>
          {tierInfo && (
            <p className={`text-xs uppercase tracking-widest ${tierInfo.color}`}>{tierInfo.label}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs uppercase tracking-widest text-parchment/70 hover:text-game-gold-light"
          aria-label="Fermer"
        >
          ✕
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-parchment/60">Coord. X</dt>
          <dd className="font-bold tabular-nums">{entity.x}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-widest text-parchment/60">Coord. Y</dt>
          <dd className="font-bold tabular-nums">{entity.y}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[10px] uppercase tracking-widest text-parchment/60">Propriétaire</dt>
          <dd>{entity.isMine ? 'Toi' : entity.kind === 'BARBARIAN_VILLAGE' ? 'Barbare' : 'Inconnu'}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-col gap-2">
        {!entity.isMine && entity.kind !== 'OTHER' ? (
          <Button variant="danger" size="sm" disabled title="Disponible en Phase 6">
            Attaquer (Phase 6)
          </Button>
        ) : null}
        {entity.isMine && (
          <Button variant="info" size="sm" disabled title="Disponible en Phase 5">
            Entrer dans le village (Phase 5)
          </Button>
        )}
      </div>
    </aside>
  );
}
