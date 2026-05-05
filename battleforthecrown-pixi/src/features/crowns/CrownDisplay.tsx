import { useMemo } from 'react';
import { Tooltip } from '@/ui';
import { useDisplayCrowns } from '@/features/resources/useDisplayResources';
import { useAuthStore } from '@/stores/auth';
import { useGameStore } from '@/stores/game';

const crownFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function CrownDisplay() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const worldId = useGameStore((state) => state.worldId);
  const { balance, productionRate } = useDisplayCrowns(userId, worldId);

  const formattedBalance = useMemo(() => {
    const safe = Number.isFinite(balance ?? NaN) ? (balance ?? 0) : 0;
    return crownFormatter.format(Math.floor(safe));
  }, [balance]);

  const formattedProductionRate = useMemo(() => {
    if (!Number.isFinite(productionRate ?? NaN) || (productionRate ?? 0) <= 0) {
      return null;
    }
    return crownFormatter.format(Math.floor(productionRate ?? 0));
  }, [productionRate]);

  const tooltipContent = useMemo(
    () => (
      <div className="text-center space-y-1">
        <div className="font-cinzel font-bold text-sm text-white">Couronnes</div>
        <div className="text-xs text-white/80">Stock : {formattedBalance}</div>
        {formattedProductionRate && (
          <div className="text-xs text-emerald-200">+{formattedProductionRate} / h</div>
        )}
      </div>
    ),
    [formattedBalance, formattedProductionRate],
  );

  return (
    <Tooltip content={tooltipContent} position="bottom" variant="dark">
      <div className="flex items-center gap-1">
        <img
          src="/assets/crown.png"
          alt="Couronnes"
          width={20}
          height={20}
          className="w-6 h-6"
        />
        <div className="flex flex-col">
          <span className="font-bold text-sm text-white font-cinzel">{formattedBalance}</span>
        </div>
      </div>
    </Tooltip>
  );
}
