import { Sparkles } from 'lucide-react';
import {
  BUILDING_UNLOCK_REQUIREMENTS,
  type BuildingType,
} from '@battleforthecrown/shared/village/buildings';
import { metaFor } from '../buildingMeta';

interface BuildingUnlockPreviewProps {
  /** Castle level the player will reach after the upgrade. */
  nextCastleLevel: number;
}

export function BuildingUnlockPreview({ nextCastleLevel }: BuildingUnlockPreviewProps) {
  const unlocked = (Object.entries(BUILDING_UNLOCK_REQUIREMENTS) as Array<[BuildingType, number]>)
    .filter(([, required]) => required === nextCastleLevel)
    .map(([type]) => type);

  if (unlocked.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border-2 border-game-blue-border/40 bg-game-blue-light/10 p-4">
      <div className="flex items-center gap-2 text-game-blue-darker">
        <Sparkles size={18} className="text-game-gold-dark" />
        <p className="font-cinzel text-sm font-bold uppercase tracking-wide">
          Prochain déblocage — Château niv. {nextCastleLevel}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {unlocked.map((type) => {
          const meta = metaFor(type);
          return (
            <div
              key={type}
              className="flex items-center gap-2 rounded-lg border border-game-blue-border/30 bg-white/50 p-2"
            >
              {meta.iconPath ? (
                <img
                  src={meta.iconPath}
                  alt={meta.label}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              ) : (
                <span aria-hidden className="text-2xl">
                  {meta.emoji}
                </span>
              )}
              <span className="font-cinzel text-sm text-kingdom-900">{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
