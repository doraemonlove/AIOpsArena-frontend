import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools()
  ],
  server: {
    proxy: {
      '/agent-api': {
        target: 'http://localhost:8004',
        changeOrigin: true,
        headers: {
          Origin: 'http://localhost:8004'
        },
        rewrite: (path) => path.replace(/^\/agent-api/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  mode: 'development'
})
