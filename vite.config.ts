import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['ownly.svg', 'ownly-192.png', 'ownly-512.png'],
      manifest: {
        name: 'Ownly - 我的个人资产',
        short_name: 'Ownly',
        description: '轻松记录、整理和了解你的每一件物品。',
        lang: 'zh-CN',
        theme_color: '#087cff',
        background_color: '#f1f3f8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/ownly-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/ownly-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/ownly-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
