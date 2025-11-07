import { useProfileStore } from '@/stores/profile/profile.store'

export function useParaglideLocale() {
  // ===== DEPENDENCIES =====
  const profileStore = useProfileStore()

  // ===== INITIALIZATION =====
  // Initialize locale on first use
  if (!profileStore.isInitialized) {
    void profileStore.initializeLocale()
  }

  // ===== RETURN =====
  return {
    currentLocale: profileStore.currentLocale,
    changeLocale: profileStore.setCurrentLocale,
    availableLocales: profileStore.availableLocales,
    isValidLocale: profileStore.isValidLocale,
    resetToDefault: profileStore.resetToDefault
  }
}
