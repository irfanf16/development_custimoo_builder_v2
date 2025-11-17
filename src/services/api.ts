import axios, { type AxiosRequestHeaders, type AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth/auth.store'

const instance = axios.create({
  baseURL: `${import.meta.env.VITE_API_ENDPOINT}/api/v2`
})

// Request Interceptor: Check token expiration and refresh if needed
instance.interceptors.request.use(
  async config => {
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
      tokenToUse = refreshed ? authStore.accessToken : null
    }

    if (tokenToUse) {
      if (!config.headers) config.headers = {} as AxiosRequestHeaders
      ;(config.headers as Record<string, string>)['CustomerToken'] = tokenToUse
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle authentication errors
instance.interceptors.response.use(
  response => {
    return response
  },
  async (error: AxiosError<{ message?: string }>) => {
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
