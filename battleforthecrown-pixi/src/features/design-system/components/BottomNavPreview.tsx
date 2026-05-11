import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PreviewTab = string;

export interface BottomNavPreviewItem {
  id: PreviewTab;
  label: string;
  locked?: boolean;
  badge?: number;
  Icon: LucideIcon;
  onClick?: () => void;
}

export interface BottomNavPreviewProps {
  active?: PreviewTab;
  className?: string;
  items: BottomNavPreviewItem[];
}

export function BottomNavPreview({
  active = 'buildings',
  className,
  items,
}: BottomNavPreviewProps) {
  return (
    <nav
      className={cn(
        'flex w-full justify-around rounded-xl border-t-2 border-[#8b7355] bg-gradient-to-t from-[#3c2619]/95 via-[#4e3822]/90 to-[#6b4b2b]/85 px-3 py-2 shadow-[0_-6px_18px_rgba(0,0,0,0.45)] backdrop-blur-md',
        className,
      )}
    >
      {items.map(({ id, label, locked, badge, Icon, onClick }) => {
        const isActive = id === active;
        return (
          <button key={id} className="flex flex-col items-center gap-0.5 px-1.5" onClick={onClick}>
            <span
              className={cn(
                'relative flex size-10 items-center justify-center rounded-full border-2 text-white',
                locked
                  ? 'border-[#59554b] bg-gradient-to-b from-[#a5a29a] to-[#6f6c63] opacity-55'
                  : isActive
                    ? 'border-[#f4d88d] bg-gradient-to-b from-[#f6d57b] to-[#c59e3f] shadow-[0_0_16px_rgba(250,224,120,0.55)]'
                    : 'border-[#6a5033] bg-gradient-to-b from-[#8b6f47] to-[#5d4a32]',
              )}
            >
              <Icon className="size-[18px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" strokeWidth={2} />
              {badge ? (
                <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-lg border border-white bg-[#c0392b] px-1 font-game text-[9px] font-bold leading-none text-white">
                  {badge}
                </span>
              ) : null}
            </span>
            <span className={cn('font-game text-[10px] font-semibold text-[#f0e0c0]', locked && 'opacity-60')}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
