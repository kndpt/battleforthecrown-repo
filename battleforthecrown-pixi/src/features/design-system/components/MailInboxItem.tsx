import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type MailInboxTone = 'attack' | 'report' | 'scout' | 'system' | 'player';

export interface MailInboxTag {
  label: string;
  tone: Exclude<MailInboxTone, 'player'>;
}

export interface MailInboxItemProps {
  alertLabel?: string;
  className?: string;
  icon: string;
  onClick?: () => void;
  preview: string;
  sender: string;
  subject: string;
  tag?: MailInboxTag;
  time: string;
  tone: MailInboxTone;
  unread?: boolean;
}

export interface InboxTabOption {
  count?: string;
  label: string;
  value: string;
}

export interface InboxTabsProps {
  className?: string;
  onChange: (value: string) => void;
  options: InboxTabOption[];
  value: string;
}

const iconToneClass: Record<MailInboxTone, string> = {
  attack: 'border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)]',
  report: 'border-[#3a6c1f] bg-[linear-gradient(to_bottom,#a8d28d,#4a8c2a)]',
  scout: 'border-[#1f5288] bg-[linear-gradient(to_bottom,#5b9bd5,#1f5288)]',
  system: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)]',
  player: 'border-[#1f5288] bg-[linear-gradient(to_bottom,#cfe2f6,#2e75b6)]',
};

const tagToneClass: Record<MailInboxTag['tone'], string> = {
  attack: 'border-[#a93226] bg-[rgba(231,76,60,.18)] text-[#a93226]',
  report: 'border-[#3a6c1f] bg-[rgba(110,191,73,.2)] text-[#3a6c1f]',
  scout: 'border-[#1f5288] bg-[rgba(91,155,213,.22)] text-[#1f5288]',
  system: 'border-[#9e7b0d] bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)] text-[#3a2a00]',
};

export function InboxTabs({ className, onChange, options, value }: InboxTabsProps) {
  return (
    <div className={cn('mb-2 flex gap-[3px] rounded-[10px] border-2 border-[#8b7355] bg-[rgba(0,0,0,.05)] p-[3px]', className)}>
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-[5px] rounded-[7px] border-0 bg-transparent px-2 py-[5px] font-game text-[11px] font-bold text-[#6d5838]',
              active ? 'bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] text-[#3d2f1f] shadow-[0_1px_0_rgba(0,0,0,.18),inset_0_1px_0_rgba(255,255,255,.5)]' : '',
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <span className="truncate">{option.label}</span>
            {option.count ? (
              <span className="flex-shrink-0 rounded-full bg-[rgba(231,76,60,.85)] px-[5px] py-px text-[9.5px] font-extrabold text-white">{option.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function MailInboxItem({
  alertLabel,
  className,
  icon,
  onClick,
  preview,
  sender,
  subject,
  tag,
  time,
  tone,
  unread = false,
}: MailInboxItemProps) {
  const Tag = onClick ? 'button' : 'article';

  return (
    <Tag
      className={cn(
        'relative grid w-full grid-cols-[38px_1fr_auto] items-center gap-2.5 rounded-[10px] border-2 border-[#8b7355] bg-[linear-gradient(to_bottom,#fef9f0,#e8d4a8)] px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.45)]',
        unread ? 'bg-[linear-gradient(to_bottom,#fff,#fef9f0)] before:absolute before:-left-0.5 before:top-1/2 before:h-[60%] before:w-[5px] before:-translate-y-1/2 before:rounded-[0_3px_3px_0] before:bg-[linear-gradient(to_bottom,#f1c40f,#d4a017)]' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className={cn('flex size-[38px] items-center justify-center rounded-[9px] border-2', iconToneClass[tone])}>
        <img alt="" className="size-7" src={publicAsset(icon)} />
      </div>
      <div className="flex min-w-0 flex-col gap-px">
        <div className="flex items-center gap-1.5 font-game text-[10.5px] text-[#6d5838]">
          {tag ? <span className={cn('rounded-full border px-[5px] py-px text-[9px] font-bold', tagToneClass[tag.tone])}>{tag.label}</span> : null}
          {sender}
        </div>
        <div className={cn('truncate font-game text-[12.5px] font-bold leading-[1.15] text-[#3d2f1f]', unread ? 'font-extrabold' : '')}>{subject}</div>
        <div className="truncate font-game text-[10.5px] leading-[1.2] text-[#6d5838]">{preview}</div>
      </div>
      <div className="flex flex-col items-end gap-[3px]">
        <span className="font-game text-[10px] tabular-nums text-[#6d5838]">{time}</span>
        {alertLabel ? (
          <span className="flex h-[18px] min-w-5 items-center justify-center rounded-full border-[1.5px] border-[#a93226] bg-[linear-gradient(to_bottom,#e74c3c,#c0392b)] px-1.5 font-game text-[10px] font-extrabold text-white [text-shadow:1px_1px_1px_rgba(0,0,0,.5)]">{alertLabel}</span>
        ) : null}
      </div>
    </Tag>
  );
}
