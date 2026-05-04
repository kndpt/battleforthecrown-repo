import { describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, type AuthAdapter } from './client';

function makeAuth(initial: { accessToken?: string; refreshToken?: string } = {}): AuthAdapter {
  let accessToken = initial.accessToken ?? null;
  let refreshToken = initial.refreshToken ?? null;
  return {
    getTokens: () => ({ accessToken, refreshToken }),
    setTokens: (tokens) => {
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    },
    clearTokens: () => {
      accessToken = null;
      refreshToken = null;
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ApiClient', () => {
  it('GETs json with auth header and returns parsed body', async () => {
    const auth = makeAuth({ accessToken: 'A1', refreshToken: 'R1' });
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      expect(url).toBe('http://api.test/world');
      return jsonResponse([{ id: 'w1', name: 'World 1' }]);
    });

    const client = new ApiClient({ baseUrl: 'http://api.test', auth, fetchImpl: fetchImpl as typeof fetch });
    const result = await client.get<Array<{ id: string }>>('/world');

    expect(result).toEqual([{ id: 'w1', name: 'World 1' }]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init).toBeDefined();
    const headers = init!.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer A1');
  });

  it('refreshes the token on 401 and retries the request once', async () => {
    const auth = makeAuth({ accessToken: 'STALE', refreshToken: 'R1' });
    const setSpy = vi.spyOn(auth, 'setTokens');
    const calls: { url: string; auth: string | null }[] = [];
    let meCallCount = 0;

    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers as HeadersInit | undefined);
      calls.push({ url, auth: headers.get('Authorization') });

      if (url.endsWith('/auth/refresh')) {
        return jsonResponse({ accessToken: 'NEW', refreshToken: 'R2' });
      }
      if (url.endsWith('/me')) {
        meCallCount += 1;
        if (meCallCount === 1) {
          return jsonResponse({ message: 'expired' }, 401);
        }
        return jsonResponse({ id: 'u1' });
      }
      return jsonResponse({ message: 'not found' }, 404);
    });

    const client = new ApiClient({ baseUrl: 'http://api.test', auth, fetchImpl: fetchImpl as typeof fetch });
    const result = await client.get<{ id: string }>('/me');

    expect(result).toEqual({ id: 'u1' });
    expect(setSpy).toHaveBeenCalledWith({ accessToken: 'NEW', refreshToken: 'R2' });
    expect(calls).toHaveLength(3);
    expect(calls[0]).toEqual({ url: 'http://api.test/me', auth: 'Bearer STALE' });
    expect(calls[1].url).toBe('http://api.test/auth/refresh');
    expect(calls[2]).toEqual({ url: 'http://api.test/me', auth: 'Bearer NEW' });
  });

  it('clears tokens and throws when refresh fails', async () => {
    const auth = makeAuth({ accessToken: 'STALE', refreshToken: 'R1' });
    const clearSpy = vi.spyOn(auth, 'clearTokens');

    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/refresh')) {
        return jsonResponse({ message: 'invalid' }, 401);
      }
      return jsonResponse({ message: 'expired' }, 401);
    });

    const client = new ApiClient({ baseUrl: 'http://api.test', auth, fetchImpl: fetchImpl as typeof fetch });
    await expect(client.get('/me')).rejects.toBeInstanceOf(ApiError);
    expect(clearSpy).toHaveBeenCalled();
    expect(auth.getTokens()).toEqual({ accessToken: null, refreshToken: null });
  });

  it('serializes body and sets x-world-id from game context', async () => {
    const auth = makeAuth({ accessToken: 'A1', refreshToken: 'R1' });
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ ok: true }),
    );
    const client = new ApiClient({
      baseUrl: 'http://api.test',
      auth,
      gameContext: {
        getWorldId: () => 'world-1',
        getVillageId: () => 'village-1',
      },
      fetchImpl: fetchImpl as typeof fetch,
    });

    await client.post('/village/v1/upgrade', { type: 'WOOD' });
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init).toBeDefined();
    const headers = init!.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('x-world-id')).toBe('world-1');
    expect(headers.get('x-village-id')).toBe('village-1');
    expect(init!.body).toBe(JSON.stringify({ type: 'WOOD' }));
  });
});
