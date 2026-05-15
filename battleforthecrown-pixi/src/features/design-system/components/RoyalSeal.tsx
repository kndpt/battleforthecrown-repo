import type {
  CSSProperties,
  FocusEventHandler,
  MouseEventHandler,
  PointerEventHandler,
} from 'react';
import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type RoyalSealVariant = 'wax' | 'parchment';

export interface RoyalSealProps {
  ariaLabel?: string;
  badge?: boolean;
  badgeCount?: number | null;
  className?: string;
  halo?: boolean;
  onBlur?: FocusEventHandler<HTMLButtonElement>;
  onClick?: () => void;
  onFocus?: FocusEventHandler<HTMLButtonElement>;
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  onMouseUp?: MouseEventHandler<HTMLButtonElement>;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerLeave?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  pressed?: boolean;
  softShadow?: boolean;
  size?: number;
  style?: CSSProperties;
  variant?: RoyalSealVariant;
}

function SealBadge({ count, size }: { count: number | null | undefined; size: number }) {
  const dot = Math.max(13, Math.round(size * 0.32));
  return (
    <span
      className="absolute z-[2] inline-flex items-center justify-center rounded-full border-2 border-[#fef9f0] bg-[radial-gradient(circle_at_32%_28%,#ff8a7d_0%,#e74c3c_45%,#a93226_100%)] font-game font-black leading-none text-white shadow-[0_1px_3px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.4)] [text-shadow:0_1px_1px_rgba(0,0,0,.4)]"
      style={{
        top: -dot * 0.18,
        right: -dot * 0.18,
        minWidth: dot,
        height: dot,
        padding: count != null ? '0 4px' : 0,
        fontSize: dot * 0.62,
      }}
    >
      {count != null ? count : ''}
    </span>
  );
}

function WaxFace({
  size,
  pressed,
  softShadow,
}: {
  size: number;
  pressed: boolean;
  softShadow: boolean;
}) {
  const inner = Math.round(size * 0.56);
  return (
    <div
      className={cn(
        'relative z-[1] flex items-center justify-center rounded-full border-[2.5px] border-[#4a2f06] bg-[radial-gradient(circle_at_32%_26%,#fff3b0_0%,#f1c40f_32%,#b67e0a_72%,#6e4a08_100%)] transition-[transform,filter] duration-100',
        pressed
          ? 'translate-y-px shadow-[inset_0_3px_6px_rgba(0,0,0,.55),0_1px_0_rgba(0,0,0,.2)]'
          : softShadow
            ? 'shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_rgba(0,0,0,.2),0_3px_8px_rgba(74,47,6,.18)]'
            : 'shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_3px_0_rgba(0,0,0,.28),0_6px_14px_rgba(74,47,6,.35)]',
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="pointer-events-none absolute rounded-full border border-dashed border-[rgba(60,30,0,.45)] shadow-[inset_0_0_0_1px_rgba(255,255,255,.18)]"
        style={{ inset: size > 36 ? 3.5 : 2.5 }}
      />
      <img
        alt=""
        className="opacity-[.92] drop-shadow-[0_1px_0_rgba(255,255,255,.45)]"
        src={publicAsset('/assets/casual-icons/crown.png')}
        style={{
          width: inner,
          height: inner,
          filter: 'drop-shadow(0 1px 0 rgba(255,255,255,.45)) drop-shadow(0 -1px 0 rgba(60,30,0,.45))',
        }}
      />
      <span
        className="pointer-events-none absolute rounded-full bg-[linear-gradient(to_bottom,rgba(255,255,255,.55),rgba(255,255,255,0))] blur-[1.5px]"
        style={{ left: '18%', right: '40%', top: '10%', height: '18%' }}
      />
    </div>
  );
}

function ParchmentFace({ size, pressed }: { size: number; pressed: boolean }) {
  return (
    <div
      className={cn(
        'relative z-[1] flex items-center justify-center rounded-[10px] border-[2.5px] border-[#6e4a08] bg-[linear-gradient(160deg,#fef0c6_0%,#e8c878_60%,#c79a3e_100%)]',
        pressed
          ? 'translate-y-px shadow-[inset_0_3px_5px_rgba(0,0,0,.45),0_1px_0_rgba(0,0,0,.2)]'
          : 'shadow-[inset_0_1px_0_rgba(255,255,255,.55),0_3px_0_rgba(0,0,0,.25),0_6px_14px_rgba(74,47,6,.3)]',
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute border-y border-[rgba(0,0,0,.35)] bg-[linear-gradient(to_bottom,#c84128_0%,#7d2218_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,.25)]"
        style={{ left: -3, right: -3, bottom: '14%', height: size * 0.18 }}
      />
      <span
        className="font-game font-black leading-none text-[#5a3a05] [text-shadow:0_1px_0_rgba(255,255,255,.55),0_-1px_0_rgba(60,30,0,.4)]"
        style={{ fontSize: size * 0.52, marginTop: -size * 0.04 }}
      >
        ⚜
      </span>
    </div>
  );
}

export function RoyalSeal({
  ariaLabel,
  badge = false,
  badgeCount = null,
  className,
  halo = false,
  onClick,
  onBlur,
  onFocus,
  onMouseDown,
  onMouseUp,
  onPointerCancel,
  onPointerDown,
  onPointerLeave,
  onPointerUp,
  pressed = false,
  size = 44,
  softShadow = false,
  style,
  variant = 'wax',
}: RoyalSealProps) {
  const haloRadius = variant === 'parchment' ? 12 : '50%';
  const containerStyle: CSSProperties = { width: size, height: size, ...style };

  const body = (
    <>
      {halo ? (
        <span
          className="pointer-events-none absolute z-0 bg-[radial-gradient(circle,rgba(246,213,123,.55)_0%,rgba(246,213,123,0)_70%)] [animation:bftc-seal-halo_2.2s_ease-in-out_infinite]"
          style={{ inset: -size * 0.18, borderRadius: haloRadius }}
        />
      ) : null}
      {variant === 'parchment' ? (
        <ParchmentFace pressed={pressed} size={size} />
      ) : (
        <WaxFace pressed={pressed} size={size} softShadow={softShadow} />
      )}
      {badge ? <SealBadge count={badgeCount} size={size} /> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        aria-label={ariaLabel ?? 'Sceau royal'}
        className={cn('relative shrink-0 cursor-pointer border-none bg-transparent p-0', className)}
        onBlur={onBlur}
        onClick={onClick}
        onFocus={onFocus}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onPointerCancel={onPointerCancel}
        onPointerDown={onPointerDown}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        style={containerStyle}
        type="button"
      >
        {body}
      </button>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      className={cn('relative shrink-0', className)}
      role={ariaLabel ? 'img' : undefined}
      style={containerStyle}
    >
      {body}
    </div>
  );
}
