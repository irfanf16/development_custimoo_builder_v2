import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '../../services'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import type { APIResponse } from '@/services/types'
import type {
  CustomLogo,
  OutputRecentLogos,
  UploadLogoParams,
  OutputUploadLogo,
  OutputUpdateAndPostNewLogo,
  UpdateLogoParams,
  OutputUpdateLogo
} from '../../services/logos/types'

export const useLogosStore = defineStore('logosStore', () => {
  // ===== DEPENDENCIES =====
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'logosStore' } })

  // ===== STATE =====
  const logos = ref<CustomLogo[] | null>(null) // Deprecated: kept for backward compat; main source is customization.custom_logos
  const recentLogos = ref<CustomLogo[] | null>(null)
  const activeLogo = ref<CustomLogo | null>(null)

  const isLoadingRecentLogos = ref(false)
  const isLoadingUploadLogo = ref(false)
  const error = ref<string | null>(null)

  // Actions
  function setRecentLogos(data: CustomLogo[]) {
    recentLogos.value = data
  }

  function addRecentLogo(logo: CustomLogo) {
    if (!recentLogos.value) recentLogos.value = []
    recentLogos.value.unshift(logo)
  }

  function removeRecentLogo(logoId: number) {
    if (!recentLogos.value) recentLogos.value = []
    recentLogos.value = recentLogos.value?.filter(logo => logo.id !== logoId)
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

  function setActiveLogo(logo: CustomLogo | null) {
    activeLogo.value = logo
  }

  // API Functions
  async function fetchRecentLogos(): Promise<APIResponse<OutputRecentLogos>> {
    setLoadingRecentLogos(true)
    setError(null)
    const response = await tryCatchApi(API.logos.getRecentLogos(), {
      operation: 'fetchRecentLogos'
    })
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
    const response = await tryCatchApi(API.logos.uploadLogo(uploadLogoParams), {
      operation: 'uploadLogo'
    })
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
    removeRecentLogo(Number(logoId))

    const response = await tryCatchApi(API.logos.deleteRecentLogo(logoId), {
      operation: 'deleteRecentLogo',
      logo_id: logoId
    })
    if (!response.success) {
      // Rollback - restore the original state
      setRecentLogos(originalLogos)
      setError('Error deleting logo')
    }

    return response
  }

  async function updateAndPostNewLogo(
    customLogo: CustomLogo
  ): Promise<APIResponse<OutputUpdateAndPostNewLogo>> {
    setError(null)

    // Store the original logo for rollback if needed
    const originalRecentLogos = recentLogos.value ? [...recentLogos.value] : []

    const updateAndPostNewLogoParams = {
      logo_id: customLogo.id,
      logo: customLogo.url,
      product_id: customLogo.product_id
    }
    const response = await tryCatchApi(API.logos.updateAndPostNewLogo(updateAndPostNewLogoParams), {
      operation: 'updateAndPostNewLogo',
      logo_id: customLogo.id
    })
    if (response.success) {
      // Add the logo to the active logo state
      const newLogo = { ...customLogo, ...response.content?.customer_logo }
      setActiveLogo(newLogo)
      // Add the logo to the logos state
      if (!logos.value) logos.value = []
      logos.value.push(customLogo)
      // Add the logo to the recent logos state
      // addRecentLogo(newLogo)
    } else {
      // Rollback - restore the original state of recent logos
      setRecentLogos(originalRecentLogos)
      setError('Error updating and posting new logo')
    }
    return response
  }

  async function editLogo(
    editLogoParams: UpdateLogoParams
  ): Promise<APIResponse<OutputUpdateLogo>> {
    setError(null)
    const response = await tryCatchApi(API.logos.editLogo(editLogoParams), {
      operation: 'editLogo'
    })
    if (response.success) {
      setError('Error editing logo')
    }
    return response
  }

  return {
    // State
    logos,
    recentLogos,
    activeLogo,
    isLoadingRecentLogos,
    isLoadingUploadLogo,
    error,

    // Actions
    setRecentLogos,
    setActiveLogo,
    addRecentLogo,
    removeRecentLogo,
    // API Functions
    fetchRecentLogos,
    uploadLogo,
    deleteRecentLogo,
    updateAndPostNewLogo,
    editLogo
  }
})
