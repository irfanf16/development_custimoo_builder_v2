import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { buildColorsBreadcrumbs } from '@/components/customization-workflow/breadcrumbs'

export function useColorsConfig() {
  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    return {
      breadcrumbs: buildColorsBreadcrumbs(),
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
