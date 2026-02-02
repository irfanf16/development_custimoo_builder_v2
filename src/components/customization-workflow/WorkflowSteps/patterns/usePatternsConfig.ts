import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'

export function usePatternsConfig() {
  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    return { breadcrumbs: [{ label: 'Pattern' }] }
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
