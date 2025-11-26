import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type AppInfo } from '@/services/app/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '@/services/types'
import {
  CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY,
  getKeyWithSubPageSuffix
} from '@/helpers/subPageUrlHelper'

export const useAppStore = defineStore('appStore', () => {
  const appInfo = ref<AppInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function getAppInfo(): Promise<APIResponse<AppInfo>> {
    setLoading(true)
    setError(null)
    const response = await tryCatchApi(API.app.getAppInfo())
    if (response.success && response.content) {
      setAppInfo(response.content)
      // remove any localStorage items with the key CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY
      Object.keys(localStorage).forEach(key => {
        if (key.endsWith(CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY)) {
          localStorage.removeItem(key)
        }
      })
      if (response.content.is_subpage) {
        localStorage.setItem(
          getKeyWithSubPageSuffix(
            CUSTIMOO_APPLICATION_SUBPAGE_URL_KEY,
            response.content.suppage_url
          ),
          response.content.suppage_url
        )
      }
    } else {
      setError('Error getting app info: ' + response.axiosError?.message)
    }
    setLoading(false)
    return response
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
    getAppInfo,
    setLoading,
    setError
  }
})
