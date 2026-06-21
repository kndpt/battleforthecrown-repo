import { LocateFixed, Minus, Plus, type LucideIcon } from 'lucide-react';

// Pas de zoom par clic (>1 zoom in, <1 zoom out). Ajuster ici pour changer la
// vivacité des boutons +/−.
const ZOOM_IN_FACTOR = 1.35;
const ZOOM_OUT_FACTOR = 1 / ZOOM_IN_FACTOR;

interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  recenterDisabled?: boolean;
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-12 items-center justify-center rounded-2xl border-[1.5px] border-[#1d1408]/85 bg-gradient-to-b from-[rgba(84,64,31,0.99)] to-[rgba(46,33,18,0.8)] text-game-gold-light shadow-game-inset outline-none backdrop-blur-[10px] transition-all duration-100 hover:brightness-125 active:translate-y-0.5 active:shadow-game-pressed disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={22} strokeWidth={2.5} />
    </button>
  );
}

export function MapZoomControls({
  onZoomIn,
  onZoomOut,
  onRecenter,
  recenterDisabled,
}: MapZoomControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <ControlButton icon={Plus} label="Zoomer" onClick={onZoomIn} />
      <ControlButton icon={Minus} label="Dézoomer" onClick={onZoomOut} />
      <ControlButton
        icon={LocateFixed}
        label="Recentrer sur mon village"
        onClick={onRecenter}
        disabled={recenterDisabled}
      />
    </div>
  );
}

export { ZOOM_IN_FACTOR, ZOOM_OUT_FACTOR };
