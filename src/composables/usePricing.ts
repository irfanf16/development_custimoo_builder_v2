import { useCompanyStore } from '@/stores/company/company.store'
import type { OutputProductDetails } from '@/services/products/types'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useProfileStore } from '@/stores/profile/profile.store'

export const usePricing = () => {
  const companyStore = useCompanyStore()
  const productsStore = useProductsStore()
  const profileStore = useProfileStore()
  const customizationStore = useCustomizationStore()
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

  const getMinimumProductQuantityByDesign = (product: OutputProductDetails) => {
    return product.sku?.minimum_order_quantity_type === 'by_design' &&
      product.sku?.minimum_order_quantity > 0
      ? product.sku?.minimum_order_quantity
      : 1
  }

  const minimumActiveProductQuantityByDesign = computed(() => {
    return activeProductDetails.value?.sku?.minimum_order_quantity_type === 'by_design' &&
      activeProductDetails.value?.sku?.minimum_order_quantity > 0
      ? activeProductDetails.value?.sku?.minimum_order_quantity
      : 1
  })

  const getTotalAddonPrice = () => {
    const productId = customizationStore.customization?.product_id
    if (!productId || !activeProductDetails.value) return 0

    const preferredCode = companyStore.localization.currency.code
    const addonIds = customizationStore.customization?.addons_info?.[productId]?.simple_addons || []

    let totalAddonPrice = 0

    for (const addonId of addonIds) {
      // Prefer company_addons
      const companyAddon = activeProductDetails.value?.company_addons?.find(
        a => a.addon_id === addonId
      )
      const companyCurrencies = companyAddon?.addon_data?.currencies || []
      if (companyCurrencies.length) {
        const match = companyCurrencies.find(c => c.code === preferredCode)
        const currency = match ?? companyCurrencies[0]
        totalAddonPrice += Number(currency?.price ?? 0)
        continue
      }

      // Fallback to product_addons
      const productAddon = activeProductDetails.value?.product_addons?.find(
        a => a.addon_id === addonId
      )
      const productCurrencies = productAddon?.currencies || []
      if (productCurrencies.length) {
        const match = productCurrencies.find(c => c.code === preferredCode)
        const currency = match ?? productCurrencies[0]
        totalAddonPrice += Number(currency?.price ?? 0)
      }
    }

    return totalAddonPrice
  }

  const activeProductPrice = computed(() => {
    const details = activeProductDetails.value
    if (!details) return null
    const raw = details?.company_product?.is_custom_prices
    const isCustomPrice = ['1', 1, true, 'true'].includes(raw as string | number | boolean)

    const basePrice = isCustomPrice
      ? Number(details?.company_product?.skucurrency?.[0]?.price)
      : Number(details?.sku?.skucurrency?.[0]?.pivot?.price)

    if (!Number.isFinite(basePrice)) {
      return null
    }

    const minimumQuantity = Number(details?.sku?.minimum_order_quantity) || 1

    const totalAddonPrice = Number(getTotalAddonPrice()) || 0

    const totalPrice = (basePrice + totalAddonPrice) * minimumQuantity

    const currencyCode = isCustomPrice
      ? details?.company_product?.skucurrency?.[0]?.code
      : details?.sku?.skucurrency?.[0]?.code ||
        (companyStore.settings?.settings?.currencies &&
        Array.isArray(companyStore.settings.settings.currencies.currenncies) &&
        companyStore.settings.settings.currencies.currenncies.length > 0
          ? companyStore.settings.settings.currencies.currenncies[0]
          : 'USD')
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: currencyCode
    }).format(totalPrice)
  })

  const showPricing = computed(() => companyStore.settings?.settings?.currencies?.visible)

  return {
    getProductPrice,
    activeProductPrice,
    minimumActiveProductQuantityByDesign,
    showPricing,
    getMinimumProductQuantityByDesign,
    getTotalAddonPrice
  }
}
