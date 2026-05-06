import { env } from '@/lib/env';
import type { AuthTokens } from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface AuthAdapter {
  getTokens: () => AuthState;
  setTokens: (tokens: AuthTokens) => void;
  clearTokens: () => void;
}

export interface GameContextAdapter {
  getWorldId: () => string | null;
  getVillageId: () => string | null;
}

export interface ApiClientOptions {
  baseUrl: string;
  auth: AuthAdapter;
  gameContext?: GameContextAdapter;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  skipAuth?: boolean;
}

const REFRESH_PATH = '/auth/refresh';

export class ApiClient {
  private readonly baseUrl: string;
  private readonly auth: AuthAdapter;
  private readonly gameContext?: GameContextAdapter;
  private readonly fetchImpl: typeof fetch;
  private refreshInflight: Promise<AuthTokens | null> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.auth = options.auth;
    this.gameContext = options.gameContext;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.send(path, options);

    if (response.status === 401 && !options.skipAuth) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        const retry = await this.send(path, options);
        return this.parse<T>(retry);
      }
    }

    return this.parse<T>(response);
  }

  get<T>(path: string, options: Omit<RequestOptions, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  delete<T>(path: string, options: Omit<RequestOptions, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  private async send(path: string, options: RequestOptions): Promise<Response> {
    const url = this.buildUrl(path, options.query);
    const headers = this.buildHeaders(options);

    const init: RequestInit = {
      method: options.method ?? 'GET',
      headers,
      signal: options.signal,
      credentials: options.credentials,
      cache: options.cache,
      mode: options.mode,
      redirect: options.redirect,
    };

    if (options.body !== undefined) {
      init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    return this.fetchImpl(url, init);
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${fullPath}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private buildHeaders(options: RequestOptions): Headers {
    const headers = new Headers(options.headers);
    if (options.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (!options.skipAuth) {
      const { accessToken } = this.auth.getTokens();
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      if (this.gameContext) {
        const worldId = this.gameContext.getWorldId();
        const villageId = this.gameContext.getVillageId();
        if (worldId) headers.set('x-world-id', worldId);
        if (villageId) headers.set('x-village-id', villageId);
      }
    }
    return headers;
  }

  private async parse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const { message, data } = await readError(response);
      throw new ApiError(message ?? response.statusText, response.status, data);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  private async tryRefresh(): Promise<AuthTokens | null> {
    if (this.refreshInflight) {
      return this.refreshInflight;
    }
    const { refreshToken } = this.auth.getTokens();
    if (!refreshToken) {
      this.auth.clearTokens();
      return null;
    }

    const inflight = (async (): Promise<AuthTokens | null> => {
      try {
        const url = this.buildUrl(REFRESH_PATH);
        const response = await this.fetchImpl(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) {
          this.auth.clearTokens();
          return null;
        }
        const tokens = (await response.json()) as AuthTokens;
        this.auth.setTokens(tokens);
        return tokens;
      } catch {
        this.auth.clearTokens();
        return null;
      }
    })();

    this.refreshInflight = inflight;
    try {
      return await inflight;
    } finally {
      this.refreshInflight = null;
    }
  }
}

async function readError(response: Response): Promise<{ message?: string; data?: unknown }> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    return {};
  }
  try {
    const payload = (await response.json()) as { message?: string };
    return { message: payload.message, data: payload };
  } catch {
    return {};
  }
}

export function createApiClient(options: Omit<ApiClientOptions, 'baseUrl'> & { baseUrl?: string }): ApiClient {
  return new ApiClient({ baseUrl: options.baseUrl ?? env.apiBaseUrl, ...options });
}
