import { ReactNode } from 'react';

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => {
  return (
    <div className={`px-3 pb-7 flex items-center justify-center gap-3 ${className}`}>
      {children}
    </div>
  );
};
