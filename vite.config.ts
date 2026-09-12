import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readFileSync } from 'node:fs';

// The embedded HTML app uses the same installed dependencies as the React app.
const acuseAssets = {
  '/acuse/vendor/supabase.js': 'node_modules/@supabase/supabase-js/dist/umd/supabase.js',
  '/acuse/vendor/chart.umd.js': 'node_modules/chart.js/dist/chart.umd.js',
  '/acuse/vendor/supabase.LICENSE': 'node_modules/@supabase/supabase-js/LICENSE',
  '/acuse/vendor/chart.LICENSE': 'node_modules/chart.js/LICENSE.md',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'acuse-local-vendor',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const asset = acuseAssets[(req.url || '').split('?')[0] as keyof typeof acuseAssets];
        if (!asset) return next();
        res.setHeader('Content-Type', asset.endsWith('.js') ? 'application/javascript' : 'text/plain');
        res.end(readFileSync(path.resolve(__dirname, asset)));
      });
    },
    generateBundle() {
      for (const [url, file] of Object.entries(acuseAssets)) {
        this.emitFile({ type: 'asset', fileName: url.slice(1), source: readFileSync(path.resolve(__dirname, file)) });
      }
    },
  }],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
