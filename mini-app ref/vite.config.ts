import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    /** Default bind can be IPv6-only (::1); browsers often use 127.0.0.1 for localhost. */
    host: '127.0.0.1',
    /** If 5173 is taken, fail loudly instead of silently using 5174/5175… */
    strictPort: true,
    /** Same-origin `/api` in dev (see src/api/apiBase.ts); avoids CORS when the page is 127.0.0.1 and the API URL would be localhost. */
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
