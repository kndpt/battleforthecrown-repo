import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type DividerVariant = 'ornament' | 'labeled' | 'rope' | 'sword' | 'hairline' | 'bossed' | 'torn' | 'vertical';

export interface DividerProps {
  className?: string;
  icon?: string;
  label?: string;
  variant?: DividerVariant;
}

export function Divider({ className, icon, label, variant = 'ornament' }: DividerProps) {
  if (variant === 'vertical') {
    return <span className={cn('w-0.5 self-stretch bg-gradient-to-b from-transparent via-[#3d2f1f] to-transparent', className)} />;
  }

  if (variant === 'rope') {
    return <div className={cn('h-1.5 rounded bg-[repeating-linear-gradient(45deg,#a87b25_0_4px,#704c0a_4px_8px)] border-y border-y-[#cdb88a]/70', className)} />;
  }

  if (variant === 'hairline') return <div className={cn('h-px bg-[#3d2f1f]/25', className)} />;
  if (variant === 'bossed') return <div className={cn('h-1.5 rounded bg-gradient-to-b from-[#8b7355] to-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_1px_2px_rgba(0,0,0,.25)]', className)} />;
  if (variant === 'torn') return <div className={cn('h-3.5 bg-[radial-gradient(circle_at_12%_50%,#8b7355_30%,transparent_31%),radial-gradient(circle_at_28%_50%,#8b7355_30%,transparent_31%),radial-gradient(circle_at_44%_50%,#8b7355_30%,transparent_31%),radial-gradient(circle_at_60%_50%,#8b7355_30%,transparent_31%),radial-gradient(circle_at_76%_50%,#8b7355_30%,transparent_31%),radial-gradient(circle_at_92%_50%,#8b7355_30%,transparent_31%)] bg-[length:8%_100%]', className)} />;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-[#8b7355] to-[#3d2f1f]" />
      {variant === 'labeled' ? (
        <>
          {icon ? <span className="grid size-6 place-items-center rounded-full border border-[#704c0a] bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)]"><img alt="" className="size-3.5" src={publicAsset(icon)} /></span> : null}
          <span className="font-game text-[10px] font-bold uppercase tracking-[0.2em] text-[#704c0a]">{label}</span>
        </>
      ) : variant === 'sword' ? (
        <img alt="" className="size-8 object-contain" src={publicAsset(icon ?? '/assets/hand-red.png')} />
      ) : (
        <span className="size-2.5 rotate-45 border border-[#704c0a] bg-gradient-to-br from-[#fef0c6] to-[#a87b25]" />
      )}
      <span className="h-0.5 flex-1 bg-gradient-to-l from-transparent via-[#8b7355] to-[#3d2f1f]" />
    </div>
  );
}
