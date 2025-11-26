import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type AppInfo } from '@/stores/app/types'
import {
  CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY,
  getKeyWithSubPageSuffix
} from '@/helpers/subPageUrlHelper'

export const useAppStore = defineStore('appStore', () => {
  const appInfo = ref<AppInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function loadAppInfoFromGlobalVariable() {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const custimoo_app_info = (window as any).custimoo_app_info as AppInfo | undefined
      if (custimoo_app_info) {
        setAppInfo(custimoo_app_info)
        // remove any localStorage items with the key CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY
        Object.keys(localStorage).forEach(key => {
          if (key.endsWith(CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY)) {
            localStorage.removeItem(key)
          }
        })
        if (custimoo_app_info.is_subpage) {
          localStorage.setItem(
            getKeyWithSubPageSuffix(
              CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY,
              custimoo_app_info.suppage_url
            ),
            custimoo_app_info.suppage_url
          )
        }
      }
    }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function setAppInfo(data: AppInfo) {
    appInfo.value = data
  }

  return {
    appInfo,
    isLoading,
    error,
    loadAppInfoFromGlobalVariable,
    setLoading,
    setError
  }
})
