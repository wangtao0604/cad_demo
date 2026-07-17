import { runtimeConfig } from '../config/runtime'

const TOKEN_KEY = 'cad-demo.access-token'

export class ApiError extends Error {
  constructor(message, { status = 0, code = '', details = null, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

let accessToken = readToken()

export function setAccessToken(token, persist = true) {
  accessToken = token || ''
  if (!persist) return
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage may be disabled; the in-memory token still works for this session.
  }
}

function buildUrl(path, query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${runtimeConfig.apiBaseUrl}${normalizedPath}`
  if (!query) return url

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    const values = Array.isArray(value) ? value : [value]
    values.forEach((item) => params.append(key, String(item)))
  })
  const search = params.toString()
  return search ? `${url}?${search}` : url
}

async function parseResponse(response) {
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return response.json()
  const text = await response.text()
  return text || null
}

export async function request(path, options = {}) {
  const {
    method = 'GET', query, body, headers = {}, timeout = runtimeConfig.apiTimeout,
    signal, auth = true,
  } = options
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeout)
  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })

  const isFormData = body instanceof FormData
  const requestHeaders = {
    Accept: 'application/json',
    ...(!isFormData && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  }

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : (isFormData ? body : JSON.stringify(body)),
      credentials: runtimeConfig.apiCredentials,
      signal: controller.signal,
    })
    const payload = await parseResponse(response)
    if (!response.ok) {
      throw new ApiError(
        payload?.message || payload?.error || `请求失败（HTTP ${response.status}）`,
        { status: response.status, code: payload?.code, details: payload },
      )
    }
    return payload
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error?.name === 'AbortError') {
      throw new ApiError(signal?.aborted ? '请求已取消' : '请求超时', { code: 'REQUEST_ABORTED', cause: error })
    }
    throw new ApiError(error?.message || '网络请求失败', { code: 'NETWORK_ERROR', cause: error })
  } finally {
    window.clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
