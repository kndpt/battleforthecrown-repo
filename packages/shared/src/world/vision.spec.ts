import { describe, expect, it } from 'vitest';
import { isPointInAnyVisionDisk, type VisionDisk } from './vision';

describe('isPointInAnyVisionDisk', () => {
  const disk: VisionDisk = { x: 10, y: 10, radius: 5 };

  it('point au centre du disque → true', () => {
    expect(isPointInAnyVisionDisk({ x: 10, y: 10 }, [disk])).toBe(true);
  });

  it('point strictement à l’intérieur → true', () => {
    expect(isPointInAnyVisionDisk({ x: 12, y: 13 }, [disk])).toBe(true);
  });

  it('point strictement à l’extérieur → false', () => {
    // distance² = 5² + 5² = 50 > 25
    expect(isPointInAnyVisionDisk({ x: 15, y: 15 }, [disk])).toBe(false);
  });

  it('point pile sur le bord (dx²+dy² == radius²) → true (borne incluse)', () => {
    // (13,14) → dx=3, dy=4 → 9+16=25 == 5²
    expect(isPointInAnyVisionDisk({ x: 13, y: 14 }, [disk])).toBe(true);
  });

  it('point juste au-delà du bord → false', () => {
    // dx=3, dy=4 mais radius 4.99 → 25 > 24.9001
    expect(
      isPointInAnyVisionDisk({ x: 13, y: 14 }, [{ x: 10, y: 10, radius: 4.99 }]),
    ).toBe(false);
  });

  it('liste de disques vide → false', () => {
    expect(isPointInAnyVisionDisk({ x: 0, y: 0 }, [])).toBe(false);
  });

  it('couvert uniquement par le second disque → true', () => {
    const disks: VisionDisk[] = [
      { x: 0, y: 0, radius: 1 },
      { x: 100, y: 100, radius: 10 },
    ];
    expect(isPointInAnyVisionDisk({ x: 100, y: 100 }, disks)).toBe(true);
  });

  it('hors de tous les disques d’une liste multiple → false', () => {
    const disks: VisionDisk[] = [
      { x: 0, y: 0, radius: 1 },
      { x: 100, y: 100, radius: 10 },
    ];
    expect(isPointInAnyVisionDisk({ x: 50, y: 50 }, disks)).toBe(false);
  });

  it('rayon 0 : seul le centre exact est couvert', () => {
    const point: VisionDisk = { x: 7, y: 7, radius: 0 };
    expect(isPointInAnyVisionDisk({ x: 7, y: 7 }, [point])).toBe(true);
    expect(isPointInAnyVisionDisk({ x: 7, y: 8 }, [point])).toBe(false);
  });

  it('gère les coordonnées négatives', () => {
    const negDisk: VisionDisk = { x: -10, y: -10, radius: 3 };
    expect(isPointInAnyVisionDisk({ x: -11, y: -12 }, [negDisk])).toBe(true);
    expect(isPointInAnyVisionDisk({ x: -5, y: -5 }, [negDisk])).toBe(false);
  });
});
