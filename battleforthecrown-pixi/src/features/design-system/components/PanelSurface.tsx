import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PanelTone = 'parchment' | 'blue';

const toneClass: Record<PanelTone, string> = {
  parchment: 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8]',
  blue: 'border-[#1f5288] bg-gradient-to-b from-[#c7dffb] to-[#8fb6e0]',
};

export interface PanelSurfaceProps {
  children: ReactNode;
  className?: string;
  tone?: PanelTone;
}

export function PanelSurface({ children, className, tone = 'parchment' }: PanelSurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] border-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_3px_0_rgba(0,0,0,0.18)]',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
