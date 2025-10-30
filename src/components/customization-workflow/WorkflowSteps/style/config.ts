import { computed, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useProductsStore } from '@/stores/products/products.store'

const productsStore = useProductsStore()
export const styleHeaderConfig: Ref<HeaderConfiguration> = computed(() => {
  const title = productsStore.activeProductDetails?.display_name || 'Styles'
  return { breadcrumbs: [{ label: title }] }
})

export const styleFooterConfig: FooterConfiguration = { buttons: [] }

export function createFooterConfig(): FooterConfiguration {
  return { buttons: [] }
}
