import { useLocaleStore } from '@/stores/locale/locale.store'

export function useParaglideLocale() {
  // ===== DEPENDENCIES =====
  const localeStore = useLocaleStore()

  // ===== INITIALIZATION =====
  // Initialize locale on first use
  if (!localeStore.isInitialized) {
    localeStore.initializeLocale()
  }

  // ===== RETURN =====
  return {
    currentLocale: localeStore.currentLocale,
    changeLocale: localeStore.setCurrentLocale,
    availableLocales: localeStore.availableLocales,
    isValidLocale: localeStore.isValidLocale,
    resetToDefault: localeStore.resetToDefault
  }
}
