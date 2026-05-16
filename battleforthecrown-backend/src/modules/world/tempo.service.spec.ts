import { TempoService, type WorldTempo } from '@battleforthecrown/shared/world';

describe('TempoService', () => {
  const standardTempo: WorldTempo = { global: 1 };

  it('keeps reference durations and rates unchanged at global tempo 1', () => {
    expect(
      TempoService.applyDuration(1000, standardTempo, 'constructionSpeed'),
    ).toBe(1000);
    expect(
      TempoService.applyDuration(1000, standardTempo, 'unitTrainingSpeed'),
    ).toBe(1000);
    expect(
      TempoService.applyRate(60, standardTempo, 'resourceProduction'),
    ).toBe(60);
    expect(TempoService.applyRate(10, standardTempo, 'crownsYield')).toBe(10);
  });

  it('makes durations shorter and rates higher when global tempo is below 1', () => {
    const fastTempo: WorldTempo = { global: 0.5 };

    expect(
      TempoService.applyDuration(1000, fastTempo, 'constructionSpeed'),
    ).toBe(500);
    expect(TempoService.applyDuration(1000, fastTempo, 'travelSpeed')).toBe(
      500,
    );
    expect(TempoService.applyRate(60, fastTempo, 'resourceProduction')).toBe(
      120,
    );
    expect(TempoService.applyRate(10, fastTempo, 'barbarianRegen')).toBe(20);
  });

  it('uses an axis override instead of the global tempo only for that axis', () => {
    const mixedTempo: WorldTempo = {
      global: 0.5,
      overrides: {
        captureWindow: 0.25,
        crownsYield: 2,
      },
    };

    expect(TempoService.resolve(mixedTempo, 'travelSpeed')).toBe(0.5);
    expect(TempoService.applyDuration(1000, mixedTempo, 'travelSpeed')).toBe(
      500,
    );
    expect(TempoService.applyDuration(1000, mixedTempo, 'captureWindow')).toBe(
      250,
    );
    expect(TempoService.applyRate(10, mixedTempo, 'barbarianRegen')).toBe(20);
    expect(TempoService.applyRate(10, mixedTempo, 'crownsYield')).toBe(5);
  });
});
