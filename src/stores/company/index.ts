import { defineStore } from 'pinia'
import { ref } from 'vue'
import { type Company, type OutputSettings } from '@/services/company/types'
import { type APIResponse } from '@/services/types'
import { API } from '../../services'
import type { AxiosError } from 'axios'

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
  async function dispatchGetCompany(): Promise<APIResponse<Company>> {
    try {
      setLoading(true)
      clearError()

      const response = await API.company.getCompany()
      const { status, data } = response

      if (status === 200 && data?.company) {
        setCompany(data.company)
        return {
          success: true,
          content: data.company,
          status: 200
        }
      }

      return {
        success: false,
        content: null,
        status: 400
      }
    } catch (err) {
      const _error = err as AxiosError<string>
      const errorMessage =
        _error.response?.data || 'Failed to fetch company data'
      setError(errorMessage)

      return {
        success: false,
        status: _error.response?.status,
        content: null
      }
    } finally {
      setLoading(false)
    }
  }

  async function dispatchGetSettings(): Promise<APIResponse<OutputSettings>> {
    try {
      setLoading(true)
      clearError()

      const response = await API.company.getSettings()
      const { status, data } = response

      if (status === 200 && data) {
        setSettings(data)
        return {
          success: true,
          content: data,
          status: 200
        }
      }

      return {
        success: false,
        content: null,
        status: 400
      }
    } catch (err) {
      const _error = err as AxiosError<string>
      const errorMessage =
        _error.response?.data || 'Failed to fetch settings data'
      setError(errorMessage)

      return {
        success: false,
        status: _error.response?.status,
        content: null
      }
    } finally {
      setLoading(false)
    }
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
