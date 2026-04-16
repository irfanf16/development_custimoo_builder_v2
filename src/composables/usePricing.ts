import { useCompanyStore } from '@/stores/company/company.store'
import type { OutputProductDetails } from '@/services/products/types'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useCartStore } from '@/stores/cart/cart.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useRoster } from '@/components/customization-workflow/WorkflowSteps/roster/useRoster'
import type { OutputSettings } from '@/services/company/types'
import type { FactoryProduct } from '@/services/cart/types'

function firstSettingsCurrencyCode(
  settings: OutputSettings['settings'] | null | undefined
): string | undefined {
  const c = settings?.currencies
  if (!c) return undefined
  const list = c.currenncies ?? c.currencies
  return Array.isArray(list) && list.length ? list[0] : undefined
}


export const usePricing = () => {
  const companyStore = useCompanyStore()
  const productsStore = useProductsStore()
  const profileStore = useProfileStore()
  const customizationStore = useCustomizationStore()
  const cartStore = useCartStore()
  const { activeProductDetails } = storeToRefs(productsStore)
  const locale = computed(() => profileStore.currentLocale || 'en')
  const { totalRosterQuantity } = useRoster()

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
            firstSettingsCurrencyCode(companyStore.settings?.settings) ||
            'USD'
        }).format(productPrice)
      }
      return productPrice
    }
    return null
  }
  const minimumActiveProductQuantityByDesignToCard = computed(() => {
    const details = activeProductDetails.value
    if (!details) return 1

    const companyType = details.company_product?.minimum_order_quantity_type
    const companyQty = Number(details.company_product?.minimum_order_quantity)

    const skuType = details.sku?.minimum_order_quantity_type
    const skuQty = Number(details.sku?.minimum_order_quantity)

    const raw = details?.company_product?.is_custom_moq
    const isCustomQuanity = ['1', 1, true, 'true'].includes(raw as string | number | boolean)

    if (isCustomQuanity) {
      if (companyType === 'by_design') {
        return companyQty > 0 ? companyQty : 1
      }
      if (companyType === 'by_cart') {
        return 1
      }
    } else {
      // Fallback to SKU by design
      if (skuType === 'by_design') {
        return skuQty > 0 ? skuQty : 1
      }
    }
    // Fallback to SKU by design
    return 1
  })

  const minimumActiveProductQuantityByCartToCard = computed(() => {
    const details = activeProductDetails.value
    if (!details) return 1

    const companyType = details.company_product?.minimum_order_quantity_type
    const companyQty = Number(details.company_product?.minimum_order_quantity)

    const skuType = details.sku?.minimum_order_quantity_type
    const skuQty = Number(details.sku?.minimum_order_quantity)

    // Company product has priority
    if (companyType === 'by_cart' && companyQty > 0) {
      return companyQty
    }

    // Fallback to SKU
    if (skuType === 'by_cart' && skuQty > 0) {
      return skuQty
    }

    return 1
  })

  const isQuantityByDesign = computed(() => {
    const details = activeProductDetails.value
    if (!details) return false

    const companyType = details.company_product?.minimum_order_quantity_type
    const companyQty = Number(details.company_product?.minimum_order_quantity)

    const skuType = details.sku?.minimum_order_quantity_type
    const skuQty = Number(details.sku?.minimum_order_quantity)

    const raw = details?.company_product?.is_custom_moq
    const isCustomQuantity =
      raw != null && ['1', 1, true, 'true'].includes(raw as string | number | boolean)

    // If company controls MOQ
    if (isCustomQuantity) {
      if (companyType === 'by_design' && companyQty > 0) return true
      if (companyType === 'by_cart') return false
      return false
    }

    // Otherwise fallback to SKU
    if (skuType === 'by_design' && skuQty > 0) return true

    return false
  })

  const getMinimumProductQuantityByDesign = (product: OutputProductDetails) => {
    if (!product) return 1

    // Company product has priority
    if (
      product.company_product?.minimum_order_quantity_type === 'by_design' &&
      Number(product.company_product?.minimum_order_quantity) > 0
    ) {
      return Number(product.company_product.minimum_order_quantity)
    }
    // Fallback to SKU
    if (
      product.sku?.minimum_order_quantity_type === 'by_design' &&
      Number(product.sku?.minimum_order_quantity) > 0
    ) {
      return Number(product.sku.minimum_order_quantity)
    }

    return 1
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
    const addonIds =
      customizationStore.customization?.addons_info?.[productId]?.addons?.map(
        addon => addon.addon_id
      ) || []

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

  /** Per-logo technology surcharges (not multiplied by roster qty; matches cart breakdown). */
  const getTotalLogoTechnologyPrice = () => {
    const productId = customizationStore.customization?.product_id
    if (productId == null) return 0
    const key = String(productId)
    const arr = customizationStore.customization?.custom_logos?.[key]
    if (!Array.isArray(arr)) return 0
    let sum = 0
    for (const logo of arr) {
      const tech =
        logo && typeof logo === 'object' && 'logo_technology' in logo
          ? (logo as { logo_technology?: { price?: number } | null }).logo_technology
          : null
      if (tech != null && typeof tech.price === 'number' && !Number.isNaN(tech.price)) {
        sum += tech.price
      }
    }
    return sum
  }

  const activeProductPrice = computed(() => {
    const details = activeProductDetails.value
    if (!details) return null

    /** When editing a cart line, use the same unit base as the cart API (`product_price_object`) so MSRP matches the cart (including collection-based pricing). */
    let editingCartFactoryProduct: FactoryProduct | null = null
    if (
      cartStore.isEditingCartProduct &&
      cartStore.editingCartItemId != null &&
      cartStore.editingFactoryProductId != null &&
      cartStore.cart?.items?.length
    ) {
      for (const item of cartStore.cart.items) {
        if (item.id !== cartStore.editingCartItemId) continue
        const fp = item.factory_products.find(
          p => String(p.id) === String(cartStore.editingFactoryProductId)
        )
        if (fp) {
          editingCartFactoryProduct = fp as FactoryProduct
          break
        }
      }
    }

    const ppo = editingCartFactoryProduct?.product_price_object
    if (ppo != null && !cartStore.preferSkuPriceWhileEditingCart) {
      const basePrice = Number(ppo.product_price)
      if (Number.isFinite(basePrice)) {
        const minimumQuantity = Number(totalRosterQuantity.value) || 1
        const totalAddonPrice = Number(getTotalAddonPrice()) || 0
        const totalLogoTechPrice = Number(getTotalLogoTechnologyPrice()) || 0
        const totalPrice = (basePrice + totalAddonPrice) * minimumQuantity + totalLogoTechPrice
        const currencyCode =
          ppo.currency_code || firstSettingsCurrencyCode(companyStore.settings?.settings) || 'USD'
        return new Intl.NumberFormat(locale.value, {
          style: 'currency',
          currency: currencyCode
        }).format(totalPrice)
      }
    }

    const raw = details?.company_product?.is_custom_prices
    const isCustomPrice = ['1', 1, true, 'true'].includes(raw as string | number | boolean)

    const basePrice = isCustomPrice
      ? Number(details?.company_product?.skucurrency?.[0]?.price)
      : Number(details?.sku?.skucurrency?.[0]?.pivot?.price)

    if (!Number.isFinite(basePrice)) {
      return null
    }

    const minimumQuantity = Number(totalRosterQuantity.value) || 1

    const totalAddonPrice = Number(getTotalAddonPrice()) || 0
    const totalLogoTechPrice = Number(getTotalLogoTechnologyPrice()) || 0

    const totalPrice = (basePrice + totalAddonPrice) * minimumQuantity + totalLogoTechPrice

    const currencyCode = isCustomPrice
      ? details?.company_product?.skucurrency?.[0]?.code
      : details?.sku?.skucurrency?.[0]?.code ||
        firstSettingsCurrencyCode(companyStore.settings?.settings) ||
        'USD'
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
    minimumActiveProductQuantityByDesignToCard,
    minimumActiveProductQuantityByCartToCard,
    showPricing,
    isQuantityByDesign,
    getMinimumProductQuantityByDesign,
    getTotalAddonPrice,
    getTotalLogoTechnologyPrice
  }
}
