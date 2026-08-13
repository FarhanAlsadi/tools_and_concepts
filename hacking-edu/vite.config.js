import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone hacking-lessons build: served at the site root ("/") by the
// minimal Flask app in ../webapp. Single entry point (the standalone
// CamelCode-branded mind-games page has been removed).
export default defineConfig({
  plugins: [react({ include: /\.(jsx|js|tsx|ts)$/ })],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
