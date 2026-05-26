import type { ButtonHTMLAttributes, FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type AuthButtonVariant = 'success' | 'warning' | 'wood' | 'neutral';
export type AuthButtonSize = 'md' | 'lg';

export interface AuthAction {
  disabled?: boolean;
  id: string;
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  variant: AuthButtonVariant;
  size?: AuthButtonSize;
}

export interface AuthTextAction {
  disabled?: boolean;
  id: string;
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

export interface AuthSsoAction {
  disabled?: boolean;
  id: string;
  kind: 'google' | 'apple' | 'email';
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

export interface AuthFieldProps {
  autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'];
  disabled?: boolean;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  id: string;
  label: string;
  name?: string;
  onChange: (value: string) => void;
  onPasswordVisibleChange?: (visible: boolean) => void;
  passwordVisible?: boolean;
  placeholder?: string;
  required?: boolean;
  secure?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  value: string;
}

export interface AuthPhoneFrameProps {
  children: ReactNode;
  className?: string;
  withCastle?: boolean;
  castleIcon?: string;
}

export interface AuthStatusBarProps {
  batteryLabel: string;
  networkLabel: string;
  timeLabel: string;
  tone?: 'dark' | 'light';
}

export interface AuthCrownSigilProps {
  crownIcon: string;
  size?: number;
}

export interface AuthWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  tagline: string;
  titleLines: string[];
  tone?: 'dark' | 'light';
}

export interface AuthButtonProps extends Omit<AuthAction, 'id' | 'label'> {
  children: ReactNode;
  className?: string;
  full?: boolean;
}

export interface AuthStrengthMeterProps {
  labels: [string, string, string, string];
  score: number;
  titlePrefix: string;
}

export interface AuthSsoChipProps extends AuthSsoAction {
  className?: string;
}

export interface AuthDividerProps {
  label: string;
}

export interface AuthBackButtonProps {
  disabled?: boolean;
  label: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
}

export interface AuthLandingScreenProps {
  actions: AuthAction[];
  castleIcon: string;
  crownIcon: string;
  eyebrow: string;
  secondaryActions?: AuthTextAction[];
  status: AuthStatusBarProps;
  tagline: string;
  titleLines: string[];
  variant: 'crest' | 'dawn' | 'seal';
  warehouseIcon?: string;
  watchtowerIcon?: string;
}

export interface AuthRememberControl {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export interface AuthLoginScreenProps {
  backLabel: string;
  crownIcon: string;
  dividerLabel: string;
  fields: {
    email?: AuthFieldProps;
    lord?: AuthFieldProps;
    password: AuthFieldProps;
  };
  forgotAction: AuthTextAction;
  footerAction: AuthTextAction;
  footerPrompt: string;
  onBack?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  remember: AuthRememberControl;
  ssoActions: AuthSsoAction[];
  status: AuthStatusBarProps;
  stepLabel: string;
  submitError?: string | null;
  submitAction: AuthAction;
  subtitle: string;
  title: string;
}

export interface AuthTermsControl {
  checked: boolean;
  firstLinkLabel: string;
  firstText: string;
  onChange: (checked: boolean) => void;
  secondLinkLabel: string;
  secondText: string;
  suffix: string;
}

export interface AuthRegisterScreenProps {
  backLabel: string;
  badgeIcon: string;
  badgeLabel: string;
  divider?: ReactNode;
  fields: {
    confirmPassword?: AuthFieldProps;
    email: AuthFieldProps;
    lord?: AuthFieldProps;
    password: AuthFieldProps;
  };
  footerAction: AuthTextAction;
  footerPrompt: string;
  onBack?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  status: AuthStatusBarProps;
  stepLabel: string;
  strength: AuthStrengthMeterProps;
  submitError?: string | null;
  submitAction: AuthAction;
  terms: AuthTermsControl;
  titleLines: string[];
}

export interface AuthHeraldShield {
  accent: string;
  field: [string, string];
  id: string;
  label: string;
  symbol: string;
}

export interface AuthHeraldShieldButtonProps {
  onSelect: (id: string) => void;
  selected: boolean;
  shield: AuthHeraldShield;
}

export interface AuthBannerScreenProps {
  backLabel: string;
  field: AuthFieldProps;
  onBack?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  onShieldChange: (id: string) => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  quote: string;
  selectedShieldId: string;
  shieldLabel: string;
  shields: AuthHeraldShield[];
  status: AuthStatusBarProps;
  stepLabel: string;
  submitAction: AuthAction;
  subtitle: string;
  title: string;
}

const buttonVariantClass: Record<AuthButtonVariant, string> = {
  success: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
  warning: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] text-[#3a2a00]',
  wood: 'border-[#3c2619] bg-[linear-gradient(to_bottom,#a67c52,#5d4a32)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
  neutral: 'border-[#5d6d6e] bg-[linear-gradient(to_bottom,#95a5a6,#7f8c8d)] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,.6)]',
};

const buttonSizeClass: Record<AuthButtonSize, string> = {
  md: 'px-[18px] py-[9px] text-sm',
  lg: 'px-[22px] py-[11px] text-[15px]',
};

export function AuthPhoneFrame({
  castleIcon = '/assets/castle.png',
  children,
  className,
  withCastle = true,
}: AuthPhoneFrameProps) {
  return (
    <div
      className={cn(
        'relative h-[720px] w-[360px] overflow-hidden bg-[radial-gradient(ellipse_at_top,#e8d5b7_0%,#f5e6d3_45%,#d4c094_100%)] font-game text-[#3d2f1f]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center_110%,rgba(60,38,25,.18),transparent_55%)]" />
      {withCastle ? (
        <img
          alt=""
          className="pointer-events-none absolute bottom-[-30px] right-[-22px] w-[180px] opacity-[.12] [filter:saturate(0)_brightness(0.4)]"
          src={publicAsset(castleIcon)}
        />
      ) : null}
      {children}
    </div>
  );
}

export function AuthStatusBar({
  batteryLabel,
  networkLabel,
  timeLabel,
  tone = 'dark',
}: AuthStatusBarProps) {
  return (
    <div
      className={cn(
        'flex h-[22px] items-center justify-between px-4 font-game text-[11px] font-bold tracking-[.04em]',
        tone === 'dark' ? 'text-[rgba(60,38,25,.7)]' : 'text-white',
      )}
    >
      <span>{timeLabel}</span>
      <span className="inline-flex gap-1.5 text-[10px]">
        <span>{networkLabel}</span>
        <span>{batteryLabel}</span>
      </span>
    </div>
  );
}

export function AuthCrownSigil({ crownIcon, size = 110 }: AuthCrownSigilProps) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full border-[5px] border-[#5d4a32] bg-[radial-gradient(circle_at_35%_30%,#fff4cf,#f1c40f_40%,#9e7b0d_90%)] shadow-[0_10px_22px_rgba(0,0,0,.4),inset_0_4px_6px_rgba(255,255,255,.45),inset_0_-6px_10px_rgba(0,0,0,.25)]"
      style={{ height: size, width: size }}
    >
      <img
        alt=""
        src={publicAsset(crownIcon)}
        style={{
          filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.4))',
          height: size * 0.62,
          width: size * 0.62,
        }}
      />
      {[18, 90, 162, 234, 306].map((degrees) => (
        <span
          className="absolute size-[5px] rounded-full bg-[#f1c40f] shadow-[0_0_6px_rgba(241,196,15,.8)]"
          key={degrees}
          style={{
            left: `${50 + 48 * Math.sin((degrees * Math.PI) / 180)}%`,
            top: `${50 - 48 * Math.cos((degrees * Math.PI) / 180)}%`,
            transform: 'translate(-50%,-50%)',
          }}
        />
      ))}
    </div>
  );
}

export function AuthWordmark({
  className,
  size = 'lg',
  tagline,
  titleLines,
  tone = 'dark',
}: AuthWordmarkProps) {
  const fontSize = size === 'lg' ? 'text-[30px]' : size === 'md' ? 'text-[22px]' : 'text-lg';

  return (
    <div className={cn('text-center leading-[1.05]', className)}>
      <div
        className={cn(
          'font-game font-black tracking-[.02em]',
          fontSize,
          tone === 'dark'
            ? 'text-[#3c2619] [text-shadow:1px_1px_0_rgba(255,255,255,.55),0_2px_3px_rgba(0,0,0,.18)]'
            : 'text-[#f6e4b8] [text-shadow:0_2px_6px_rgba(0,0,0,.7),0_0_16px_rgba(246,213,123,.3)]',
        )}
      >
        {titleLines.map((line, index) => (
          <span key={line}>
            {line}
            {index < titleLines.length - 1 ? <br /> : null}
          </span>
        ))}
      </div>
      <div
        className={cn(
          'mt-1.5 font-game text-xs italic',
          tone === 'dark' ? 'text-[#6d5838]' : 'text-[rgba(246,228,184,.78)] [text-shadow:0_1px_3px_rgba(0,0,0,.6)]',
        )}
      >
        {tagline}
      </div>
    </div>
  );
}

export function AuthButton({
  children,
  className,
  disabled,
  full,
  onClick,
  size = 'md',
  type = 'button',
  variant,
}: AuthButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-2 font-game font-bold tracking-[.04em] shadow-[0_3px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.28)] transition-[filter,transform] duration-150 disabled:cursor-not-allowed disabled:opacity-[.5] active:translate-y-0.5',
        buttonVariantClass[variant],
        buttonSizeClass[size],
        full ? 'w-full' : '',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function AuthField({
  autoComplete,
  disabled,
  error,
  hint,
  icon,
  id,
  label,
  name,
  onChange,
  onPasswordVisibleChange,
  passwordVisible = false,
  placeholder,
  required,
  secure = false,
  type = 'text',
  value,
}: AuthFieldProps) {
  const inputType = secure && !passwordVisible ? 'password' : type;

  return (
    <div className="flex flex-col gap-[5px]">
      <label
        className="font-game text-[10px] font-bold uppercase tracking-[.22em] text-[#6d5838]"
        htmlFor={id}
      >
        {label}
      </label>
      <div
        className={cn(
          'relative flex items-center gap-2 rounded-[10px] border-[3px] bg-[linear-gradient(to_bottom,#fef9f0,#f0dfba)] px-2.5 py-2 shadow-[inset_0_2px_4px_rgba(60,38,25,.18),0_1px_0_rgba(255,255,255,.5)]',
          error ? 'border-[#a13a2a]' : 'border-[#8b7355]',
        )}
      >
        {icon ? (
          <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] border-[#5d4a32] bg-[linear-gradient(to_bottom,#b6a78a,#8b7355)] font-game text-xs font-extrabold text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]">
            {icon}
          </span>
        ) : null}
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 border-none bg-transparent font-game text-sm font-semibold tracking-[.02em] text-[#3d2f1f] outline-none placeholder:text-[#8b7355] disabled:cursor-not-allowed disabled:opacity-[.65]"
          disabled={disabled}
          id={id}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={inputType}
          value={value}
        />
        {secure ? (
          <button
            className="cursor-pointer bg-transparent p-1 font-game text-[11px] font-bold text-[#6d5838] disabled:cursor-not-allowed disabled:opacity-[.55]"
            disabled={disabled}
            onClick={() => onPasswordVisibleChange?.(!passwordVisible)}
            type="button"
          >
            {passwordVisible ? 'Cacher' : 'Voir'}
          </button>
        ) : null}
      </div>
      {error || hint ? (
        <div
          className={cn(
            'pl-0.5 font-game text-[10.5px]',
            error ? 'text-[#a13a2a]' : 'italic text-[#6d5838]',
          )}
        >
          {error ?? hint}
        </div>
      ) : null}
    </div>
  );
}

export function AuthStrengthMeter({ labels, score, titlePrefix }: AuthStrengthMeterProps) {
  const clampedScore = Math.min(4, Math.max(1, score));
  const colors = ['#a13a2a', '#c89b2a', '#6ebf49', '#3a6c1f'];
  const activeColor = colors[clampedScore - 1];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-[3px]">
        {[0, 1, 2, 3].map((index) => (
          <div
            className="h-[5px] flex-1 rounded-[3px]"
            key={index}
            style={{
              background: index < clampedScore ? activeColor : 'rgba(60,38,25,.18)',
              boxShadow: index < clampedScore
                ? 'inset 0 1px 0 rgba(255,255,255,.4)'
                : 'inset 0 1px 2px rgba(0,0,0,.15)',
            }}
          />
        ))}
      </div>
      <span className="font-game text-[10px] font-bold uppercase tracking-[.1em]" style={{ color: activeColor }}>
        {titlePrefix} {labels[clampedScore - 1]}
      </span>
    </div>
  );
}

export function AuthSsoChip({ className, disabled, kind, label, onClick }: AuthSsoChipProps) {
  const monogram = { apple: '', email: '✉', google: 'G' }[kind];

  return (
    <button
      className={cn(
        'inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] px-2 py-2.5 font-game text-[11.5px] font-bold tracking-[.04em] text-[#3d2f1f] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_2px_0_rgba(0,0,0,.18)] disabled:cursor-not-allowed disabled:opacity-[.55]',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span
        aria-hidden="true"
        className="flex size-[22px] items-center justify-center rounded-full bg-[linear-gradient(to_bottom,#3d2f1f,#1a1208)] font-serif text-[13px] font-black leading-none text-[#f6e4b8] shadow-[inset_0_1px_0_rgba(255,255,255,.18)]"
      >
        {monogram}
      </span>
      {label}
    </button>
  );
}

export function AuthDivider({ label }: AuthDividerProps) {
  return (
    <div className="my-0.5 flex items-center gap-2.5">
      <div className="h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(60,38,25,.4),rgba(60,38,25,.4))]" />
      <span className="font-game text-[10px] font-bold uppercase tracking-[.3em] text-[#6d5838]">· {label} ·</span>
      <div className="h-px flex-1 bg-[linear-gradient(to_left,transparent,rgba(60,38,25,.4),rgba(60,38,25,.4))]" />
    </div>
  );
}

export function AuthBackButton({ disabled, label, onClick }: AuthBackButtonProps) {
  return (
    <button
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-2 border-[#3c2619] bg-[linear-gradient(to_bottom,rgba(60,38,25,.92),rgba(78,56,34,.92))] py-[5px] pl-2 pr-2.5 font-game text-[11px] font-bold tracking-[.08em] text-[#f0e0c0] shadow-[inset_0_1px_0_rgba(255,255,255,.18),0_2px_0_rgba(0,0,0,.2)] [text-shadow:1px_1px_1px_rgba(0,0,0,.5)] disabled:cursor-not-allowed disabled:opacity-[.55]"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="text-sm leading-none">‹</span>
      {label}
    </button>
  );
}

function AuthTextButton({ disabled, label, onClick }: AuthTextAction) {
  return (
    <button
      className="cursor-pointer border-0 border-b-[1.5px] border-solid border-[rgba(60,38,25,.5)] bg-transparent p-0 pb-px font-game font-bold text-[#3c2619] disabled:cursor-not-allowed disabled:opacity-[.55]"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function AuthCheckedGlyph({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] font-game text-[11px] font-black leading-none text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.4)]',
        checked
          ? 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#6ebf49,#4a8c2a)]'
          : 'border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#f0dfba)]',
      )}
    >
      {checked ? '✓' : ''}
    </span>
  );
}

function renderActions(actions: AuthAction[]) {
  return actions.map((action) => (
    <AuthButton
      disabled={action.disabled}
      full
      key={action.id}
      onClick={action.onClick}
      size={action.size}
      type={action.type}
      variant={action.variant}
    >
      {action.label}
    </AuthButton>
  ));
}

export function AuthLandingScreen({
  actions,
  castleIcon,
  crownIcon,
  eyebrow,
  secondaryActions,
  status,
  tagline,
  titleLines,
  variant,
  warehouseIcon = '/assets/warehouse.png',
  watchtowerIcon = '/assets/watchtower.png',
}: AuthLandingScreenProps) {
  if (variant === 'dawn') {
    return (
      <div className="relative h-[720px] w-[360px] overflow-hidden bg-[linear-gradient(to_bottom,#1a1b2e_0%,#4a2e2a_35%,#b85d2e_60%,#f1b96f_78%,#d4c094_78%,#8b7355_100%)] font-game text-[#3d2f1f]">
        <AuthStatusBar {...status} tone="light" />
        <div className="absolute left-1/2 top-[55%] size-[110px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#fff4cf_0%,#f1c40f_40%,rgba(241,196,15,0)_75%)] blur-[.5px]" />
        <div className="absolute left-1/2 top-[55%] size-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#fff8e0_0%,#f6d57b_60%,#c59e3f_100%)] shadow-[0_0_30px_rgba(246,213,123,.6)]" />
        {[
          [60, 30, 1.5],
          [120, 45, 1],
          [180, 18, 2],
          [240, 52, 1.5],
          [290, 28, 1],
          [80, 68, 1],
          [210, 80, 1.5],
          [310, 75, 1],
        ].map(([x, y, radius], index) => (
          <span
            className="absolute rounded-full bg-white opacity-[.6]"
            key={`${x}-${y}-${index}`}
            style={{
              boxShadow: `0 0 ${radius * 3}px rgba(255,255,255,.5)`,
              height: radius * 2,
              left: x,
              top: y,
              width: radius * 2,
            }}
          />
        ))}
        <AuthWordmark className="absolute left-0 right-0 top-[90px] z-[2]" size="lg" tagline={tagline} titleLines={titleLines} tone="light" />
        <img
          alt=""
          className="absolute left-1/2 top-[57%] z-[1] w-[170px] -translate-x-1/2 -translate-y-[78%] [filter:drop-shadow(0_6px_8px_rgba(0,0,0,.45))_drop-shadow(0_0_14px_rgba(241,185,111,.35))]"
          src={publicAsset(castleIcon)}
        />
        <img
          alt=""
          className="absolute left-[26px] top-[57%] z-[1] w-[90px] -translate-y-[82%] [filter:drop-shadow(0_5px_6px_rgba(0,0,0,.4))_drop-shadow(0_0_10px_rgba(241,185,111,.25))]"
          src={publicAsset(watchtowerIcon)}
        />
        <img
          alt=""
          className="absolute right-6 top-[57%] z-[1] w-[70px] -translate-y-[68%] [filter:drop-shadow(0_4px_5px_rgba(0,0,0,.4))_drop-shadow(0_0_8px_rgba(241,185,111,.25))]"
          src={publicAsset(warehouseIcon)}
        />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-[22%] bg-[linear-gradient(to_bottom,rgba(184,93,46,.18)_0%,rgba(109,88,56,.18)_100%)]" />
        <div className="absolute bottom-[22px] left-5 right-5 z-[3] flex flex-col gap-2.5">
          {renderActions(actions)}
          {secondaryActions?.length ? <AuthSecondaryActions actions={secondaryActions} /> : null}
        </div>
      </div>
    );
  }

  if (variant === 'seal') {
    return (
      <AuthPhoneFrame withCastle={false}>
        <AuthStatusBar {...status} />
        <div className="absolute left-0 right-0 top-[38px] text-center font-game text-[10px] font-extrabold uppercase tracking-[.4em] text-[rgba(60,38,25,.5)]">
          {eyebrow}
        </div>
        <div className="absolute left-1/2 top-[90px] h-[235px] w-[200px] -translate-x-1/2 [filter:drop-shadow(0_12px_16px_rgba(0,0,0,.35))]">
          <div className="absolute inset-0 border-4 border-[#3c2619] bg-[linear-gradient(to_bottom,#3a72b8,#1f4d85)] shadow-[inset_0_3px_0_rgba(255,255,255,.3),inset_0_-16px_22px_rgba(0,0,0,.3)] [clip-path:polygon(50%_100%,0%_75%,0%_8%,8%_0%,92%_0%,100%_8%,100%_75%)]" />
          <svg className="absolute inset-0 size-full [clip-path:polygon(50%_100%,0%_75%,0%_8%,8%_0%,92%_0%,100%_8%,100%_75%)]" preserveAspectRatio="none" viewBox="0 0 100 115">
            <path d="M 8,80 L 50,42 L 92,80 L 92,72 L 50,30 L 8,72 Z" fill="#f6d57b" opacity="0.85" />
          </svg>
          <img
            alt=""
            className="absolute left-1/2 top-[30px] w-[84px] -translate-x-1/2 [filter:drop-shadow(0_4px_5px_rgba(0,0,0,.5))]"
            src={publicAsset(crownIcon)}
          />
          {[
            [28, 90],
            [50, 98],
            [72, 90],
          ].map(([x, y]) => (
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 font-game text-sm font-black text-[#f6d57b] [text-shadow:0_1px_2px_rgba(0,0,0,.5)]"
              key={`${x}-${y}`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              ✦
            </span>
          ))}
        </div>
        <div className="absolute left-[22px] right-[22px] top-[360px] rounded-[14px] border-[3px] border-[#2a1c10] bg-[linear-gradient(to_bottom,#8b6f47_0%,#5d4a32_50%,#3d2f1f_100%)] px-[18px] pb-[18px] pt-4 text-center shadow-[0_8px_18px_rgba(0,0,0,.35),inset_0_2px_0_rgba(255,255,255,.18),inset_0_-2px_0_rgba(0,0,0,.4)]">
          <div className="pointer-events-none absolute inset-0 rounded-[11px] bg-[repeating-linear-gradient(90deg,rgba(0,0,0,.06)_0_1px,transparent_1px_18px),repeating-linear-gradient(90deg,rgba(255,255,255,.04)_0_1px,transparent_1px_7px)] opacity-[.55]" />
          <AuthWordmark className="relative" size="md" tagline={tagline} titleLines={titleLines} tone="light" />
          <div className="absolute bottom-[-16px] left-1/2 flex size-[34px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#4d100a] bg-[radial-gradient(circle_at_35%_30%,#d04830,#8a1e15)] font-game text-sm font-black text-white shadow-[0_4px_6px_rgba(0,0,0,.4),inset_0_2px_3px_rgba(255,255,255,.25)] [text-shadow:0_1px_1px_rgba(0,0,0,.6)]">
            ♔
          </div>
        </div>
        <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-2.5">
          {renderActions(actions)}
          {secondaryActions?.length ? <AuthSecondaryActions actions={secondaryActions} /> : null}
        </div>
      </AuthPhoneFrame>
    );
  }

  return (
    <AuthPhoneFrame castleIcon={castleIcon}>
      <AuthStatusBar {...status} />
      <div className="mt-[18px] text-center font-game text-[10.5px] font-extrabold uppercase tracking-[.4em] text-[rgba(60,38,25,.55)] [text-shadow:0_1px_0_rgba(255,255,255,.5)]">
        {eyebrow}
      </div>
      <div className="flex flex-col items-center gap-[22px] px-6 pt-11">
        <AuthCrownSigil crownIcon={crownIcon} size={134} />
        <AuthWordmark tagline={tagline} titleLines={titleLines} />
      </div>
      <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-2.5">
        {renderActions(actions)}
        {secondaryActions?.length ? <AuthSecondaryActions actions={secondaryActions} /> : null}
      </div>
    </AuthPhoneFrame>
  );
}

function AuthSecondaryActions({ actions }: { actions: AuthTextAction[] }) {
  return (
    <div className="mt-1 flex justify-center gap-3.5 font-game text-[10.5px] font-bold tracking-[.06em] text-[#6d5838]">
      {actions.map((action, index) => (
        <span className="inline-flex items-center gap-3.5" key={action.id}>
          {index > 0 ? <span className="text-[rgba(60,38,25,.3)]">·</span> : null}
          <button
            className="cursor-pointer border-0 border-b-[1.5px] border-dotted border-[rgba(60,38,25,.4)] bg-transparent p-0 pb-px disabled:cursor-not-allowed disabled:opacity-[.55]"
            disabled={action.disabled}
            onClick={action.onClick}
            type="button"
          >
            {action.label}
          </button>
        </span>
      ))}
    </div>
  );
}

export function AuthLoginScreen({
  backLabel,
  crownIcon,
  dividerLabel,
  fields,
  forgotAction,
  footerAction,
  footerPrompt,
  onBack,
  onSubmit,
  remember,
  ssoActions,
  status,
  stepLabel,
  submitError,
  submitAction,
  subtitle,
  title,
}: AuthLoginScreenProps) {
  const identityField = fields.email ?? fields.lord;

  return (
    <AuthPhoneFrame withCastle={false}>
      <AuthStatusBar {...status} />
      <div className="flex items-center justify-between px-[18px] pt-2">
        <AuthBackButton label={backLabel} onClick={onBack} />
        <span className="font-game text-[10px] font-bold uppercase tracking-[.3em] text-[#6d5838]">{stepLabel}</span>
      </div>
      <div className="flex flex-col items-center gap-2.5 px-[22px] pb-1.5 pt-3">
        <AuthCrownSigil crownIcon={crownIcon} size={68} />
        <div className="text-center">
          <div className="font-game text-[22px] font-black tracking-[.02em] text-[#3c2619] [text-shadow:1px_1px_0_rgba(255,255,255,.5)]">{title}</div>
          <div className="mt-[3px] font-game text-[11.5px] italic text-[#6d5838]">{subtitle}</div>
        </div>
      </div>
      <form className="contents" noValidate onSubmit={onSubmit}>
        <div className="flex flex-col gap-3 px-[22px] pt-3">
          {identityField ? <AuthField {...identityField} /> : null}
          <AuthField {...fields.password} />
          {submitError ? (
            <div className="font-game text-[10.5px] font-semibold text-[#a13a2a]" role="alert">
              {submitError}
            </div>
          ) : null}
          <div className="flex items-center justify-between font-game text-[11px] font-bold">
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-[#6d5838]">
              <input
                checked={remember.checked}
                className="sr-only"
                onChange={(event) => remember.onChange(event.target.checked)}
                type="checkbox"
              />
              <AuthCheckedGlyph checked={remember.checked} />
              {remember.label}
            </label>
            <AuthTextButton {...forgotAction} />
          </div>
        </div>
        <div className="flex flex-col gap-3.5 px-[22px] pt-4">
          <AuthButton
            disabled={submitAction.disabled}
            full
            onClick={submitAction.onClick}
            size={submitAction.size ?? 'lg'}
            type={submitAction.type ?? 'submit'}
            variant={submitAction.variant}
          >
            {submitAction.label}
          </AuthButton>
          <AuthDivider label={dividerLabel} />
          <div className="flex gap-2">
            {ssoActions.map((action) => (
              <AuthSsoChip key={action.id} {...action} />
            ))}
          </div>
        </div>
      </form>
      <div className="absolute bottom-[18px] left-0 right-0 flex items-center justify-center gap-2 font-game text-[11.5px] font-bold text-[#6d5838]">
        {footerPrompt}
        <AuthTextButton {...footerAction} />
      </div>
    </AuthPhoneFrame>
  );
}

export function AuthRegisterScreen({
  backLabel,
  badgeIcon,
  badgeLabel,
  fields,
  footerAction,
  footerPrompt,
  onBack,
  onSubmit,
  status,
  stepLabel,
  strength,
  submitError,
  submitAction,
  terms,
  titleLines,
}: AuthRegisterScreenProps) {
  return (
    <AuthPhoneFrame withCastle={false}>
      <AuthStatusBar {...status} />
      <div className="flex items-center justify-between px-[18px] pt-2">
        <AuthBackButton label={backLabel} onClick={onBack} />
        <span className="font-game text-[10px] font-bold uppercase tracking-[.3em] text-[#6d5838]">{stepLabel}</span>
      </div>
      <div className="px-[22px] pb-1 pt-2 text-center">
        <div className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] px-2.5 py-1 font-game text-[9.5px] font-extrabold uppercase tracking-[.18em] text-[#3a2a00] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
          <img alt="" className="size-3" src={publicAsset(badgeIcon)} />
          {badgeLabel}
        </div>
        <div className="mt-2 font-game text-[22px] font-black leading-[1.05] tracking-[.02em] text-[#3c2619] [text-shadow:1px_1px_0_rgba(255,255,255,.5)]">
          {titleLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < titleLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </div>
      </div>
      <form className="contents" noValidate onSubmit={onSubmit}>
        <div className="flex flex-col gap-2.5 px-[22px] pt-2.5">
          {fields.lord ? <AuthField {...fields.lord} /> : null}
          <AuthField {...fields.email} />
          <div className="flex flex-col gap-1">
            <AuthField {...fields.password} />
            <div className="-mt-0.5 pl-0.5">
              <AuthStrengthMeter {...strength} />
            </div>
          </div>
          {fields.confirmPassword ? <AuthField {...fields.confirmPassword} /> : null}
          {submitError ? (
            <div className="font-game text-[10.5px] font-semibold text-[#a13a2a]" role="alert">
              {submitError}
            </div>
          ) : null}
        </div>
        <div className="absolute bottom-[18px] left-[22px] right-[22px] flex flex-col gap-2.5">
          <label className="flex cursor-pointer items-start gap-2 font-game text-[10.5px] font-semibold leading-[1.35] text-[#6d5838]">
            <input
              checked={terms.checked}
              className="sr-only"
              onChange={(event) => terms.onChange(event.target.checked)}
              type="checkbox"
            />
            <span className="mt-px">
              <AuthCheckedGlyph checked={terms.checked} />
            </span>
            <span className="min-w-0 flex-1">
              {terms.firstText}{' '}
              <span className="border-b border-dotted border-current text-[#3c2619]">{terms.firstLinkLabel}</span>{' '}
              {terms.secondText}{' '}
              <span className="border-b border-dotted border-current text-[#3c2619]">{terms.secondLinkLabel}</span>
              {terms.suffix}
            </span>
          </label>
          <AuthButton
            disabled={submitAction.disabled}
            full
            onClick={submitAction.onClick}
            size={submitAction.size ?? 'lg'}
            type={submitAction.type ?? 'submit'}
            variant={submitAction.variant}
          >
            {submitAction.label}
          </AuthButton>
          <div className="text-center font-game text-[11px] font-bold text-[#6d5838]">
            {footerPrompt}
            <span className="ml-[5px]">
              <AuthTextButton {...footerAction} />
            </span>
          </div>
        </div>
      </form>
    </AuthPhoneFrame>
  );
}

export function AuthHeraldShieldButton({
  onSelect,
  selected,
  shield,
}: AuthHeraldShieldButtonProps) {
  return (
    <button
      className={cn(
        'relative aspect-[1/1.15] w-full cursor-pointer border-0 bg-transparent p-0 transition-transform duration-150',
        selected ? '[filter:drop-shadow(0_0_8px_rgba(241,196,15,.7))]' : '[filter:drop-shadow(0_4px_6px_rgba(0,0,0,.3))]',
      )}
      onClick={() => onSelect(shield.id)}
      type="button"
    >
      <div
        className="absolute inset-0 border-[3px] shadow-[inset_0_2px_0_rgba(255,255,255,.25),inset_0_-10px_18px_rgba(0,0,0,.25)] [clip-path:polygon(50%_100%,0%_75%,0%_8%,8%_0%,92%_0%,100%_8%,100%_75%)]"
        style={{
          background: `linear-gradient(to bottom, ${shield.field[0]}, ${shield.field[1]})`,
          borderColor: selected ? '#f1c40f' : '#3c2619',
        }}
      />
      <div
        className="absolute inset-0 opacity-[.6] mix-blend-overlay [clip-path:polygon(50%_100%,0%_75%,0%_8%,8%_0%,92%_0%,100%_8%,100%_75%)]"
        style={{
          background: `linear-gradient(135deg, transparent 38%, ${shield.accent} 38%, ${shield.accent} 52%, transparent 52%)`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pb-2">
        <span className="font-game text-4xl font-black leading-none text-white [text-shadow:0_2px_4px_rgba(0,0,0,.6)]">{shield.symbol}</span>
      </div>
      {selected ? (
        <div className="absolute right-1 top-1 rounded-full border-[1.5px] border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f6d57b,#c59e3f)] px-1.5 py-px font-game text-[8px] font-extrabold uppercase tracking-[.18em] text-[#3a2a00]">
          Choisi
        </div>
      ) : null}
      <div className="absolute bottom-[-16px] left-0 right-0 text-center font-game text-[10px] font-bold tracking-[.08em] text-[#6d5838]">{shield.label}</div>
    </button>
  );
}

export function AuthBannerScreen({
  backLabel,
  field,
  onBack,
  onShieldChange,
  onSubmit,
  quote,
  selectedShieldId,
  shieldLabel,
  shields,
  status,
  stepLabel,
  submitAction,
  subtitle,
  title,
}: AuthBannerScreenProps) {
  return (
    <AuthPhoneFrame withCastle={false}>
      <AuthStatusBar {...status} />
      <div className="flex items-center justify-between px-[18px] pt-2">
        <AuthBackButton label={backLabel} onClick={onBack} />
        <span className="font-game text-[10px] font-bold uppercase tracking-[.3em] text-[#6d5838]">{stepLabel}</span>
      </div>
      <div className="px-[22px] pb-2 pt-2.5 text-center">
        <div className="font-game text-xl font-black tracking-[.02em] text-[#3c2619] [text-shadow:1px_1px_0_rgba(255,255,255,.5)]">{title}</div>
        <div className="mt-[3px] font-game text-[11.5px] italic text-[#6d5838]">{subtitle}</div>
      </div>
      <form className="contents" noValidate onSubmit={onSubmit}>
        <div className="px-[22px] pb-2">
          <AuthField {...field} />
        </div>
        <div className="px-[22px] pt-1">
          <div className="mb-2 font-game text-[10px] font-bold uppercase tracking-[.22em] text-[#6d5838]">{shieldLabel}</div>
          <div className="grid grid-cols-3 gap-x-3.5 gap-y-3 pb-[22px]">
            {shields.map((shield) => (
              <AuthHeraldShieldButton
                key={shield.id}
                onSelect={onShieldChange}
                selected={selectedShieldId === shield.id}
                shield={shield}
              />
            ))}
          </div>
        </div>
        <div className="absolute bottom-[18px] left-[22px] right-[22px] flex flex-col gap-2">
          <AuthButton
            disabled={submitAction.disabled}
            full
            onClick={submitAction.onClick}
            size={submitAction.size ?? 'lg'}
            type={submitAction.type ?? 'submit'}
            variant={submitAction.variant}
          >
            {submitAction.label}
          </AuthButton>
          <div className="text-center font-game text-[10.5px] italic text-[#6d5838]">{quote}</div>
        </div>
      </form>
    </AuthPhoneFrame>
  );
}
