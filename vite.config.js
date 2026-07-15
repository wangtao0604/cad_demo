import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const commonJsDeps = [
  'loglevel',
  'dayjs',
  'dayjs/plugin/customParseFormat.js',
  'dayjs/plugin/advancedFormat.js',
  'dayjs/plugin/localeData.js',
  'dayjs/plugin/weekOfYear.js',
  'dayjs/plugin/weekYear.js',
  'dayjs/plugin/dayOfYear.js',
  'dayjs/plugin/isSameOrAfter.js',
  'dayjs/plugin/isSameOrBefore.js',
]
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    include: commonJsDeps,
    exclude: ['@mlightcad/cad-viewer', '@mlightcad/cad-simple-viewer', '@mlightcad/data-model'],
    needsInterop: commonJsDeps,
  },
})

