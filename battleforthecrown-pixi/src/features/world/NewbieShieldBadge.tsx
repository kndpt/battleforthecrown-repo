import { useTickingNow } from '@/lib/useTickingNow';
import { formatRemaining } from '@/features/village/constructionProgress';

interface NewbieShieldBadgeProps {
  endsAt: string;
  className?: string;
}

export function NewbieShieldBadge({ endsAt, className }: NewbieShieldBadgeProps) {
  const now = useTickingNow(1_000);
  const remainingMs = Date.parse(endsAt) - now;
  if (remainingMs <= 0) return null;

  return (
    <div
      aria-label={`Bouclier débutant — ${formatRemaining(remainingMs)} restantes`}
      className={[
        'flex items-center gap-1.5 rounded-full border border-[#1a3a2a] bg-[linear-gradient(180deg,#1a3a2a,#0f2218)] px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      <span aria-hidden="true" className="text-[13px] leading-none">
        🛡
      </span>
      <span className="font-game tabular-nums text-[12px] font-bold text-[#7dcea0]">
        {formatRemaining(remainingMs)}
      </span>
    </div>
  );
}
