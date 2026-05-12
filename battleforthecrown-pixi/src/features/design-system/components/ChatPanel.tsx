import { publicAsset } from '@/lib/publicAsset';
import { cn } from '@/lib/cn';

export type ChatMessageType = 'other' | 'self' | 'system';
export type ChatRoleTone = 'gold' | 'stone';

export interface ChatRoleTag {
  label: string;
  tone?: ChatRoleTone;
}

export interface ChatInlinePing {
  icon: string;
  label: string;
}

export interface ChatMessage {
  avatarIcon?: string;
  id: string;
  inlinePing?: ChatInlinePing;
  message: string;
  role?: ChatRoleTag;
  sender?: string;
  time?: string;
  type: ChatMessageType;
}

export interface ChatPanelProps {
  className?: string;
  emblemIcon: string;
  inputPlaceholder?: string;
  inputValue: string;
  messages: ChatMessage[];
  online?: boolean;
  onInputChange: (value: string) => void;
  onSubmit?: () => void;
  selfAvatarIcon?: string;
  subtitle: string;
  title: string;
}

const roleToneClass: Record<ChatRoleTone, string> = {
  gold: 'border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] text-[#3a2a00]',
  stone: 'border-[#5d6d6e] bg-gradient-to-b from-[#bfc7cb] to-[#7f8c8d] text-[#1f2933]',
};

export function ChatPanel({
  className,
  emblemIcon,
  inputPlaceholder = 'Écrire un message…',
  inputValue,
  messages,
  online = true,
  onInputChange,
  onSubmit,
  selfAvatarIcon,
  subtitle,
  title,
}: ChatPanelProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-col gap-[6px] rounded-[14px] border-2 border-[#8b7355] bg-gradient-to-b from-[#e8d4a8] to-[#d4c094] p-[10px]',
        className,
      )}
    >
      <header className="flex items-center gap-2 border-b border-[rgba(0,0,0,.12)] px-1 pb-2 pt-1">
        <span className="flex size-[30px] items-center justify-center rounded-lg border-2 border-[#3d2f1f] bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#8b6f47)]">
          <img alt="" className="size-5 object-contain" src={publicAsset(emblemIcon)} />
        </span>
        <span className="min-w-0">
          <h3 className="truncate font-game text-[13px] font-bold leading-tight text-[#3d2f1f]">{title}</h3>
          <span className="block truncate font-game text-[10px] leading-tight text-[#6d5838]">{subtitle}</span>
        </span>
        {online ? <span aria-label="En ligne" className="ml-auto size-2 rounded-full bg-[#6ebf49] shadow-[0_0_6px_#6ebf49]" /> : null}
      </header>
      <div className="flex flex-col gap-[6px]">
        {messages.map((message) => {
          if (message.type === 'system') {
            return (
              <div key={message.id} className="grid grid-cols-1">
                <div className="max-w-none rounded-full border border-[#9e7b0d] bg-[rgba(241,196,15,.18)] px-3 py-[3px] text-center font-game text-[10.5px] italic leading-snug text-[#5a4400]">
                  {message.message}
                  {message.time ? ` · ${message.time}` : null}
                </div>
              </div>
            );
          }

          const self = message.type === 'self';
          const avatarIcon = self ? selfAvatarIcon : message.avatarIcon;

          return (
            <div key={message.id} className={cn('grid items-end gap-2', self ? 'grid-cols-[1fr_28px]' : 'grid-cols-[28px_1fr]')}>
              {avatarIcon ? (
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-[7px] border-2 border-[#3d2f1f] bg-[radial-gradient(circle_at_30%_25%,#fef0c6,#8b6f47)]',
                    self ? 'order-2 bg-[radial-gradient(circle_at_30%_25%,#a8d28d,#3a6c1f)]' : '',
                  )}
                >
                  <img alt="" className="size-[18px] object-contain" src={publicAsset(avatarIcon)} />
                </span>
              ) : (
                <span aria-hidden className={self ? 'order-2' : ''} />
              )}
              <div
                className={cn(
                  'max-w-[80%] border-[1.5px] px-[10px] py-[6px] font-game text-xs leading-snug text-[#3d2f1f] shadow-[0_1px_2px_rgba(0,0,0,.1)]',
                  self
                    ? 'order-1 justify-self-end rounded-[12px_12px_4px_12px] border-[#3a6c1f] bg-gradient-to-b from-[#d6ecc4] to-[#a8d28d]'
                    : 'rounded-[12px_12px_12px_4px] border-[#8b7355] bg-[#fef9f0]',
                )}
              >
                {message.sender ? (
                  <div className="mb-0.5 flex items-center gap-1 font-game text-[10.5px] font-bold leading-tight text-[#3d2f1f]">
                    <span>{message.sender}</span>
                    {message.role ? (
                      <span
                        className={cn(
                          'rounded-full border px-1 font-game text-[9px] font-extrabold leading-[14px]',
                          roleToneClass[message.role.tone ?? 'gold'],
                        )}
                      >
                        {message.role.label}
                      </span>
                    ) : null}
                    {message.time ? <span className="ml-auto text-[9px] font-normal text-[#6d5838]">{message.time}</span> : null}
                  </div>
                ) : null}
                {message.message}
                {message.inlinePing ? (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-[#1f5288] bg-[rgba(91,155,213,.22)] px-1.5 py-px text-[11px] font-bold leading-tight text-[#102e58]">
                    <img alt="" className="size-[13px] object-contain" src={publicAsset(message.inlinePing.icon)} />
                    {message.inlinePing.label}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="mt-[6px] flex items-center gap-[6px] border-t border-[rgba(0,0,0,.12)] px-1 pt-[6px]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-full border-2 border-[#8b7355] bg-[#fef9f0] px-3 py-[7px] font-game text-xs leading-none text-[#3d2f1f] shadow-[inset_0_1px_2px_rgba(0,0,0,.1)] outline-none placeholder:text-[#6d5838]"
          onChange={(event) => onInputChange(event.currentTarget.value)}
          placeholder={inputPlaceholder}
          value={inputValue}
        />
        <button
          className="size-[34px] rounded-full border-2 border-[#3a6c1f] bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a] font-game text-base font-black leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25)] [text-shadow:1px_1px_2px_rgba(0,0,0,.5)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!inputValue.trim()}
          type="submit"
        >
          ➤
        </button>
      </form>
    </section>
  );
}
