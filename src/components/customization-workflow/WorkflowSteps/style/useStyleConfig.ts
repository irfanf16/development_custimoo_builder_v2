import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useProductsStore } from '@/stores/products/products.store'

export function useStyleConfig() {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    const title = productsStore.activeProductDetails?.display_name || 'Styles'
    return { breadcrumbs: [{ label: title }] }
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
