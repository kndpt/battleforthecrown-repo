import { ReactNode } from 'react';

export interface CardStatsProps {
  children: ReactNode;
  className?: string;
}

export const CardStats = ({ children, className = '' }: CardStatsProps) => {
  return (
    <div className={`relative mx-auto my-4 w-[92%] h-[98px] rounded-3xl border-[6px] border-[#515c6c] bg-gradient-to-b from-[#6f7b8b] via-[#616c7b] to-[#505a69] shadow-[inset_0_12px_22px_rgba(0,0,0,0.35),inset_0_2px_0_rgba(255,255,255,0.25)] ${className}`}>
      {/* Encoches latérales */}
      <div className="absolute -top-[6px] left-[18px] w-10 h-6 bg-gradient-to-b from-[#687485] to-[#515c6c] border-[6px] border-b-0 border-[#515c6c] rounded-b-2xl -skew-x-[10deg]" />
      <div className="absolute -top-[6px] right-[18px] w-10 h-6 bg-gradient-to-b from-[#687485] to-[#515c6c] border-[6px] border-b-0 border-[#515c6c] rounded-b-2xl skew-x-[10deg]" />
      
      {/* Contenu des stats */}
      <div className="absolute inset-0 grid place-items-center text-center text-[#eaf1ff] font-game font-extrabold">
        {children}
      </div>
    </div>
  );
};

export interface StatsContentProps {
  value: string | ReactNode;
  label?: string;
}

export const StatsContent = ({ value, label }: StatsContentProps) => {
  return (
    <div>
      <div className="text-[26px] tracking-wide drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">
        {value}
      </div>
      {label && (
        <div className="text-xs opacity-90 mt-0.5">{label}</div>
      )}
    </div>
  );
};
