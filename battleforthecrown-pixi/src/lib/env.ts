const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const wsUrl = import.meta.env.VITE_WS_URL;

if (typeof apiBaseUrl !== 'string' || apiBaseUrl.length === 0) {
  throw new Error('VITE_API_BASE_URL is not defined');
}

if (typeof wsUrl !== 'string' || wsUrl.length === 0) {
  throw new Error('VITE_WS_URL is not defined');
}

export const env = {
  apiBaseUrl,
  wsUrl,
} as const;
