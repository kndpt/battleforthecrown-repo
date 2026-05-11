import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

export type HeraldicField = 'quartered' | 'sable' | 'gules' | 'azure' | 'vert' | 'or' | 'purpure';
export type HeraldicCharge = 'none' | 'chevron' | 'fess' | 'cross' | 'pile';
export type RelationTone = 'self' | 'ally' | 'nap' | 'war';

const fieldClass: Record<HeraldicField, string> = {
  quartered: 'bg-[linear-gradient(135deg,#a93226_50%,transparent_50.1%)_top_left/50%_50%_no-repeat,linear-gradient(225deg,#1a3a6e_50%,transparent_50.1%)_top_right/50%_50%_no-repeat,linear-gradient(45deg,#1a3a6e_50%,transparent_50.1%)_bottom_left/50%_50%_no-repeat,linear-gradient(315deg,#a93226_50%,transparent_50.1%)_bottom_right/50%_50%_no-repeat,#2a1810]',
  sable: 'bg-gradient-to-b from-[#3d2f1f] to-[#0a0a0a]',
  gules: 'bg-gradient-to-b from-[#a93226] to-[#5a1612]',
  azure: 'bg-gradient-to-b from-[#2c5fa3] to-[#102e58]',
  vert: 'bg-gradient-to-b from-[#3e7e3e] to-[#1d4a1d]',
  or: 'bg-gradient-to-b from-[#f1c40f] to-[#a87b25]',
  purpure: 'bg-gradient-to-b from-[#5b2c8a] to-[#2c0e4d]',
};

const relationClass: Record<RelationTone, string> = {
  self: 'border-[#704c0a] bg-[#f1c40f]/20 text-[#704c0a]',
  ally: 'border-[#3a6c1f] bg-[#6ebf49]/20 text-[#1a4408]',
  nap: 'border-[#1f5288] bg-[#5b9bd5]/20 text-[#102e58]',
  war: 'border-[#a93226] bg-gradient-to-b from-[#e74c3c] to-[#c0392b] text-white text-shadow-game',
};

export interface HeraldicShieldProps {
  charge?: HeraldicCharge;
  className?: string;
  field?: HeraldicField;
  glyph?: string;
  icon?: string;
}

export function HeraldicShield({ charge = 'none', className, field = 'quartered', glyph, icon }: HeraldicShieldProps) {
  return (
    <span
      className={cn(
        'relative grid h-[74px] w-[62px] shrink-0 place-items-center overflow-hidden shadow-[0_3px_4px_rgba(0,0,0,.45)] [clip-path:polygon(0_0,100%_0,100%_57%,100%_86%,50%_100%,0_86%,0_57%)]',
        fieldClass[field],
        className,
      )}
    >
      {charge === 'chevron' ? <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent_46%,#f1c40f_46.5%,#f1c40f_53.5%,transparent_54%)_bottom_left/52%_52%_no-repeat,linear-gradient(45deg,transparent_46%,#f1c40f_46.5%,#f1c40f_53.5%,transparent_54%)_bottom_right/52%_52%_no-repeat]" /> : null}
      {charge === 'fess' ? <span className="absolute left-0 right-0 top-[38%] h-[14%] bg-gradient-to-b from-[#f1c40f] to-[#a87b25]" /> : null}
      {charge === 'cross' ? <><span className="absolute bottom-[8%] left-[42%] right-[42%] top-[8%] bg-gradient-to-b from-[#fef9f0] to-[#cdb88a]" /><span className="absolute left-[8%] right-[8%] top-[38%] h-[18%] bg-gradient-to-b from-[#fef9f0] to-[#cdb88a]" /></> : null}
      {charge === 'pile' ? <span className="absolute left-1/2 top-[-2%] h-0 w-0 -translate-x-1/2 border-x-[32px] border-t-[68px] border-x-transparent border-t-[#f1c40f]" /> : null}
      <span className="absolute inset-0 shadow-[inset_0_0_0_2.5px_#3d2f1f,inset_0_0_0_4px_rgba(241,196,15,.5)]" />
      {icon ? <img alt="" className="relative z-[2] size-[30px] object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]" src={publicAsset(icon)} /> : null}
      {glyph ? <span className="relative z-[2] font-game text-[28px] font-black text-[#fef9f0] text-shadow-game">{glyph}</span> : null}
    </span>
  );
}

export interface AllianceBannerProps {
  className?: string;
  members: string;
  motto: string;
  name: string;
  points: string;
  rank: string;
  shield: HeraldicShieldProps;
  tag: string;
}

export function AllianceBanner({ className, members, motto, name, points, rank, shield, tag }: AllianceBannerProps) {
  return (
    <article className={cn('relative flex items-center gap-3.5 overflow-hidden rounded-[14px] border-[3px] border-[#704c0a] bg-gradient-to-b from-[#3d2f1f] to-[#1a1a1a] px-4 py-3.5 font-game text-[#f6d57b] shadow-[0_6px_14px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.15)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_0%_0%,rgba(241,196,15,.13),transparent_45%),radial-gradient(circle_at_100%_100%,rgba(169,50,38,.18),transparent_50%)] before:content-[""]', className)}>
      <HeraldicShield {...shield} />
      <div className="relative min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-game text-[22px] font-black tracking-[0.06em] text-[#f1c40f] text-shadow-game">{tag}</span>
          <span className="font-game text-[15px] font-bold text-[#fef9f0]">{name}</span>
        </div>
        <p className="truncate font-game text-[10.5px] italic text-[#cdb88a]">{motto}</p>
        <p className="mt-1 font-game text-[10px] uppercase tracking-[0.08em] text-[#cdb88a]">{members}</p>
      </div>
      <div className="relative text-right font-game text-[10px] uppercase tracking-[0.04em] text-[#cdb88a]">
        <span>Points</span>
        <b className="block text-base font-extrabold normal-case tracking-normal text-[#f6d57b]">{points}</b>
        <span className="mt-1 inline-flex rounded-full border border-[#9e7b0d] bg-gradient-to-b from-[#f1c40f] to-[#d4a017] px-2 py-0.5 text-[11px] font-extrabold normal-case text-[#3a2a00]">{rank}</span>
      </div>
    </article>
  );
}

export interface AllianceRowProps {
  className?: string;
  members: string;
  name: string;
  points: string;
  relation: string;
  relationTone: RelationTone;
  shield: HeraldicShieldProps;
  tag: string;
}

export function AllianceRow({ className, members, name, points, relation, relationTone, shield, tag }: AllianceRowProps) {
  return (
    <article className={cn('grid grid-cols-[62px_1fr_auto] items-center gap-3 rounded-xl border-2 border-[#8b7355] bg-gradient-to-b from-[#fef9f0] to-[#e8d4a8] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_3px_0_rgba(0,0,0,.16)]', relationTone === 'self' ? 'border-[#9e7b0d] bg-gradient-to-b from-[#fef0c6] to-[#e8c878]' : '', className)}>
      <HeraldicShield {...shield} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 font-game text-[13.5px] font-extrabold text-[#3d2f1f]"><span className="rounded border border-[#704c0a]/40 bg-black/5 px-1.5 text-[11px] text-[#704c0a]">[{tag}]</span>{name}</div>
        <div className="flex flex-wrap items-center gap-2 font-game text-[10.5px] text-[#6d5838]">
          <span className={cn('rounded-full border px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.05em]', relationClass[relationTone])}>{relation}</span>
          {members}
        </div>
      </div>
      <div className="text-right font-game">
        <b className="block text-[15px] font-black tabular-nums text-[#3d2f1f]">{points}</b>
        <small className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-[#6d5838]">points</small>
      </div>
    </article>
  );
}
