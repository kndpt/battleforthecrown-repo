import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedSrc = path.resolve(here, '../packages/shared/src');

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL ?? 'http://localhost:15001',
    ),
    'import.meta.env.VITE_WS_URL': JSON.stringify(
      process.env.VITE_WS_URL ?? 'http://localhost:15001',
    ),
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(here, 'src') },
      { find: /^@battleforthecrown\/shared\/(.*)$/, replacement: `${sharedSrc}/$1` },
      { find: /^@battleforthecrown\/shared$/, replacement: `${sharedSrc}/index.ts` },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
