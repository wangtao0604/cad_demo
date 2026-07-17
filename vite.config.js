import { defineConfig, loadEnv } from 'vite'
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET

  return {
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
      proxy: proxyTarget ? {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      } : undefined,
    },
    optimizeDeps: {
      include: commonJsDeps,
      exclude: ['@mlightcad/cad-viewer', '@mlightcad/cad-simple-viewer', '@mlightcad/data-model'],
      needsInterop: commonJsDeps,
    },
  }
})

