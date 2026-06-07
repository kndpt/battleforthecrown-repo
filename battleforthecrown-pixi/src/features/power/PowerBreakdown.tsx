import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export interface PowerBreakdownProps {
  buildings: number;
  army: number;
  className?: string;
}

const SECTIONS = [
  {
    key: 'buildings' as const,
    icon: '/assets/castle.png',
  },
  {
    key: 'army' as const,
    icon: '/assets/army-power.png',
  },
] as const;

const numberFormatter = new Intl.NumberFormat('fr-FR');

export function PowerBreakdown({
  buildings,
  army,
  className,
}: PowerBreakdownProps) {
  const values = { buildings, army };

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {SECTIONS.map((section) => {
        const value = values[section.key];

        return (
          <div
            className="flex min-w-0 items-center gap-1.5"
            key={section.key}
          >
            <img
              alt=""
              className="size-5 shrink-0 object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.3)]"
              src={publicAsset(section.icon)}
            />
            <div className="min-w-0 flex-1">
              <div className="font-game text-[14px] font-extrabold leading-none tabular-nums text-[#3d2f1f]">
                {numberFormatter.format(value)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
