import { describe, expect, it, vi } from 'vitest';
import { publicKingdomPowerQueryOptions, queryKeys } from './queries';

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('@/api', () => ({
  apiClient: { get: mockGet },
  ApiError: class ApiError extends Error {},
}));

describe('publicKingdomPowerQueryOptions', () => {
  const userId = 'user-123';
  const worldId = 'world-456';

  it('sets the correct queryKey', () => {
    const opts = publicKingdomPowerQueryOptions(userId, worldId);
    expect(opts.queryKey).toEqual(queryKeys.publicKingdomPower(userId, worldId));
  });

  it('is enabled when userId is set', () => {
    expect(publicKingdomPowerQueryOptions(userId, worldId).enabled).toBe(true);
  });

  it('is disabled when userId is null', () => {
    expect(publicKingdomPowerQueryOptions(null, worldId).enabled).toBe(false);
  });

  it('uses staleTime of 30 000 ms', () => {
    expect(publicKingdomPowerQueryOptions(userId, worldId).staleTime).toBe(30_000);
  });

  it('calls apiClient.get with skipAuth and worldId query param', async () => {
    mockGet.mockResolvedValueOnce({ userId, kingdomPower: 42 });
    const { queryFn } = publicKingdomPowerQueryOptions(userId, worldId);
    await (queryFn as () => Promise<unknown>)();
    expect(mockGet).toHaveBeenCalledWith(`/power/kingdom/${userId}/public`, {
      query: { worldId },
      skipAuth: true,
    });
  });

  it('returns a parsed PublicKingdomPowerDto for a valid payload', async () => {
    mockGet.mockResolvedValueOnce({ userId, kingdomPower: 99 });
    const { queryFn } = publicKingdomPowerQueryOptions(userId, worldId);
    const result = await (queryFn as () => Promise<unknown>)();
    expect(result).toEqual({ userId, kingdomPower: 99 });
  });

  it('rejects when the server returns an invalid payload (missing kingdomPower)', async () => {
    mockGet.mockResolvedValueOnce({ userId });
    const { queryFn } = publicKingdomPowerQueryOptions(userId, worldId);
    await expect((queryFn as () => Promise<unknown>)()).rejects.toThrow();
  });

  it('rejects immediately when userId is null without calling apiClient', async () => {
    mockGet.mockClear();
    const { queryFn } = publicKingdomPowerQueryOptions(null, worldId);
    await expect((queryFn as () => Promise<unknown>)()).rejects.toThrow('userId required');
    expect(mockGet).not.toHaveBeenCalled();
  });
});
