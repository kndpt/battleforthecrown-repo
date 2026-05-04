import { ResourceIcon } from '../common/ResourceIcon';

export interface PopulationIndicatorProps {
  availablePopulation?: number;
  loading?: boolean;
  className?: string;
}

export const PopulationIndicator = ({
  availablePopulation,
  loading = false,
  className = '',
}: PopulationIndicatorProps) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <ResourceIcon resource="population" size={18} fallbackToEmoji={true} />
      <span className="font-bold font-cinzel text-right text-sm text-white">
        {loading ? '...' : (availablePopulation ?? 0)}
      </span>
    </div>
  );
};

PopulationIndicator.displayName = 'PopulationIndicator';
