import { useState } from 'react';

interface BuildingIconProps {
  iconPath: string | null;
  label: string;
  emoji: string;
  width: number;
  height: number;
  imageClassName?: string;
  fallbackClassName?: string;
  loading?: 'eager' | 'lazy';
}

export function BuildingIcon({
  iconPath,
  label,
  emoji,
  width,
  height,
  imageClassName,
  fallbackClassName,
  loading = 'lazy',
}: BuildingIconProps) {
  const [failedIconPath, setFailedIconPath] = useState<string | null>(null);

  if (iconPath && failedIconPath !== iconPath) {
    return (
      <img
        src={iconPath}
        alt={label}
        width={width}
        height={height}
        loading={loading}
        className={imageClassName}
        onError={() => setFailedIconPath(iconPath)}
      />
    );
  }

  return (
    <span role="img" aria-label={label} className={fallbackClassName}>
      {emoji}
    </span>
  );
}
