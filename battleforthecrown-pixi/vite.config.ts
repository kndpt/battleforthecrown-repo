import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(here, 'src'),
    },
  },
  optimizeDeps: {
    // The shared workspace package is published as CommonJS. Vite skips workspace
    // packages by default, so named-export imports from it fail at runtime
    // ("does not provide an export named …"). Forcing pre-bundling converts the
    // CJS module into a Vite-friendly ESM proxy.
    include: [
      '@battleforthecrown/shared',
      '@battleforthecrown/shared/logic',
      '@battleforthecrown/shared/village/buildings',
      '@battleforthecrown/shared/army',
    ],
  },
});
