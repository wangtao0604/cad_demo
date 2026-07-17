const env = import.meta.env

const apiBaseUrl = (env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const configuredMode = (env.VITE_API_MODE || '').toLowerCase()

export const runtimeConfig = Object.freeze({
  apiMode: configuredMode || (apiBaseUrl ? 'rest' : 'mock'),
  apiBaseUrl,
  apiTimeout: Number(env.VITE_API_TIMEOUT) || 15000,
  apiCredentials: env.VITE_API_CREDENTIALS || 'same-origin',
})

export const isRestMode = runtimeConfig.apiMode === 'rest'
