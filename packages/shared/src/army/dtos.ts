import type { BarracksUnitType } from './types';

export interface TrainUnitsRequest {
  unitType: BarracksUnitType;
  quantity: number;
}
