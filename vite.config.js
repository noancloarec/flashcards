import { fileURLToPath, URL } from 'node:url'
import { VitePWA } from 'vite-plugin-pwa'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'icon_180.png'],
      manifest: {
        name: "Flash Cards",
        short_name: "Flash Cards",
        description: "Learn things by heart",
        theme_color: "#ffffff",
        icons : [
          {
            src : "icon_192.png",
            sizes : "192x192",
            type : "image/png",
          },
          {
            src : "icon_512.png",
            sizes : "512x512",
            type : "image/png",
          },
          {
            src : "icon_512.png",
            sizes : "512x512",
            type : "image/png",
            purpose : "any",
          },
          {
            src : "icon_512.png",
            sizes : "512x512",
            type : "image/png",
            purpose : "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      devOptions: {
        enabled: true
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
