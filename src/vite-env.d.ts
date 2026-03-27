/// <reference types="vite/client" />

// Required so `declare module 'axios'` merges with axios instead of replacing it (which breaks all axios exports).
import type {} from 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** When true, api response interceptor skips reload/logout/retry (token exchange handles errors locally) */
    skipGlobalAuthErrorHandling?: boolean
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // Props/State are unknown at type level; avoid `{}` and `any` for safety
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
