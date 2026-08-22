import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Los íconos reales viven en public/pwa/ (ver instrucciones aparte) —
      // acá solo se referencian, no se generan.
      includeAssets: ['favicon.svg', 'pwa/apple-touch-icon.png'],
      manifest: {
        name: 'Senkai — Training System',
        short_name: 'Senkai',
        description: 'Rutinas, entrenamiento, nutrición y suplementación en un solo lugar.',
        theme_color: '#E51E3A',
        background_color: '#050505',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea el build (JS/CSS) + todo el arte de personajes que ya
        // vive en public/ (Vegeta/Goku), así las pantallas cargan de una
        // aunque la conexión esté floja.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}'],
        runtimeCaching: [
          {
            // Solo GETs (default de Workbox) — nunca cachea POST/PUT/DELETE,
            // así ninguna escritura (marcas, sets, logs) queda "resuelta"
            // desde caché por error. NetworkFirst: siempre intenta traer el
            // dato real primero: en una app de progreso real, un dato viejo
            // servido como si fuera actual es peor que una carta esperando.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'senkai-api-cache',
              networkTimeoutSeconds: 6,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }, // 1 día, solo para offline de emergencia
            },
          },
        ],
      },
    }),
  ],
})
