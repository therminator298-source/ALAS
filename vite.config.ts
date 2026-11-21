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
  build: {
    rollupOptions: {
      output: {
        /* Vendors aparte: tocar codigo de la app no invalida su cache, y el
           navegador los baja en paralelo con el chunk de la pantalla. */
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\/]node_modules[\/](react|react-dom|scheduler|react-router|react-router-dom)[\/]/.test(id)) return 'react';
          if (id.includes('node_modules/gsap')) return 'gsap';
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          /* Nada de un chunk "vendor" que junte todo lo demas: ahi caen paquetes
             que importan React (por ejemplo @dnd-kit) mientras react-router, que
             esta en el chunk de React, importa de ese mismo grupo. Los dos chunks
             quedan en ciclo y el que corre primero encuentra React a medias:
             "Cannot read properties of undefined (reading 'useLayoutEffect')" y
             pantalla en blanco. El resto lo reparte Rollup, que respeta el orden. */
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
