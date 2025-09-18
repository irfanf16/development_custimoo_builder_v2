import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '@/services/types'
import type { Logo, OutputRecentLogos } from '../../services/logos/types'

export const useLogosStore = defineStore('logosStore', () => {
  // State
  const recentLogos = ref<Logo[] | null>(null)

  const isLoadingRecentLogos = ref(false)
  const error = ref<string | null>(null)

  // Actions
  function setRecentLogos(data: Logo[]) {
    recentLogos.value = data
  }

  function setLoading(loading: boolean) {
    isLoadingRecentLogos.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  // API Functions
  async function fetchRecentLogos(): Promise<APIResponse<OutputRecentLogos>> {
    setLoading(true)
    setError(null)
    const response = await tryCatchApi(API.logos.getRecentLogos())
    if (response.success) {
      setRecentLogos(response.content.data)
    } else {
      setError('Error getting recent logos')
    }
    setLoading(false)
    return response
  }

  return {
    // State
    recentLogos,
    isLoadingRecentLogos,
    error,

    // Actions
    setRecentLogos,

    // API Functions
    fetchRecentLogos
  }
})
