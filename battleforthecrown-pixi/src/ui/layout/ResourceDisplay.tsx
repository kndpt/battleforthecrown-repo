import { forwardRef, HTMLAttributes } from "react";
import {
  RESOURCE_CONFIG,
  ResourceType,
  formatResourceAmount,
} from "@/lib/resourceConfig";
import { Tooltip } from "../tooltips";

export interface ResourceDisplayItem {
  type: ResourceType;
  current: number;
  max?: number;
  production?: number;
}

export interface ResourceDisplayProps extends HTMLAttributes<HTMLDivElement> {
  resources: ResourceDisplayItem[];
  compact?: boolean;
}

export const ResourceDisplay = forwardRef<HTMLDivElement, ResourceDisplayProps>(
  ({ resources, compact = false, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-4 ${className}`}
        {...props}
      >
        {resources.map((resource) => {
          const config = RESOURCE_CONFIG[resource.type];
          const max = resource.max || 0;
          const isAtCapacity = max > 0 && resource.current >= max;
          // Calculer le pourcentage de remplissage (0-100%)
          const fillPercentage =
            max > 0 ? Math.min((resource.current / max) * 100, 100) : 0;

          const tooltipContent = (
            <div className="text-center space-y-1">
              <div className="font-cinzel font-bold text-sm text-white">
                {config.nameCapitalized}
              </div>
              <div className="text-xs text-white/80">
                Stock&nbsp;: {formatResourceAmount(resource.current)}
                {max > 0 && (
                  <>
                    {" "}
                    / {formatResourceAmount(max)}
                  </>
                )}
              </div>
              {resource.production && (
                <div className="text-xs text-emerald-200">
                  +{formatResourceAmount(resource.production)} / h
                </div>
              )}
            </div>
          );

          return (
            <Tooltip
              key={resource.type}
              content={tooltipContent}
              position="bottom"
              variant="dark"
            >
              <div className="relative w-[55px] h-[19px] cursor-help">
                {/* Bloc clippé: fond + progress */}
                <div
                  className="absolute inset-0 flex items-center justify-center
                  bg-black/20 rounded-md px-3 py-1 border border-[#3d2f1f]
                  overflow-hidden"
                >
                  {/* Progress dans le clip */}
                  {max > 0 && (
                    <div
                      className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                        isAtCapacity
                          ? "bg-gradient-to-r from-red-500/30 to-red-400/40"
                          : "bg-gradient-to-r from-white/20 to-white/10"
                      }`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  )}

                  {/* Valeurs (au-dessus de la progress) */}
                  <div className="relative z-10 flex flex-col items-center justify-center leading-tight pl-3">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-cinzel font-bold text-sm text-white"
                      >
                        {formatResourceAmount(resource.current)}
                      </span>
                      {resource.max && !compact && (
                        <span className="text-white/60 font-semibold text-[11px]">
                          /{formatResourceAmount(resource.max)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Icône en dehors du clip (plus coupée) */}
                <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <img
                    src={config.assetPath}
                    alt={config.name}
                    width={21}
                    height={21}
                    className="drop-shadow-sm"
                  />
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
  }
);

ResourceDisplay.displayName = "ResourceDisplay";
