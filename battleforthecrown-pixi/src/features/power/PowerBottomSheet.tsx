import { BottomSheet, Spinner } from '@/ui';
import { GameBottomSheetPanel } from '@/features/design-system/components';
import { useKingdomPowerQuery, useVillagePowerQuery } from '@/api/queries';
import { useGameStore } from '@/stores/game';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';
import { PowerBreakdown } from './PowerBreakdown';

interface PowerBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const numberFormatter = new Intl.NumberFormat('fr-FR');

function formatNumber(value: number): string {
  return numberFormatter.format(Math.max(0, Math.floor(value)));
}

function villageTierFromPower(power: number): number {
  if (power >= 2500) return 5;
  if (power >= 1500) return 4;
  if (power >= 800) return 3;
  if (power >= 300) return 2;
  return 1;
}

function AssetMedallion({
  alt,
  className,
  src,
}: {
  alt?: string;
  className?: string;
  src: string;
}) {
  return (
    <div
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-[12px] border-2 border-[#5d4a32] bg-[linear-gradient(to_bottom,#d9c896,#a67c52)] shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_2px_0_rgba(0,0,0,.2)]',
        className,
      )}
    >
      <img
        alt={alt ?? ''}
        className="size-9 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,.38)]"
        src={publicAsset(src)}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border-2 border-[#a67c52] bg-[linear-gradient(to_bottom,rgba(255,255,255,.45),rgba(213,182,128,.45))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_2px_0_rgba(0,0,0,.14)]">
      <img alt="" className="size-7 shrink-0 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]" src={publicAsset(icon)} />
      <div className="min-w-0">
        <div className="font-game text-[13px] font-extrabold leading-[1.1] tabular-nums text-[#3d2f1f]">
          {formatNumber(value)}
        </div>
        <div className="mt-0.5 truncate font-game text-[8.5px] font-bold uppercase tracking-[.16em] text-[#6d5838]">
          {label}
        </div>
      </div>
    </div>
  );
}

export function PowerBottomSheet({ isOpen, onClose }: PowerBottomSheetProps) {
  const villageId = useGameStore((state) => state.villageId);
  const kingdom = useKingdomPowerQuery();
  const village = useVillagePowerQuery(villageId);
  const kingdomPower = kingdom.data?.kingdomPower ?? 0;
  const buildingPower = kingdom.data?.totalBuildings ?? 0;
  const armyPower = kingdom.data?.totalArmy ?? 0;
  const activeVillageTotal = village.data?.total ?? 0;
  const activeVillageName = kingdom.data?.villages.find((item) => item.villageId === villageId)?.villageName;
  const villageTier = villageTierFromPower(activeVillageTotal);

  return (
    <BottomSheet className="mx-auto max-w-[32rem]" isOpen={isOpen} onClose={onClose} maxHeight="64vh">
      <GameBottomSheetPanel
        bodyClassName="px-3.5 pb-4 pt-3"
        className="max-h-[64vh]"
        closeLabel="Fermer"
        eyebrow="Royaume"
        onClose={onClose}
        title="Puissance du royaume"
      >
        <div className="space-y-3">
          <div className="rounded-[12px] border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.95),rgba(78,56,34,.95))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_2px_0_rgba(0,0,0,.18)]">
            <div className="flex items-center gap-3">
              <AssetMedallion
                className="border-[#7a5200] bg-[linear-gradient(to_bottom,#f6d57b,#c9900c)]"
                src="/assets/power.png"
              />
              <div className="min-w-0 flex-1">
                <div className="font-game text-[9.5px] font-bold uppercase leading-none tracking-[.26em] text-[#cdb88a]">
                  Force cumulée
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {kingdom.isLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className="font-game text-[30px] font-extrabold leading-none tabular-nums text-[#f6d57b] [text-shadow:1px_2px_2px_rgba(0,0,0,.55)]">
                      {formatNumber(kingdomPower)}
                    </span>
                  )}
                </div>
                <div className="mt-1 font-game text-[11px] font-bold text-[#f0e0c0]">
                  {kingdom.data
                    ? `${kingdom.data.villageCount} village${kingdom.data.villageCount > 1 ? 's' : ''} dans ce monde`
                    : 'Calcul du royaume'}
                </div>
              </div>
              <img alt="" className="size-8 shrink-0 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,.45)]" src={publicAsset('/assets/casual-icons/crown.png')} />
            </div>
          </div>

          {kingdom.data && (
            <div className="flex gap-2">
              <MetricCard
                icon="/assets/castle.png"
                label="Bâtiments"
                value={buildingPower}
              />
              <MetricCard
                icon="/assets/army-power.png"
                label="Armée"
                value={armyPower}
              />
            </div>
          )}

          <section className="rounded-[12px] border-2 border-[#a67c52] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_2px_0_rgba(0,0,0,.12)]">
            <div className="flex items-center gap-2.5">
              <AssetMedallion
                className="size-11 rounded-[11px]"
                src={`/assets/world/entity/village-tier${villageTier}.png`}
              />
              <div className="min-w-0 flex-1">
                <div className="font-game text-[9.5px] font-bold uppercase tracking-[.24em] text-[#6d5838]">
                  Village actif
                </div>
                <div className="truncate font-game text-[15px] font-extrabold text-[#3d2f1f] [text-shadow:0_1px_0_rgba(255,255,255,.45)]">
                  {activeVillageName ?? 'Village sélectionné'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-game text-[18px] font-extrabold leading-none tabular-nums text-[#3d2f1f]">
                  {village.isLoading ? '…' : formatNumber(activeVillageTotal)}
                </div>
              </div>
            </div>
            {village.isLoading ? (
              <div className="flex justify-center pt-3">
                <Spinner size="sm" />
              </div>
            ) : (
              <PowerBreakdown
                buildings={village.data?.buildings ?? 0}
                army={village.data?.army ?? 0}
                className="mt-3 border-t border-[rgba(166,124,82,.38)] pt-2.5"
              />
            )}
          </section>
        </div>
      </GameBottomSheetPanel>
    </BottomSheet>
  );
}
