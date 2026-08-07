import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const baseHost = (env.VITE_BASE_HOST || 'http://localhost').replace(/\/$/, '')
  const realtimeHost = (env.VITE_REALTIME_HOST || `${baseHost}:3003`).replace(/\/$/, '')
  const dbHost = (env.VITE_DB_SERVICE_HOST || baseHost).replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/auth': { target: baseHost, changeOrigin: true, secure: false },
        '/database': { target: dbHost, changeOrigin: true, secure: false },
        '/realtime': { target: realtimeHost, changeOrigin: true, secure: false },
        '/socket.io': { target: realtimeHost, changeOrigin: true, secure: false, ws: true },
      },
    },
  }
})
