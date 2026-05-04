import { ReactNode } from 'react';

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
  withBanner?: boolean;
}

export const CardBody = ({ children, className = '', withBanner = false }: CardBodyProps) => {
  return (
    <div className={`${withBanner ? 'pt-28' : 'pt-12'} px-6 pb-7 ${className}`}>
      {children}
    </div>
  );
};
