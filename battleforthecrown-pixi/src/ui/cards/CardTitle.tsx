import { ReactNode } from 'react';

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const CardTitle = ({ children, className = '', onClick }: CardTitleProps) => {
  return (
    <h3 className={`py-2 text-center font-cinzel font-bold text-[22px] uppercase text-white text-shadow-game ${className}`} onClick={onClick}>
      {children}
    </h3>
  );
};
