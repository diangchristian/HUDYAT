import { fileURLToPath } from "node:url";
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

const srcPath = fileURLToPath(new URL('./src', import.meta.url));

// Camera + recognition need a secure context; plain http only counts as
// secure on localhost. `npm run dev:https` serves a self-signed cert so
// phones/other PCs on the LAN can use the camera.
// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === 'https' ? [basicSsl()] : []),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'sounds/correct.mp3', 'sounds/wrong.mp3'],
      manifest: {
        name: 'HUDYAT - FSL Learning',
        short_name: 'HUDYAT',
        description: 'Learn Filipino Sign Language through interactive lessons, practice, and assessments.',
        theme_color: '#FFC145',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,woff2}'],
        globIgnores: ['**/models/**','**/mediapipe/**'],
        runtimeCaching: [
          {urlPattern: ({url})=>url.pathname.includes('/mediapipe/wasm/'),handler:'CacheFirst',options:{cacheName:'hudyat-mediapipe-runtime-v1',cacheableResponse:{statuses:[200]}}},
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': srcPath,
    },
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": {
      target: "http://localhost:5001",
      changeOrigin: true,
      secure: false,
    },
    }
  },
}))
