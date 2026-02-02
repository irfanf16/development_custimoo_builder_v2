import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useProductsStore } from '@/stores/products/products.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import { styles_title } from '@/paraglide/messages'

export function useStyleConfig() {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const profileStore = useProfileStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    const title =
      productsStore.activeProductDetails?.display_name ||
      styles_title({}, { locale: profileStore.currentLocale })
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
