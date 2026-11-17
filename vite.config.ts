import { defineConfig } from 'vite';

export default defineConfig({
  // The engine worker is a classic worker so it can importScripts() the Emscripten loader from public/wiregasm/.
  worker: { format: 'iife' },
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 4000 },
  server: { port: 5207 },
});
