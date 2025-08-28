import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { setLocale } from '@/paraglide/runtime'
import { useCompanyStore } from '@/stores/company'

export type ParaglideLocale = 'en' | 'fr' | 'da'

export const useLocaleStore = defineStore('localeStore', () => {
  // State
  const currentLocale = ref<ParaglideLocale>('en')
  const isInitialized = ref(false)

  // Computed
  const companyStore = useCompanyStore()

  const availableLocales = computed(() =>
    companyStore.localization.availableLanguages.map(
      lang => lang.code as ParaglideLocale
    )
  )

  const defaultLocale = computed(
    () => companyStore.localization.defaultLanguage as ParaglideLocale
  )

  // Actions
  function initializeLocale() {
    if (isInitialized.value) return

    // If there's only one available language, automatically use it
    if (availableLocales.value.length === 1) {
      const singleLocale = availableLocales.value[0]
      console.log(
        `Only one language available (${singleLocale}), automatically applying it`
      )
      setCurrentLocale(singleLocale)
      isInitialized.value = true
      return
    }

    // Try to restore from localStorage
    const savedLocale = localStorage.getItem(
      'customizer_locale'
    ) as ParaglideLocale | null

    if (savedLocale && isValidLocale(savedLocale)) {
      setCurrentLocale(savedLocale)
    } else {
      // Use company default or fallback to 'en'
      const locale = defaultLocale.value || 'en'
      setCurrentLocale(locale)
    }

    isInitialized.value = true
  }

  function setCurrentLocale(locale: ParaglideLocale) {
    // Validate the locale is still available
    if (!isValidLocale(locale)) {
      console.warn(
        `Locale ${locale} is no longer available, falling back to default`
      )
      locale = defaultLocale.value || 'en'
    }

    // Update state
    currentLocale.value = locale

    // Update Paraglide runtime
    setLocale(locale, { reload: false })

    // Persist to localStorage
    localStorage.setItem('customizer_locale', locale)

    // Update company store to keep in sync
    companyStore.localization.defaultLanguage = locale
  }

  function isValidLocale(locale: string): locale is ParaglideLocale {
    return availableLocales.value.includes(locale as ParaglideLocale)
  }

  function resetToDefault() {
    const locale = defaultLocale.value || 'en'
    setCurrentLocale(locale)
  }

  // Watch for changes in available languages
  watch(availableLocales, newLocales => {
    // If there's only one language available, automatically use it
    if (newLocales.length === 1) {
      const singleLocale = newLocales[0]
      console.log(
        `Only one language available (${singleLocale}), automatically applying it`
      )
      setCurrentLocale(singleLocale)
      return
    }

    // If current locale is no longer available, reset to default
    if (newLocales.length > 0 && !isValidLocale(currentLocale.value)) {
      console.warn(
        'Current locale is no longer available, resetting to default'
      )
      resetToDefault()
    }
  })

  return {
    // State
    currentLocale: computed(() => currentLocale.value),
    isInitialized: computed(() => isInitialized.value),

    // Computed
    availableLocales,
    defaultLocale,

    // Actions
    initializeLocale,
    setCurrentLocale,
    isValidLocale,
    resetToDefault
  }
})
