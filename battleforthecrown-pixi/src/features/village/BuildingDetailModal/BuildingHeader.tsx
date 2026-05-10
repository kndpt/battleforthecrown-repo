import { Badge } from '@/ui';
import { BuildingIcon } from '../BuildingIcon';

interface BuildingHeaderProps {
  iconPath: string | null;
  emoji: string;
  buildingName: string;
  buildingDescription: string;
  level: number;
  isMaxLevel: boolean;
  isUnbuilt: boolean;
}

export function BuildingHeader({
  iconPath,
  emoji,
  buildingName,
  buildingDescription,
  level,
  isMaxLevel,
  isUnbuilt,
}: BuildingHeaderProps) {
  return (
    <div className="relative h-32 bg-gradient-to-br from-kingdom-100 via-kingdom-200 to-kingdom-300 border-b-4 border-game-gold-border flex-shrink-0 grid grid-cols-3 items-center">
      <div className="relative flex items-center justify-center">
        <BuildingIcon
          iconPath={iconPath}
          label={buildingName}
          emoji={emoji}
          width={90}
          height={90}
          imageClassName="object-contain drop-shadow-2xl"
          fallbackClassName="text-6xl drop-shadow-2xl"
          loading="eager"
        />

        <div className="absolute top-2 left-2">
          <Badge
            variant={isMaxLevel ? 'success' : isUnbuilt ? 'neutral' : 'warning'}
            size="md"
            className="font-bold shadow-lg"
          >
            {isUnbuilt ? 'Non construit' : `Niv. ${level}`}
          </Badge>
        </div>
      </div>

      <div className="col-span-2 flex flex-col justify-center space-y-1 pr-3">
        <h2 className="font-cinzel text-xl font-bold text-kingdom-900 text-shadow">
          {buildingName}
        </h2>
        <p className="text-sm text-stone-700 leading-snug">{buildingDescription}</p>
      </div>
    </div>
  );
}
