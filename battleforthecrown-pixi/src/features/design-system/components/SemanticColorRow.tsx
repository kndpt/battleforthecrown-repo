import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface SemanticColorSegment {
  color: string;
  label?: string;
  textTone?: 'light' | 'dark';
}

export interface SemanticColorRowProps extends HTMLAttributes<HTMLDivElement> {
  borderColor: string;
  label: string;
  segments: [SemanticColorSegment, SemanticColorSegment, SemanticColorSegment];
}

export function SemanticColorRow({ borderColor, className, label, segments, ...props }: SemanticColorRowProps) {
  return (
    <div className={cn('flex items-stretch gap-2', className)} {...props}>
      <div className="flex w-20 shrink-0 items-center font-game text-[13px] font-bold text-[#1f2937]">{label}</div>
      <div
        className="flex h-[54px] min-w-0 flex-1 overflow-hidden rounded-lg border-2 shadow-[inset_0_2px_4px_rgba(0,0,0,.20),inset_0_-2px_4px_rgba(0,0,0,.20)]"
        style={{ borderColor }}
      >
        {segments.map((segment) => {
          const value = segment.label ?? segment.color;
          const darkText = segment.textTone === 'dark';

          return (
            <div
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center font-mono text-[10px]',
                darkText ? 'text-[#3a2a00]' : 'text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
              )}
              key={`${label}-${segment.color}`}
              style={{ background: segment.color }}
            >
              <span className="truncate px-0.5">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
