import { Send } from 'lucide-react';
import { Avatar, type AvatarProps } from './Avatar';
import { Badge } from './Badge';
import { BftcButton } from './BftcButton';
import { cn } from '@/lib/cn';

export interface ChatMessage {
  avatar?: AvatarProps;
  id: string;
  message: string;
  role?: string;
  sender?: string;
  time?: string;
  type?: 'other' | 'self' | 'system';
}

export interface ChatPanelProps {
  className?: string;
  inputPlaceholder?: string;
  inputValue: string;
  messages: ChatMessage[];
  onInputChange: (value: string) => void;
  onSubmit?: () => void;
  title: string;
}

export function ChatPanel({
  className,
  inputPlaceholder = 'Message...',
  inputValue,
  messages,
  onInputChange,
  onSubmit,
  title,
}: ChatPanelProps) {
  return (
    <section className={cn('overflow-hidden rounded-[16px] border-[3px] border-[#8b7355] bg-[#f5e6d3] shadow-[0_4px_0_rgba(0,0,0,0.18)]', className)}>
      <header className="flex items-center justify-between border-b-2 border-[#8b7355] bg-gradient-to-b from-[#5d4a32] to-[#3d2f1f] px-3 py-2">
        <h3 className="font-game text-sm font-extrabold uppercase tracking-[0.14em] text-[#fef9f0]">{title}</h3>
        <Badge tone="success">online</Badge>
      </header>
      <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-3">
        {messages.map((message) => {
          if (message.type === 'system') {
            return (
              <div key={message.id} className="self-center rounded-full border border-[#b8a082] bg-white/55 px-2 py-1 font-game text-[10px] font-bold text-[#6d5838]">
                {message.message}
              </div>
            );
          }

          const self = message.type === 'self';

          return (
            <div key={message.id} className={cn('flex items-end gap-2', self ? 'justify-end' : 'justify-start')}>
              {!self ? <Avatar {...(message.avatar ?? { initials: message.sender?.slice(0, 2).toUpperCase() ?? '?' })} size="sm" /> : null}
              <div
                className={cn(
                  'max-w-[78%] rounded-2xl border-2 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
                  self
                    ? 'border-[#1f5288] bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] text-white text-shadow-game'
                    : 'border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] text-[#1f2937]',
                )}
              >
                {!self && message.sender ? (
                  <div className="mb-0.5 flex items-center gap-1.5 font-game text-[10px] font-bold text-[#6d5838]">
                    <span>{message.sender}</span>
                    {message.role ? <Badge size="sm" tone="warning">{message.role}</Badge> : null}
                  </div>
                ) : null}
                <p className="font-game text-sm font-bold leading-5">{message.message}</p>
                {message.time ? <div className={cn('mt-0.5 text-right font-game text-[9px] font-bold', self ? 'text-white/80' : 'text-[#6d5838]')}>{message.time}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="flex gap-2 border-t-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] p-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-xl border-2 border-[#8b7355] bg-white/70 px-3 py-2 font-game text-sm font-bold text-[#1f2937] outline-none placeholder:text-[#8b7355]"
          onChange={(event) => onInputChange(event.currentTarget.value)}
          placeholder={inputPlaceholder}
          value={inputValue}
        />
        <BftcButton disabled={!inputValue.trim()} size="xs" type="submit" variant="info">
          <Send size={14} />
        </BftcButton>
      </form>
    </section>
  );
}
