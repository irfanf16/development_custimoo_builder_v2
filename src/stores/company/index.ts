import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type Company, type OutputSettings } from '@/services/company/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '../types'

export const useCompanyStore = defineStore('companyStore', () => {
  // State
  const company = ref<Company | null>(null)
  const settings = ref<OutputSettings | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  function setCompany(data: Company) {
    company.value = data
  }

  function setSettings(data: OutputSettings) {
    settings.value = data
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function clearCompany() {
    company.value = null
  }

  function clearSettings() {
    settings.value = null
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    company.value = null
    settings.value = null
    isLoading.value = false
    error.value = null
  }

  // API Functions
  async function dispatchGetCompany(): Promise<
    APIResponse<{ company: Company }>
  > {
    setLoading(true)
    setError(null)
    const response = await tryCatchApi(API.company.getCompany())
    if (response.success) {
      setCompany(response.content.company)
    } else {
      setError('Error getting company')
    }
    setLoading(false)
    return response
  }

  async function dispatchGetSettings(): Promise<APIResponse<OutputSettings>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(API.company.getSettings())
    if (output.success) {
      setSettings(output.content)
    } else {
      setError('Error getting settings')
    }
    setLoading(false)
    return output
  }

  return {
    // State
    company,
    settings,
    isLoading,
    error,

    // Actions
    setCompany,
    setSettings,
    setLoading,
    setError,
    clearCompany,
    clearSettings,
    clearError,
    reset,

    // API Functions
    dispatchGetCompany,
    dispatchGetSettings
  }
})
