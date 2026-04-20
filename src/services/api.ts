import axios, {
  type AxiosRequestHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig
} from 'axios'
import { useAuthStore } from '@/stores/auth/auth.store'

type LatestWinsConfig = InternalAxiosRequestConfig & {
  skipLatestWins?: boolean
  __latestWinsKey?: string
  __latestWinsController?: AbortController
}

const inflightByKey = new Map<string, AbortController>()

function normalizedDedupeUri(config: InternalAxiosRequestConfig): string {
  const raw = axios.getUri(config)
  try {
    const u = /:\/\//.test(raw) ? new URL(raw) : new URL(raw, 'http://__dedupe__/')
    const path = u.pathname.replace(/\/+$/, '') || '/'
    return path + u.search
  } catch {
    return raw
  }
}

/** Only for mutating requests where the path is shared but the body identifies the resource. */
function bodyDedupeFingerprint(data: unknown): string {
  if (data == null || data === '') return ''
  if (typeof FormData !== 'undefined' && data instanceof FormData) return '[formdata]'
  let s: string
  try {
    s = typeof data === 'string' ? data : JSON.stringify(data)
  } catch {
    return '[unserializable]'
  }
  return s.length > 4096 ? `${s.slice(0, 4096)}…len=${s.length}` : s
}

function requestKey(config: InternalAxiosRequestConfig): string {
  const method = (config.method ?? 'get').toUpperCase()
  const uri = normalizedDedupeUri(config).replace(/\/\d+/g, '/*')
  const mutates = method === 'POST' || method === 'PUT' || method === 'PATCH'
  const bodyPart = mutates ? `\n${bodyDedupeFingerprint(config.data)}` : ''
  return `${method}:${uri}${bodyPart}`
}

function clearLatestWinsIfCurrent(config: InternalAxiosRequestConfig | undefined): void {
  if (!config) return
  const c = config as LatestWinsConfig
  if (c.__latestWinsKey && inflightByKey.get(c.__latestWinsKey) === c.__latestWinsController) {
    inflightByKey.delete(c.__latestWinsKey)
  }
}

function attachLatestWinsCancellation(config: InternalAxiosRequestConfig): void {
  const c = config as LatestWinsConfig
  if (c.skipLatestWins) return

  const key = requestKey(config)
  inflightByKey.get(key)?.abort()

  const controller = new AbortController()
  inflightByKey.set(key, controller)
  c.__latestWinsKey = key
  c.__latestWinsController = controller

  const userSignal = config.signal
  if (userSignal) {
    if (userSignal.aborted) {
      controller.abort()
    } else {
      userSignal.addEventListener?.('abort', () => controller.abort(), { once: true })
    }
  }
  config.signal = controller.signal
}

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_ENDPOINT}/api/v2`
})

// Request Interceptor: Check token expiration and refresh if needed
instance.interceptors.request.use(
  async config => {
    // set custom subpage url if it is present in the config
    if (config.headers) {
      config.headers['subpageurl'] = window.location.pathname
    }
    // Skip token refresh logic for the refresh token endpoint itself to avoid infinite loop
    const isRefreshTokenEndpoint = config.url?.includes('customer/from/token')
    if (isRefreshTokenEndpoint) {
      return config
    }

    const authStore = useAuthStore()

    let tokenToUse: string | null = authStore.accessToken
    const hasRefreshToken = !!authStore.refreshToken

    const needsRefresh =
      (tokenToUse && authStore.isTokenExpired(tokenToUse)) || (!tokenToUse && hasRefreshToken)

    if (needsRefresh) {
      const refreshed = await authStore.refreshAccessToken()
      tokenToUse = refreshed ? authStore.refreshToken : null
    }

    if (tokenToUse) {
      if (!config.headers) config.headers = {} as AxiosRequestHeaders
      ;(config.headers as Record<string, string>)['CustomerToken'] = tokenToUse
    }

    attachLatestWinsCancellation(config)
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle authentication errors
instance.interceptors.response.use(
  response => {
    clearLatestWinsIfCurrent(response.config)
    return response
  },
  async (error: AxiosError<{ message?: string }>) => {
    // Silently discard requests that were intentionally cancelled by a newer duplicate
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    clearLatestWinsIfCurrent(error.config)

    if (error.config?.skipGlobalAuthErrorHandling) {
      return Promise.reject(error)
    }

    const authStore = useAuthStore()

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      // Handle expired token from server
      if (status === 500 && data && 'message' in data && data.message === 'Expired token') {
        authStore.clearAuth()
        authStore.clearLocalStorage()
        window.location.reload()
        return Promise.reject(error)
      }

      // Handle 401 Unauthorized
      if (status === 401) {
        if (authStore.refreshToken) {
          const refreshed = await authStore.refreshAccessToken()

          if (refreshed && error.config) {
            if (!error.config.headers) error.config.headers = {} as AxiosRequestHeaders
            ;(error.config.headers as Record<string, string>)['CustomerToken'] =
              authStore.accessToken || ''
            return instance.request(error.config)
          }
        }

        authStore.logout()
        return Promise.reject(error)
      }

      // Handle 420 (custom status for logout)
      if (status === 420) {
        authStore.logout()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default instance
