import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'

export function useColorsConfig() {
  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    return { breadcrumbs: [{ label: 'Color' }] }
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
