import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { publicAsset } from '@/lib/publicAsset';

type IconTileSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<IconTileSize, string> = {
  sm: 'size-8 rounded-lg [&_img]:size-6',
  md: 'size-[44px] rounded-[10px] [&_img]:size-9',
  lg: 'size-[54px] rounded-[10px] [&_img]:size-11',
};

export interface IconTileProps {
  children?: ReactNode;
  className?: string;
  grayscale?: boolean;
  icon?: string;
  size?: IconTileSize;
}

export function IconTile({
  children,
  className,
  grayscale = false,
  icon,
  size = 'md',
}: IconTileProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center border-2 border-black/20 bg-black/20',
        sizeClass[size],
        grayscale && 'opacity-55 grayscale',
        className,
      )}
    >
      {icon ? (
        <img
          alt=""
          className="object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]"
          src={publicAsset(icon)}
        />
      ) : (
        children
      )}
    </span>
  );
}
