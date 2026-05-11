import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type BannerTitleVariant = 'wood' | 'ribbon' | 'stone' | 'parchment' | 'screen' | 'section';

export interface BannerCrumb {
  current?: boolean;
  label: string;
}

export interface BannerTitleProps {
  className?: string;
  crumbs?: BannerCrumb[];
  eyebrow?: string;
  icon?: string;
  meta?: ReactNode;
  onBack?: () => void;
  subtitle?: string;
  title: string;
  variant?: BannerTitleVariant;
}

export function BannerTitle({ className, crumbs = [], eyebrow, icon, meta, onBack, subtitle, title, variant = 'parchment' }: BannerTitleProps) {
  if (variant === 'wood') {
    return (
      <div className={cn('relative flex h-16 items-center justify-center bg-[url("/assets/ui/banner.png")] bg-[length:100%_100%] bg-center px-20 font-game text-xl font-extrabold tracking-[0.04em] text-[#fef9f0] text-shadow-game', className)}>
        {title}
        {subtitle ? <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#cdb88a]">{subtitle}</span> : null}
      </div>
    );
  }

  if (variant === 'ribbon') {
    return <span className={cn('inline-flex min-h-[42px] min-w-60 items-center justify-center border-[2.5px] border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] px-7 font-game text-base font-black tracking-[0.06em] text-[#3a2a00] shadow-[inset_0_2px_0_rgba(255,255,255,.45),0_4px_0_rgba(0,0,0,.22)] [clip-path:polygon(0_0,100%_0,calc(100%-14px)_50%,100%_100%,0_100%,14px_50%)]', className)}>{title}</span>;
  }

  if (variant === 'stone') {
    return (
      <div className={cn('relative flex items-center gap-3.5 rounded-xl border-[3px] border-[#5d6d6e] bg-gradient-to-b from-[#bfc7cb] to-[#7e8b91] px-5 py-3.5 text-[#1f2933] shadow-[inset_0_2px_0_rgba(255,255,255,.5),0_4px_0_rgba(0,0,0,.25)] before:pointer-events-none before:absolute before:inset-2 before:rounded-md before:border before:border-[#1f2933]/30 before:content-[""]', className)}>
        {icon ? <span className="grid size-12 place-items-center rounded-full border-[3px] border-[#3d2f1f] bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#a87b25)]"><img alt="" className="size-7" src={publicAsset(icon)} /></span> : null}
        <span className="relative flex flex-col">
          {eyebrow ? <span className="font-game text-[10px] font-bold uppercase tracking-[0.2em] text-[#3d4f60]">{eyebrow}</span> : null}
          <span className="font-game text-xl font-extrabold">{title}</span>
        </span>
      </div>
    );
  }

  if (variant === 'screen') {
    return (
      <div className={cn('grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-xl border-[2.5px] border-[#d4a017] bg-gradient-to-b from-[#3d2f1f] to-[#1a1a1a] px-3.5 py-2.5 text-[#f6d57b] shadow-[0_4px_10px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.18)]', className)}>
        <button className="grid size-8 place-items-center rounded-lg border-2 border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] font-game text-lg font-black text-[#3a2a00]" onClick={onBack} type="button">‹</button>
        <span className="flex flex-col text-center leading-tight">
          {eyebrow ? <span className="font-game text-[10px] font-bold uppercase tracking-[0.18em] text-[#cdb88a]">{eyebrow}</span> : null}
          <span className="font-game text-lg font-extrabold text-[#fef9f0]">{title}</span>
        </span>
        {meta ? <span className="rounded-lg border border-[#9e7b0d] bg-black/40 px-2.5 py-1.5 font-game text-[13px] font-extrabold">{meta}</span> : null}
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex items-end">
          {crumbs.map((crumb) => (
            <span key={crumb.label} className={cn('mr-[-10px] px-4 py-1.5 font-game text-[11px] font-bold uppercase tracking-[0.06em] [clip-path:polygon(0_0,calc(100%-10px)_0,100%_50%,calc(100%-10px)_100%,0_100%,10px_50%)]', crumb.current ? 'z-[2] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]' : 'bg-gradient-to-b from-[#8b7355] to-[#5d4a32] text-[#fef9f0] text-shadow-game')}>
              {crumb.label}
            </span>
          ))}
        </div>
        <div className="rounded-[0_12px_12px_12px] border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] px-4.5 py-3.5 font-game text-[#3d2f1f]">
          <h2 className="text-xl font-extrabold">{title}</h2>
          {subtitle ? <div className="text-[11px] italic text-[#6d5838]">{subtitle}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-xl border-[3px] border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] px-7 py-[18px] text-center text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_4px_0_rgba(0,0,0,.18)] before:absolute before:left-[-9px] before:top-1/2 before:size-3.5 before:-translate-y-1/2 before:rotate-45 before:border-2 before:border-[#704c0a] before:bg-gradient-to-br before:from-[#fef0c6] before:to-[#a87b25] before:content-[""] after:absolute after:right-[-9px] after:top-1/2 after:size-3.5 after:-translate-y-1/2 after:rotate-45 after:border-2 after:border-[#704c0a] after:bg-gradient-to-br after:from-[#fef0c6] after:to-[#a87b25] after:content-[""]', className)}>
      {eyebrow ? <div className="font-game text-[10px] font-bold uppercase tracking-[0.22em] text-[#704c0a]">{eyebrow}</div> : null}
      <h2 className="font-game text-[22px] font-extrabold tracking-[0.04em]">{title}</h2>
      {subtitle ? <div className="mt-1 font-game text-[11.5px] italic text-[#6d5838]">{subtitle}</div> : null}
    </div>
  );
}
