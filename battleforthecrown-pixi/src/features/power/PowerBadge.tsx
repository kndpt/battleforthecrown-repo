import { Badge } from '@/ui';

interface PowerBadgeProps {
  value: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Badge affichant la puissance totale du joueur. Cliquable pour ouvrir
 * un détail (PowerBottomSheet — Phase 9.D).
 */
export function PowerBadge({ value, onClick, className = '' }: PowerBadgeProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-center hover:scale-105 transition-transform cursor-pointer ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Puissance totale: ${value}`}
    >
      <Badge variant="warning" size="md">
        ⚜️ {value.toLocaleString()}
      </Badge>
    </div>
  );
}
