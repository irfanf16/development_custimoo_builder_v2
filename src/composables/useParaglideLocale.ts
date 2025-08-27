import { useLocaleStore } from '@/stores/locale'

export function useParaglideLocale() {
  const localeStore = useLocaleStore()

  // Initialize locale on first use
  if (!localeStore.isInitialized) {
    localeStore.initializeLocale()
  }

  return {
    currentLocale: localeStore.currentLocale,
    changeLocale: localeStore.setCurrentLocale,
    availableLocales: localeStore.availableLocales,
    isValidLocale: localeStore.isValidLocale,
    resetToDefault: localeStore.resetToDefault
  }
}
