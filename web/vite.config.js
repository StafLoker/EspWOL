import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { mockApi } from './mock-api.js'

export default defineConfig({
  plugins: [viteSingleFile(), mockApi()],
  build: {
    target: 'es2019',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
  },
})
