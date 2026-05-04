import { forwardRef, type HTMLAttributes } from 'react';

export interface HeaderActionsProps extends HTMLAttributes<HTMLDivElement> {
  notificationCount?: number;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onMenuClick?: () => void;
}

export const HeaderActions = forwardRef<HTMLDivElement, HeaderActionsProps>(
  ({ className = '', ...props }, ref) => {
    return <div ref={ref} className={`flex items-center gap-2 ${className}`} {...props} />;
  },
);

HeaderActions.displayName = 'HeaderActions';
