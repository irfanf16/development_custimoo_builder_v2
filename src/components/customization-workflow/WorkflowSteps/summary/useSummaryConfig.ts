import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { summary_title, summary_description, summary_tooltip } from '../../../../paraglide/messages'
import { useProfileStore } from '@/stores/profile/profile.store'

export function useSummaryConfig() {
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    return {
      breadcrumbs: [{ label: summary_title({}, { locale: locale.value }) }],
      helpText: {
        label: summary_description({}, { locale: locale.value }),
        tooltip: summary_tooltip({}, { locale: locale.value })
      }
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
