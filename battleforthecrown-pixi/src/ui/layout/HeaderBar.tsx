import { forwardRef, HTMLAttributes, ReactNode } from 'react';

export interface HeaderBarProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const HeaderBar = forwardRef<HTMLDivElement, HeaderBarProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={`
          w-full h-16 
          bg-gradient-to-r from-[#8b6f47] via-[#6f5139] to-[#5d4a32]
          border-b-2 border-[#3d2f1f]
          shadow-[0_2px_8px_rgba(0,0,0,0.3)]
          px-4
          flex items-center justify-between
          ${className}
        `}
        {...props}
      >
        {children}
      </header>
    );
  }
);

HeaderBar.displayName = 'HeaderBar';
