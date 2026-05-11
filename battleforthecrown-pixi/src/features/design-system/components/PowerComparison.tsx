import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type PowerVerdictTone = 'win' | 'lose' | 'close';

export interface PowerUnitPill {
  icon: string;
  value: string;
}

export interface PowerComparisonProps {
  attackerLabel: string;
  attackerPower: string;
  attackerUnits?: PowerUnitPill[];
  defenderLabel: string;
  defenderPower: string;
  defenderUnits?: PowerUnitPill[];
  ratioLabel: string;
  value: number;
  verdict: string;
  verdictTone?: PowerVerdictTone;
}

const verdictClass: Record<PowerVerdictTone, string> = {
  win: 'border-[#3a6c1f] bg-[#6ebf49]/20 text-[#3a6c1f]',
  lose: 'border-[#a93226] bg-[#e74c3c]/20 text-[#7a1d10]',
  close: 'border-[#9e7b0d] bg-[#f1c40f]/25 text-[#5a4400]',
};

function UnitPill({ icon, value }: PowerUnitPill) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-black/20 bg-black/5 py-0.5 pl-1 pr-2 font-game text-[11px] font-bold tabular-nums text-[#3d2f1f]">
      <img alt="" className="size-4" src={publicAsset(icon)} />
      {value}
    </span>
  );
}

export function PowerComparison({ attackerLabel, attackerPower, attackerUnits = [], defenderLabel, defenderPower, defenderUnits = [], ratioLabel, value, verdict, verdictTone = 'win' }: PowerComparisonProps) {
  return (
    <section className="rounded-[14px] border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5)]">
      <header className="mb-2.5 flex items-center justify-between">
        <h4 className="font-game text-[11px] font-bold uppercase tracking-[0.15em] text-[#5d4a32]">Estimation</h4>
        <div className="font-game text-[13px] font-extrabold tabular-nums text-[#3d2f1f]">{ratioLabel}</div>
      </header>
      <div className="relative flex h-[38px] overflow-hidden rounded-[10px] border-2 border-[#3d2f1f] shadow-[inset_0_2px_4px_rgba(0,0,0,.35)]">
        <div className="flex items-center bg-gradient-to-b from-[#e74c3c] to-[#c0392b] px-2.5 font-game font-extrabold text-white text-shadow-game" style={{ width: `${value}%` }}>⚔ {attackerPower}</div>
        <div className="flex flex-1 items-center justify-end bg-gradient-to-b from-[#5b9bd5] to-[#2e75b6] px-2.5 font-game font-extrabold text-white text-shadow-game">🛡 {defenderPower}</div>
        <span className="absolute bottom-[-3px] left-1/2 top-[-3px] w-[3px] -translate-x-1/2 bg-[#1a1a1a] shadow-[0_0_4px_rgba(0,0,0,.6)]" />
      </div>
      <div className="mt-2 flex justify-between gap-2 font-game text-[10.5px] text-[#6d5838]">
        <span>{attackerLabel} · <b className="text-[#3d2f1f]">{attackerPower}</b></span>
        <span>{defenderLabel} · <b className="text-[#3d2f1f]">{defenderPower}</b></span>
      </div>
      {(attackerUnits.length || defenderUnits.length) ? (
        <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex flex-col items-start gap-1">{attackerUnits.map((unit) => <UnitPill key={`${unit.icon}-${unit.value}`} {...unit} />)}</div>
          <div className="font-game text-lg font-black text-[#a93226] [text-shadow:0_1px_0_#fff]">VS</div>
          <div className="flex flex-col items-end gap-1">{defenderUnits.map((unit) => <UnitPill key={`${unit.icon}-${unit.value}`} {...unit} />)}</div>
        </div>
      ) : null}
      <div className={cn('mt-2.5 rounded-[10px] border-[1.5px] px-2.5 py-2 font-game text-xs font-semibold', verdictClass[verdictTone])}>{verdict}</div>
    </section>
  );
}
