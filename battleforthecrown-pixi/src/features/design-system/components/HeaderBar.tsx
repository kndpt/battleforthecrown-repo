import { Settings } from 'lucide-react';
import { Avatar, type AvatarProps } from './Avatar';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface HeaderBarPill {
  icon: string;
  value: string;
}

export interface HeaderBarProps {
  avatar: AvatarProps;
  className?: string;
  onSettings?: () => void;
  primary: HeaderBarPill[];
  resources: HeaderBarPill[];
}

function HeaderPill({ icon, value }: HeaderBarPill) {
  return (
    <span className="inline-flex h-[23px] min-w-[72px] items-center justify-center gap-1 rounded-full border-2 border-white/15 bg-black/35 px-1.5 font-game text-[11px] font-bold tabular-nums text-white text-shadow-game">
      <img alt="" className="size-3.5 shrink-0" src={publicAsset(icon)} />
      {value}
    </span>
  );
}

export function HeaderBar({ avatar, className, onSettings, primary, resources }: HeaderBarProps) {
  return (
    <header className={cn('flex w-full items-center gap-2 rounded-[10px] border-2 border-[#8b7355] bg-gradient-to-b from-[#3c2619]/85 to-[#4e3822]/85 p-2', className)}>
      <Avatar {...avatar} size="md" />
      <div className="grid min-w-0 flex-1 gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex flex-nowrap gap-1.5">{primary.map((pill) => <HeaderPill key={`${pill.icon}-${pill.value}`} {...pill} />)}</span>
        </div>
        <div className="flex min-w-0 flex-nowrap gap-1.5 overflow-hidden">
          {resources.map((pill) => <HeaderPill key={`${pill.icon}-${pill.value}`} {...pill} />)}
        </div>
      </div>
      <button
        aria-label="Paramètres"
        className="grid size-[34px] shrink-0 place-items-center rounded-lg border-2 border-[#5d4a32] bg-gradient-to-b from-[#8b6f47] to-[#5d4a32] text-[#f5e6d3] shadow-game-inset"
        onClick={onSettings}
        type="button"
      >
        <Settings size={16} />
      </button>
    </header>
  );
}
