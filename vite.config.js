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
        // Solo 2 archivos reales (los 3 que se guardaron en public/pwa/, sin
        // contar apple-touch-icon que lo lee index.html aparte, no el
        // manifest). No hay un icon-192 aparte — el mismo 512 sirve para las
        // dos entradas, el navegador lo achica solo.
        icons: [
          { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Solo el shell (JS/CSS/HTML) se precachea al instalar — el arte de
        // personajes (characters/nutrition/routines/groups) pesa varios MB
        // en total (algunos PNG superan los 2MB cada uno) y bajarlo todo de
        // una en la instalación sería lento y gastaría datos móviles de
        // arranque. Esas imágenes se cachean solas, bajo demanda, con la
        // regla de abajo la primera vez que la pantalla que las usa se abre.
        globPatterns: ['**/*.{js,css,html}'],
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
          {
            // Arte estático (Vegeta/Goku, íconos) — no cambia una vez
            // publicado, así que una vez visto queda servido desde el
            // dispositivo, más rápido y sin gastar datos de nuevo.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'senkai-images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 días
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
