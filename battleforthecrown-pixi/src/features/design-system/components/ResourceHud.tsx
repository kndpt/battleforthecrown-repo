import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export interface ResourceHudItem {
  icon: string;
  label: string;
  value: string;
  low?: boolean;
}

export interface ResourceHudProps {
  items: ResourceHudItem[];
  className?: string;
}

export function ResourceHud({ items, className }: ResourceHudProps) {
  return (
    <div className={cn('flex w-full items-stretch gap-2.5', className)}>
      {items.map((item) => (
        <div
          key={`${item.icon}-${item.value}`}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border-2 px-2.5 py-1.5',
            item.low
              ? 'border-[#a93226] bg-gradient-to-b from-[#e74c3c]/25 to-black/40'
              : 'border-white/15 bg-black/35',
          )}
        >
          <img
            alt=""
            className="size-7 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
            src={publicAsset(item.icon)}
          />
          <div className="flex min-w-0 flex-col leading-[1.1]">
            <span className={cn('truncate font-game text-sm font-bold text-white text-shadow-game', item.low && 'text-[#ffe2dc]')}>
              {item.value}
            </span>
            <span className="truncate font-game text-[10px] text-[#cdb88a]">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
