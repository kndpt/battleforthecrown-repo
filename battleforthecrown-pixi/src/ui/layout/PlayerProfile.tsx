import { forwardRef, HTMLAttributes } from "react";
import { Badge } from "../badges";
import { User } from "lucide-react";

export interface PlayerProfileProps extends HTMLAttributes<HTMLDivElement> {
  playerName: string;
  level: number;
  avatarUrl?: string;
  showTextProfile?: boolean;
}

export const PlayerProfile = forwardRef<HTMLDivElement, PlayerProfileProps>(
  (
    {
      playerName,
      level,
      avatarUrl,
      showTextProfile = true,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-3 ${className}`}
        {...props}
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-[#f5e6d3] overflow-hidden bg-[#d4c094] flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={playerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={18} className="text-[#5d4a32]" />
            )}
          </div>
          {/* Badge de niveau */}
          <Badge
            variant="neutral"
            size="sm"
            className="absolute -bottom-1 -right-1"
          >
            {level}
          </Badge>
        </div>

        {/* Nom du joueur */}
        {showTextProfile && (
          <div className="flex flex-col">
            <span className="font-cinzel text-[#f5e6d3] font-semibold text-sm leading-none">
              {playerName}
            </span>
            <span className="text-[#d4c094] text-xs">Niveau {level}</span>
          </div>
        )}
      </div>
    );
  }
);

PlayerProfile.displayName = "PlayerProfile";
