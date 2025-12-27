import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      ...(mode === 'development' && {
        allowedHosts: env.VITE_ALLOWED_HOSTS 
          ? env.VITE_ALLOWED_HOSTS.split(',').map(h => h.trim())
          : [
              'app.afeez-dev.local',
              'localhost',
              '.afeez-dev.local',
            ],
      }),
      watch: {
        usePolling: true,
      },
      hmr: {
        host: 'localhost',
        port: 5173,
      },
      // For local dev outside Docker, proxy /api to API Gateway
      proxy: {
        '/api': {
          target: env.VITE_API_GATEWAY_URL || 'http://api-gateway:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
