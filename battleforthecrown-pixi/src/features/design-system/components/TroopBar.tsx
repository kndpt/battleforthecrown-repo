import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export interface TroopBarProps {
  className?: string;
  icon: string;
  lost: number;
  sent: number;
  unitName: string;
}

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');

export function TroopBar({ className, icon, lost, sent, unitName }: TroopBarProps) {
  const safeSent = Math.max(0, sent);
  const safeLost = Math.max(0, Math.min(lost, safeSent));
  const survivors = safeSent - safeLost;
  const survivorsPct = safeSent > 0 ? (survivors / safeSent) * 100 : 0;
  const lossPct = safeSent > 0 ? (safeLost / safeSent) * 100 : 0;

  const isWiped = safeSent > 0 && safeLost === safeSent;
  const isIntact = safeLost === 0 && safeSent > 0;

  const statusLabel = isIntact
    ? 'Aucune perte'
    : isWiped
      ? 'Anéantis'
      : `${NUMBER_FORMATTER.format(safeLost)} perte${safeLost > 1 ? 's' : ''}`;

  const statusToneClass = isIntact
    ? 'text-[#4a8c2a]'
    : isWiped
      ? 'text-[#a93226]'
      : 'text-[#a06a18]';

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      <div className="flex items-center gap-2 font-game text-[13px] text-[#3d2f1f]">
        <img alt="" className="size-[22px] flex-none object-contain" src={publicAsset(icon)} />
        <span className="flex-1 text-[11px] text-[#6d5838]">{unitName}</span>
        <b className="text-sm font-extrabold tabular-nums">
          {NUMBER_FORMATTER.format(survivors)}
          <span className="text-[#6d5838]">/</span>
          {NUMBER_FORMATTER.format(safeSent)}
        </b>
      </div>
      <div className="relative flex h-[14px] w-full overflow-hidden rounded-[7px] border-2 border-[rgba(0,0,0,.18)] bg-[rgba(0,0,0,.15)] shadow-[inset_0_2px_3px_rgba(0,0,0,.25)]">
        {survivorsPct > 0 ? (
          <div
            className="h-full bg-gradient-to-b from-[#6ebf49] to-[#4a8c2a]"
            style={{ width: `${survivorsPct}%` }}
          />
        ) : null}
        {lossPct > 0 ? (
          <div
            className="h-full bg-gradient-to-b from-[#e74c3c] to-[#a93226]"
            style={{ width: `${lossPct}%` }}
          />
        ) : null}
      </div>
      <span className={cn('font-game text-[10.5px] font-semibold uppercase tracking-[.08em]', statusToneClass)}>
        {statusLabel}
      </span>
    </div>
  );
}
