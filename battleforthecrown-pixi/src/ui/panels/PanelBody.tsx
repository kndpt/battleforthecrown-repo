import { forwardRef, HTMLAttributes, ReactNode } from 'react';

export interface PanelBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const PanelBody = forwardRef<HTMLDivElement, PanelBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PanelBody.displayName = 'PanelBody';
