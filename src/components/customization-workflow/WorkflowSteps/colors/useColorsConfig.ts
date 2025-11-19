import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { buildColorsBreadcrumbs } from '@/components/customization-workflow/breadcrumbs'
import { useProfileStore } from '@/stores/profile/profile.store'

export function useColorsConfig() {
  // ===== DEPENDENCIES =====
  const profileStore = useProfileStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    return {
      breadcrumbs: buildColorsBreadcrumbs(profileStore.currentLocale),
      helpText: { label: "Adjust your product's colors." }
    }
  })

  const footerConfig = computed<FooterConfiguration>(() => {
    return { buttons: [] }
  })

  // ===== RETURN =====
  return {
    // Computed
    headerConfig,
    footerConfig
  }
}
