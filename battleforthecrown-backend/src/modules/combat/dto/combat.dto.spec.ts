import { attackCommandSchema } from './attack-command.schema';

describe('Combat DTOs', () => {
  describe('attackCommandSchema', () => {
    it('should validate valid attack command', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 10,
        targetY: 20,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
        units: { MILITIA: 50, ARCHER: 30 },
      });
      expect(result.success).toBe(true);
    });

    it('should validate with PLAYER_VILLAGE target', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 10,
        targetY: 20,
        targetKind: 'PLAYER_VILLAGE',
        targetRefId: 'village-2',
        units: { MILITIA: 50 },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid target kind', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 10,
        targetY: 20,
        targetKind: 'INVALID_TARGET',
        targetRefId: 'target-1',
        units: { MILITIA: 50 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing units', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 10,
        targetY: 20,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
      });
      expect(result.success).toBe(false);
    });

    it('should reject unknown unit types', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 10,
        targetY: 20,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
        units: { CALAVRY: 50 },
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer coordinates', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 10.5,
        targetY: 20.7,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
        units: { MILITIA: 50 },
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty units object', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 10,
        targetY: 20,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
        units: {},
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-string village ID', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 123,
        targetX: 10,
        targetY: 20,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
        units: { MILITIA: 50 },
      });
      expect(result.success).toBe(false);
    });

    it('should handle large unit counts', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 10,
        targetY: 20,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
        units: { MILITIA: 999999, ARCHER: 999999 },
      });
      expect(result.success).toBe(true);
    });

    it('should accept both positive and negative coordinates', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: -100,
        targetY: -50,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
        units: { MILITIA: 50 },
      });
      expect(result.success).toBe(true);
    });

    it('should handle zero coordinates', () => {
      const result = attackCommandSchema.safeParse({
        villageId: 'village-1',
        targetX: 0,
        targetY: 0,
        targetKind: 'BARBARIAN_VILLAGE',
        targetRefId: 'barbarian-1',
        units: { MILITIA: 50 },
      });
      expect(result.success).toBe(true);
    });
  });
});
