import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '@/services/types'
import type {
  Logo,
  OutputRecentLogos,
  UploadLogoParams,
  OutputUploadLogo
} from '../../services/logos/types'

export const useLogosStore = defineStore('logosStore', () => {
  // State
  const logos = ref<Logo[] | null>(null) // Deprecated: kept for backward compat; main source is customization.custom_logos
  const recentLogos = ref<Logo[] | null>(null)

  const isLoadingRecentLogos = ref(false)
  const isLoadingUploadLogo = ref(false)
  const error = ref<string | null>(null)

  // Actions
  function setRecentLogos(data: Logo[]) {
    recentLogos.value = data
  }

  function setLoadingRecentLogos(loading: boolean) {
    isLoadingRecentLogos.value = loading
  }

  function setLoadingUploadLogo(loading: boolean) {
    isLoadingUploadLogo.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  // API Functions
  async function fetchRecentLogos(): Promise<APIResponse<OutputRecentLogos>> {
    setLoadingRecentLogos(true)
    setError(null)
    const response = await tryCatchApi(API.logos.getRecentLogos())
    if (response.success) {
      setRecentLogos(response.content.data)
    } else {
      setError('Error getting recent logos')
    }
    setLoadingRecentLogos(false)
    return response
  }

  async function uploadLogo(
    uploadLogoParams: UploadLogoParams
  ): Promise<APIResponse<OutputUploadLogo>> {
    setLoadingUploadLogo(true)
    setError(null)
    const response = await tryCatchApi(API.logos.uploadLogo(uploadLogoParams))
    if (response.success) {
      setLoadingUploadLogo(false)
      const created = response.content?.result?.customer_logo
      if (created) {
        if (!recentLogos.value) recentLogos.value = []
        if (!logos.value) logos.value = []
        recentLogos.value.push(created)
        logos.value.push(created)
      }
    } else {
      setLoadingUploadLogo(false)
      setError('Error uploading logo')
    }

    return response
  }

  async function deleteRecentLogo(logoId: string): Promise<APIResponse<void>> {
    setError(null)

    // Store the original logo for rollback if needed
    const originalLogos = recentLogos.value ? [...recentLogos.value] : []

    // Optimistically remove the logo from state
    setRecentLogos(
      recentLogos.value?.filter(logo => logo.id.toString() !== logoId) || []
    )

    const response = await tryCatchApi(API.logos.deleteRecentLogo(logoId))
    if (!response.success) {
      // Rollback - restore the original state
      setRecentLogos(originalLogos)
      setError('Error deleting logo')
    }

    return response
  }

  return {
    // State
    logos,
    recentLogos,
    isLoadingRecentLogos,
    isLoadingUploadLogo,
    error,

    // Actions
    setRecentLogos,

    // API Functions
    fetchRecentLogos,
    uploadLogo,
    deleteRecentLogo
  }
})
