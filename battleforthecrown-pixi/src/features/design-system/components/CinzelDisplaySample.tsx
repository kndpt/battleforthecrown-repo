import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type CinzelDisplayLineVariant = 'eyebrow' | 'hero' | 'title' | 'section' | 'quote';

export interface CinzelDisplayLine {
  text: string;
  variant: CinzelDisplayLineVariant;
}

export interface CinzelDisplaySampleProps extends HTMLAttributes<HTMLDivElement> {
  lines: CinzelDisplayLine[];
}

const lineClass: Record<CinzelDisplayLineVariant, string> = {
  eyebrow: 'text-[11px] font-semibold uppercase tracking-[.3em] text-[#5d4a32]',
  hero: 'text-5xl font-bold leading-[1.05] text-[#1f2937]',
  title: 'text-2xl font-bold text-[#1f2937]',
  section: 'text-lg font-semibold text-[#1f2937]',
  quote: 'mt-1 text-[11px] italic text-[#4b5563]',
};

export function CinzelDisplaySample({ className, lines, ...props }: CinzelDisplaySampleProps) {
  return (
    <div className={cn('flex w-full flex-col items-stretch gap-1.5 font-game', className)} {...props}>
      {lines.map((line) => (
        <div className={lineClass[line.variant]} key={`${line.variant}-${line.text}`}>
          {line.text}
        </div>
      ))}
    </div>
  );
}
