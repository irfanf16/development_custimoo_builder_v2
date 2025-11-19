import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { buildColorsBreadcrumbs } from '@/components/customization-workflow/breadcrumbs'
import { useProfileStore } from '@/stores/profile/profile.store'
import { colors_help_adjust } from '@/paraglide/messages'

export function useColorsConfig() {
  // ===== DEPENDENCIES =====
  const profileStore = useProfileStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    return {
      breadcrumbs: buildColorsBreadcrumbs(profileStore.currentLocale),
      helpText: { label: colors_help_adjust({}, { locale: profileStore.currentLocale }) }
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
