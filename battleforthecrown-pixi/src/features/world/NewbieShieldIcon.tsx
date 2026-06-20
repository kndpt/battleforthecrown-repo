import { publicAsset } from '@/lib/publicAsset';
import { useTickingNow } from '@/lib/useTickingNow';
import { formatRemaining } from '@/features/village/constructionProgress';
import { Tooltip } from '@/ui/tooltips/Tooltip';

interface NewbieShieldIconProps {
  endsAt: string;
  size?: number;
  className?: string;
}

/**
 * Bulle de protection débutant : icône cliquable + tooltip (design system)
 * affichant le temps restant. Disparaît une fois le bouclier expiré.
 */
export function NewbieShieldIcon({ endsAt, size = 28, className }: NewbieShieldIconProps) {
  const now = useTickingNow(1_000);
  const endsAtMs = Date.parse(endsAt);
  if (!Number.isFinite(endsAtMs)) return null;
  const remainingMs = endsAtMs - now;
  if (remainingMs <= 0) return null;

  const remaining = formatRemaining(remainingMs);

  return (
    <Tooltip
      content={`Protection débutant : ${remaining} restantes`}
      position="bottom"
      variant="info"
    >
      <span
        role="img"
        aria-label={`Protection débutant — ${remaining} restantes`}
        className={['inline-flex shrink-0', className ?? ''].join(' ').trim()}
      >
        <img
          src={publicAsset('/assets/newbie-shield.png')}
          alt=""
          aria-hidden="true"
          className="object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]"
          style={{ width: size, height: size }}
          loading="lazy"
          decoding="async"
        />
      </span>
    </Tooltip>
  );
}

interface NewbieShieldTimerProps {
  endsAt: string;
  className?: string;
}

/** Plain ticking countdown text (no badge), e.g. "47h 16m". */
export function NewbieShieldTimer({ endsAt, className }: NewbieShieldTimerProps) {
  const now = useTickingNow(1_000);
  const endsAtMs = Date.parse(endsAt);
  if (!Number.isFinite(endsAtMs)) return null;
  const remainingMs = endsAtMs - now;
  if (remainingMs <= 0) return null;

  return (
    <span
      className={[
        'tabular-nums normal-case tracking-normal text-[11px] font-bold text-[#c9b07f]',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      {formatRemaining(remainingMs)}
    </span>
  );
}
