/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// En desarrollo, PUENTE_PROXY=http://127.0.0.1:4200 manda /puente/* al puente (evita CORS).
// Entonces se usa VITE_PUENTE_URL=/puente. En producción el puente sirve la interfaz (VITE_PUENTE_URL=.).
const puenteProxy = process.env.PUENTE_PROXY

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: puenteProxy
    ? { proxy: { '/puente': { target: puenteProxy, changeOrigin: true, rewrite: (p) => p.replace(/^\/puente/, '') } } }
    : undefined,
  build: { chunkSizeWarningLimit: 1500 }, // markdown + resaltado de código (streamdown/shiki) pesan; se carga lazy en una iteración posterior
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
})
