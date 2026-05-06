import type { UnitType } from './types';

export interface TrainUnitsRequest {
  unitType: UnitType;
  quantity: number;
}
