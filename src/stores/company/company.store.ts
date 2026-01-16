import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type Company,
  type OutputSettings,
  type OutputSettingsResponse
} from '@/services/company/types'
import { API } from '../../services'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import type { APIResponse } from '@/services/types'

// ---------------- Language configuration types ----------------
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

// ---------------- Backend response localization type ----------------
interface BackendLocalization {
  available_languages: { name: string; short_code: string }[]
  default_language: { name: string; short_code: string }
}

// Helper to check if an object has localization data
function hasLocalization(
  content: unknown
): content is { result: { localization: BackendLocalization } } {
  if (typeof content !== 'object' || content === null || !('result' in content)) {
    return false
  }

  const resultValue = (content as Record<string, unknown>).result
  if (typeof resultValue !== 'object' || resultValue === null || !('localization' in resultValue)) {
    return false
  }

  const localizationValue = (resultValue as Record<string, unknown>).localization
  return typeof localizationValue === 'object' && localizationValue !== null
}

// ---------------- Helper function ----------------
function getFlag(code: string): string {
  const flags: Record<string, string> = {
    en: '🇺🇸',
    fr: '🇫🇷',
    da: '🇩🇰',
    de: '🇩🇪',
    es: '🇪🇸'
  }
  return flags[code] || '🝳︝'
}

// Default languages when no company settings are available
const DEFAULT_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', flag: getFlag('en') },
  { code: 'fr', name: 'French', flag: getFlag('fr') }
]

// ---------------- Pinia Store ----------------
export const useCompanyStore = defineStore('companyStore', () => {
  // ===== DEPENDENCIES =====
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'companyStore' } })

  // ===== STATE =====
  const company = ref<Company | null>(null)
  const settings = ref<OutputSettings | null>(null)
  const localization = ref<CompanyLocalization>({
    availableLanguages: DEFAULT_LANGUAGES, // Default to en and fr
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

  // ---------------- Computed Properties ----------------
  /**
   * Check if the company is using an ecommerce platform (shopify, wordpress, or bigcommerce)
   */
  const isEcommercePlatform = computed(() => {
    const platform = company.value?.platform
    if (!platform) return false
    return ['shopify', 'wordpress', 'bigcommerce'].includes(platform.toLowerCase())
  })

  /**
   * Check if the company is using Shopify
   */
  const isShopify = computed(() => {
    return company.value?.platform?.toLowerCase() === 'shopify'
  })

  /**
   * Check if the company is using WooCommerce (WordPress)
   */
  const isWoocommerce = computed(() => {
    return company.value?.platform?.toLowerCase() === 'wordpress'
  })

  // ---------------- Actions ----------------
  function setCompany(data: Company) {
    company.value = data
  }

  function setSettings(data: OutputSettings) {
    settings.value = data
  }

  function setLocalization(data: BackendLocalization) {
    const mappedLocalization: CompanyLocalization = {
      availableLanguages: data.available_languages.map(lang => ({
        code: lang.short_code,
        name: lang.name,
        flag: getFlag(lang.short_code)
      })),
      defaultLanguage: data.default_language?.short_code || 'en',
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
    }

    localization.value = mappedLocalization
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
  }

  function reset() {
    company.value = null
    settings.value = null
    isLoading.value = false
    error.value = null
  }

  // ---------------- API Functions ----------------
  async function fetchCompany(): Promise<APIResponse<{ company: Company }>> {
    setLoading(true)
    setError(null)
    const response = await tryCatchApi(API.company.getCompany(), {
      operation: 'fetchCompany'
    })
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
    const output = await tryCatchApi(API.company.getSettings(), {
      operation: 'fetchSettings'
    })

    if (output.success) {
      setSettings(output.content.result)

      if (hasLocalization(output.content)) {
        setLocalization(output.content.result.localization)
      } else {
        // If no localization data from API, set default languages
        localization.value = {
          ...localization.value,
          availableLanguages: DEFAULT_LANGUAGES,
          defaultLanguage: 'en'
        }
      }
    } else {
      setError('Error getting settings')
      // If settings fetch fails, set default languages
      localization.value = {
        ...localization.value,
        availableLanguages: DEFAULT_LANGUAGES,
        defaultLanguage: 'en'
      }
    }

    setLoading(false)
    return output
  }

  return {
    company,
    settings,
    localization,
    isLoading,
    error,
    // Ecommerce platform checks
    isEcommercePlatform,
    isShopify,
    isWoocommerce,
    // Actions
    setCompany,
    setSettings,
    setLocalization,
    setLoading,
    setError,
    reset,
    fetchCompany,
    fetchSettings
  }
})
