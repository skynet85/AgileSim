// File: frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8081', '/ws': { target: 'http://localhost:8081', ws: true } } },
  build: { outDir: 'dist', sourcemap: false, rollupOptions: { output: { manualChunks: { vendor: ['react','react-dom'] } } } }
})