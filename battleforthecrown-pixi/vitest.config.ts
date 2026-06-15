import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedSrc = path.resolve(here, '../packages/shared/src');

export default defineConfig({
  plugins: [react()],
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
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '../packages/shared/src/**/*.spec.ts',
    ],
  },
});
