import { defineConfig } from 'vite'

export default defineConfig({
  appType: 'mpa', // disable history fallback,
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin', // allow sub ms performance.now()
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
