/**
 * Configuration centralisée des unités militaires
 * @author Kelvin Dupont
 * @date 2025-10-08
 */

import { UnitType } from "./types";

export interface UnitConfig {
  id: UnitType;
  name: string;
  assetPath: string;
}

export const UNIT_CONFIG: Record<UnitType, UnitConfig> = {
  [UnitType.MILITIA]: {
    id: UnitType.MILITIA,
    name: "Milice de paysans",
    assetPath: "/assets/army/militia.png",
  },
  [UnitType.SQUIRE]: {
    id: UnitType.SQUIRE,
    name: "Écuyer",
    assetPath: "/assets/army/squire.png",
  },
  [UnitType.WARRIOR]: {
    id: UnitType.WARRIOR,
    name: "Guerrier",
    assetPath: "/assets/army/warrior.png",
  },
  [UnitType.ARCHER]: {
    id: UnitType.ARCHER,
    name: "Archer",
    assetPath: "/assets/army/archer.png",
  },
  [UnitType.CAVALRY]: {
    id: UnitType.CAVALRY,
    name: "Cavalerie",
    assetPath: "/assets/army/cavalry.png",
  },
  [UnitType.TEMPLAR]: {
    id: UnitType.TEMPLAR,
    name: "Templier",
    assetPath: "/assets/army/templar.png",
  },
  [UnitType.CATAPULT]: {
    id: UnitType.CATAPULT,
    name: "Catapulte",
    assetPath: "/assets/army/catapult.png",
  },
  [UnitType.SPY]: {
    id: UnitType.SPY,
    name: "Espion",
    assetPath: "/assets/army/spy.png",
  },
  [UnitType.RAM]: {
    id: UnitType.RAM,
    name: "Bélier",
    assetPath: "/assets/army/ram.png",
  },
  [UnitType.NOBLE]: {
    id: UnitType.NOBLE,
    name: "Noble",
    assetPath: "/assets/army/noble.png",
  },
};
