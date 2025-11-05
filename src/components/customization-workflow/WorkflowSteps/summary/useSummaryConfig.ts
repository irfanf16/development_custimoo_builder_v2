import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'

export function useSummaryConfig() {
  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    return { breadcrumbs: [{ label: 'Summary' }] }
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
