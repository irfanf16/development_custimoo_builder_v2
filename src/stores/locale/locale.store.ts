import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { setLocale } from '@/paraglide/runtime'
import { useCompanyStore } from '@/stores/company/company.store'

export type ParaglideLocale = 'en' | 'fr' | 'da'

export const useLocaleStore = defineStore('localeStore', () => {
  // ===== DEPENDENCIES =====
  const companyStore = useCompanyStore()

  // ===== STATE =====
  const currentLocale = ref<ParaglideLocale>('en')
  const isInitialized = ref(false)

  // ===== COMPUTED =====
  const availableLocales = computed(() =>
    companyStore.localization.availableLanguages.map(lang => lang.code as ParaglideLocale)
  )

  const defaultLocale = computed<ParaglideLocale>(() => {
    const dl = companyStore.localization.defaultLanguage as ParaglideLocale | undefined
    return dl ?? 'en'
  })

  // ===== PERSISTENCE =====
  function saveToLocalStorage() {
    if (typeof window === 'undefined') return
    localStorage.setItem('customizer_locale', currentLocale.value)
  }

  function loadFromLocalStorage(): ParaglideLocale | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('customizer_locale') as ParaglideLocale | null
  }

  // ===== ACTIONS =====
  async function setCurrentLocale(locale: ParaglideLocale) {
    // Validate the locale is still available
    if (!isValidLocale(locale)) {
      console.warn(`Locale ${String(locale)} is no longer available, falling back to default`)
      locale = defaultLocale.value || 'en'
    }

    // Update state
    currentLocale.value = locale

    // Update Paraglide runtime
    await setLocale(locale, { reload: false })

    // Persist to localStorage
    saveToLocalStorage()

    // Update company store to keep in sync
    companyStore.localization.defaultLanguage = locale
  }

  function resetToDefault() {
    const locale = defaultLocale.value || 'en'
    void setCurrentLocale(locale)
  }

  // ===== BUSINESS LOGIC =====
  function initializeLocale() {
    if (isInitialized.value) return

    // If there's only one available language, automatically use it
    if (availableLocales.value.length === 1) {
      const singleLocale = availableLocales.value[0]
      if (singleLocale) {
        void setCurrentLocale(singleLocale)
        isInitialized.value = true
        return
      }
    }

    // Try to restore from localStorage
    const savedLocale = loadFromLocalStorage()

    if (savedLocale && isValidLocale(savedLocale)) {
      void setCurrentLocale(savedLocale)
    } else {
      // Use company default or fallback to 'en'
      const locale = defaultLocale.value || 'en'
      void setCurrentLocale(locale)
    }

    isInitialized.value = true
  }

  function isValidLocale(locale: string): locale is ParaglideLocale {
    return availableLocales.value.includes(locale as ParaglideLocale)
  }

  // Watch for changes in available languages
  watch(availableLocales, newLocales => {
    // If there's only one language available, automatically use it
    if (newLocales.length === 1) {
      const singleLocale = newLocales[0]
      if (singleLocale) {
        void setCurrentLocale(singleLocale)
        return
      }
    }

    // If current locale is no longer available, reset to default
    if (newLocales.length > 0 && !isValidLocale(currentLocale.value)) {
      console.warn('Current locale is no longer available, resetting to default')
      resetToDefault()
    }
  })

  // ===== RETURN =====
  return {
    // State
    currentLocale: computed(() => currentLocale.value),
    isInitialized: computed(() => isInitialized.value),
    // Computed
    availableLocales,
    defaultLocale,
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    // Actions
    setCurrentLocale,
    resetToDefault,
    // Business Logic
    initializeLocale,
    isValidLocale
  }
})
