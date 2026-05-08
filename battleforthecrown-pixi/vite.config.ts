import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sharedSrc = path.resolve(here, '../packages/shared/src');

export default defineConfig({
  plugins: [react()],
  resolve: {
    // On résout le workspace shared vers ses sources TS plutôt que vers le bundle
    // CJS de dist/. Vite/esbuild compile à la volée, et tout ajout d'export y est
    // visible immédiatement — sans cache .vite/deps à invalider.
    alias: [
      { find: '@', replacement: path.resolve(here, 'src') },
      { find: /^@battleforthecrown\/shared\/(.*)$/, replacement: `${sharedSrc}/$1` },
      { find: /^@battleforthecrown\/shared$/, replacement: `${sharedSrc}/index.ts` },
    ],
  },
});
