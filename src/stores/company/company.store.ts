import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  type Company,
  type OutputSettings,
  type OutputSettingsResponse
} from '@/services/company/types'
import { API } from '../../services'
import { tryCatchApi } from '../utils'
import type { APIResponse } from '@/services/types'

// Language configuration types
export interface LanguageConfig {
  code: string
  name: string
  flag?: string
}

export interface DateTimeConfig {
  locale: string
  timeZone: string
  dateFormat: string
  timeFormat: string
}

export interface CurrencyConfig {
  code: string
  symbol: string
  position: 'before' | 'after'
  decimalPlaces: number
}

export interface CompanyLocalization {
  availableLanguages: LanguageConfig[]
  defaultLanguage: string
  datetime: DateTimeConfig
  currency: CurrencyConfig
}

export const useCompanyStore = defineStore('companyStore', () => {
  // State
  const company = ref<Company | null>(null)
  const settings = ref<OutputSettings | null>(null)
  const localization = ref<CompanyLocalization>({
    availableLanguages: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'da', name: 'Dansk', flag: '🇩🇰' }
    ],
    defaultLanguage: 'en',
    datetime: {
      locale: 'en-US',
      timeZone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: 'HH:mm'
    },
    currency: {
      code: 'USD',
      symbol: '$',
      position: 'before',
      decimalPlaces: 2
    }
  })
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

  // Consolidated reset function
  function reset() {
    company.value = null
    settings.value = null
    isLoading.value = false
    error.value = null
  }

  // API Functions
  async function fetchCompany(): Promise<APIResponse<{ company: Company }>> {
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

  async function fetchSettings(): Promise<APIResponse<OutputSettingsResponse>> {
    setLoading(true)
    setError(null)
    const output = await tryCatchApi(API.company.getSettings())
    if (output.success) {
      setSettings(output.content.result)
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
    localization,
    isLoading,
    error,

    // Actions
    setCompany,
    setSettings,
    setLoading,
    setError,
    reset,

    // API Functions
    fetchCompany,
    fetchSettings
  }
})
