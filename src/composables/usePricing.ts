import { useCompanyStore } from '@/stores/company/company.store'
import type { OutputProductDetails } from '@/services/products/types'
import { useProductsStore } from '@/stores/products/products.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useProfileStore } from '@/stores/profile/profile.store'

export const usePricing = () => {
  const companyStore = useCompanyStore()
  const productsStore = useProductsStore()
  const profileStore = useProfileStore()
  const { activeProductDetails } = storeToRefs(productsStore)
  const locale = computed(() => profileStore.currentLocale || 'en')

  const getProductPrice = (
    product: OutputProductDetails,
    formatted = true,
    includeMinimumOrderQuantity = false
  ) => {
    const price = product.sku?.skucurrency[0]?.pivot.price
    if (typeof price === 'number' && !Number.isNaN(price)) {
      const productPrice =
        price * (includeMinimumOrderQuantity ? (product.sku?.minimum_order_quantity ?? 1) : 1)
      if (formatted) {
        return new Intl.NumberFormat(locale.value, {
          style: 'currency',
          currency:
            product.sku?.skucurrency?.[0]?.code ||
            companyStore.settings?.settings?.currencies?.currenncies?.[0] ||
            'USD'
        }).format(productPrice)
      }
      return productPrice
    }
    return null
  }

  const minimumActiveProductQuantityByDesign = computed(() => {
    return activeProductDetails.value?.sku?.minimum_order_quantity_type === 'by_design' &&
      activeProductDetails.value?.sku?.minimum_order_quantity > 0
      ? activeProductDetails.value?.sku?.minimum_order_quantity
      : 1
  })

  const activeProductPrice = computed(() => {
    const price = activeProductDetails.value?.sku?.skucurrency[0]?.pivot.price
    if (typeof price === 'number' && !Number.isNaN(price)) {
      const productPrice = price * (activeProductDetails.value?.sku?.minimum_order_quantity ?? 1)
      return new Intl.NumberFormat(locale.value, {
        style: 'currency',
        currency:
          activeProductDetails.value?.sku?.skucurrency?.[0]?.code ||
          companyStore.settings?.settings?.currencies?.currenncies?.[0] ||
          'USD'
      }).format(productPrice)
    }
    return null
  })

  const showPricing = computed(() => companyStore.settings?.settings?.currencies?.visible)

  return {
    getProductPrice,
    activeProductPrice,
    minimumActiveProductQuantityByDesign,
    showPricing
  }
}
