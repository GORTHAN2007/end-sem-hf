import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/iss-now': {
        target: 'http://api.open-notify.org/iss-now.json',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/iss-now/, '')
      },
      '/api/astros': {
        target: 'http://api.open-notify.org/astros.json',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/astros/, '')
      }
    }
  }
})
