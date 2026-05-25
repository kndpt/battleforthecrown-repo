import type { WorldTempo } from './schemas';
import type { WorldTempoProfile } from './dtos';

export type TempoDurationAxis =
  | 'constructionSpeed'
  | 'unitTrainingSpeed'
  | 'lordTrainingSpeed'
  | 'travelSpeed'
  | 'captureWindow';

export type TempoRateAxis =
  | 'barbarianRegen'
  | 'resourceProduction'
  | 'crownsYield';

export type TempoAxis = TempoDurationAxis | TempoRateAxis;

export class TempoService {
  static resolve(tempo: WorldTempo, axis: TempoAxis): number {
    return tempo.overrides?.[axis] ?? tempo.global;
  }

  static applyDuration(
    absolute: number,
    tempo: WorldTempo,
    axis: TempoDurationAxis,
  ): number {
    return absolute * TempoService.resolve(tempo, axis);
  }

  static applyRate(
    absolute: number,
    tempo: WorldTempo,
    axis: TempoRateAxis,
  ): number {
    return absolute / TempoService.resolve(tempo, axis);
  }

  static deriveProfile(tempo: WorldTempo): WorldTempoProfile {
    return tempo.global === 1 ? 'standard' : 'custom';
  }
}
