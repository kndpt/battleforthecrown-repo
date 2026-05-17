import type { WorldTempo } from './schemas';

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
}
