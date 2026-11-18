import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Mirrors the production rewrites so share links, preview images and the sitemap work in dev.
    proxy: Object.fromEntries(
      ['/s/', '/og/', '/sitemap.xml'].map((p) => [
        p,
        {
          target: process.env.VITE_API_URL || 'https://league-of-coders-backend.onrender.com',
          changeOrigin: true,
          rewrite: (path) => (p === '/s/' ? path.replace(/^\/s\//, '/share/') : path),
        },
      ])
    ),
  },
  build: { outDir: 'build' },
});
