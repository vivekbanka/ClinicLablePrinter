import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'vCare Services Lab',
        short_name: 'vCare Lab',
        description: 'Driver license scanner and blood draw specimen label printer',
        theme_color: '#0072ff',
        background_color: '#0a1628',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],

  server: {
    // Allow requests from your ngrok tunnel
    allowedHosts: [
      'kendrick-bastioned-nellie.ngrok-free.dev',
      'localhost',
      '127.0.0.1',
    ],
    // Also allow all ngrok subdomains as a catch-all (optional)
    // allowedHosts: 'all',

    port: 5173,
    strictPort: false,

    cors: true,

    // If running behind ngrok, trust the proxy headers
    proxy: {},
  },

  preview: {
    allowedHosts: [
      'kendrick-bastioned-nellie.ngrok-free.dev',
      'localhost',
    ],
    port: 4173,
  },
});