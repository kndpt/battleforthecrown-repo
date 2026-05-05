import { forwardRef, HTMLAttributes } from 'react';
import { getResourceConfig, ResourceType, isValidResourceType } from '@/lib/resourceConfig';

export interface ResourceIconProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  resource: ResourceType | string;
  size?: number;
  fallbackToEmoji?: boolean; // Si true, utilise l'emoji si l'image fail
  showTooltip?: boolean; // Si true, montre le nom dans un tooltip
}

export const ResourceIcon = forwardRef<HTMLDivElement, ResourceIconProps>(
  ({ 
    resource, 
    size = 24, 
    fallbackToEmoji = true, 
    showTooltip = false,
    className = '',
    ...props 
  }, ref) => {
    // Vérifier si c'est un type de ressource valide
    if (!isValidResourceType(resource)) {
      console.warn(`ResourceIcon: Type de ressource invalide: ${resource}`);
      return (
        <div 
          ref={ref}
          className={`flex items-center justify-center ${className}`}
          style={{ width: size, height: size }}
          {...props}
        >
          <span style={{ fontSize: size * 0.8 }}>❓</span>
        </div>
      );
    }

    const config = getResourceConfig(resource);

    return (
      <div 
        ref={ref}
        className={`flex items-center justify-center ${className}`}
        title={showTooltip ? config.nameCapitalized : undefined}
        {...props}
      >
        <img
          src={config.assetPath}
          alt={config.nameCapitalized}
          width={size}
          height={size}
          className="object-contain"
          onError={(e) => {
            if (fallbackToEmoji) {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }
          }}
        />
        {fallbackToEmoji && (
          <span 
            className="hidden"
            style={{ fontSize: size * 0.8 }}
          >
            {config.icon}
          </span>
        )}
      </div>
    );
  }
);

ResourceIcon.displayName = 'ResourceIcon';
