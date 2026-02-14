import { ref, computed, watch } from 'vue'
import { useCartStore } from '@/stores/cart/cart.store'
import { useCompanyStore } from '@/stores/company/company.store'
import type { Addon } from '@/services/orders/types'

export interface CartProduct {
  // Internal IDs for API operations
  cart_item_id: number
  factory_product_id: string

  // Display fields
  product_id: number
  product_name: string
  design_id: number
  quantity: number
  price: number
  style: string
  addons: Array<{ id: number; title: string; price: number }>
  minimum_order_quantity: number
  // Additional fields for display
  front_image?: string
  back_image?: string
  logo_technology?: { label: string; price: number }
}

export type PricingRowType = 'product' | 'addon' | 'logo_technology' | 'subtotal'

export interface PricingRow {
  label: string
  qty: number
  unitPrice: number
  total: number
  type: PricingRowType
}

export function useCart() {
  // ===== DEPENDENCIES =====
  const cartStore = useCartStore()
  const companyStore = useCompanyStore()

  // ===== STATE =====
  const products = ref<CartProduct[]>([])

  // ===== COMPUTED =====
  const isLoading = computed(() => cartStore.isLoading)
  const error = computed(() => cartStore.error)

  const totalItems = computed(() => {
    return products.value.reduce((sum, product) => sum + product.quantity, 0)
  })

  const totalPrice = computed(() => {
    return products.value.reduce(
      (sum, product) =>
        sum +
        (product.price + product.addons.reduce((sum, addon) => sum + addon.price, 0)) *
          product.quantity,
      0
    )
  })

  // ===== UTILITIES =====
  /**
   * Map factory products from cart items to CartProduct array
   * Complex type transformation from API response structure
   */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  function mapCartItemsToProducts(): CartProduct[] {
    if (!cartStore.cart?.items) {
      return []
    }

    const mappedProducts: CartProduct[] = []

    for (const item of cartStore.cart.items) {
      const factoryProducts: any[] = item.factory_products || []

      for (const fp of factoryProducts) {
        // Safely extract addons
        const groupedAddons: any[] = Array.isArray(fp.grouped_addons) ? fp.grouped_addons : []
        const ungroupedAddons: any[] = Array.isArray(fp.ungrouped_addons) ? fp.ungrouped_addons : []
        const generalAddons: any[] = Array.isArray(fp.addons) ? fp.addons : []
        const allAddons: Array<{ id: number; title: string; price: number }> = []

        for (const addon of groupedAddons as Addon[]) {
          allAddons.push({
            id: Number(addon?.id) || 0,
            title: String(addon?.title || 'Unknown'),
            price: Number(addon?.currencies[0]?.price?.toString() || '0')
          })
        }
        for (const addon of ungroupedAddons as Addon[]) {
          allAddons.push({
            id: Number(addon?.id) || 0,
            title: String(addon?.title || 'Unknown'),
            price: Number(addon?.currencies[0]?.price?.toString() || '0')
          })
        }

        for (const addon of generalAddons as Addon[]) {
          allAddons.push({
            id: Number(addon?.id) || 0,
            title: String(addon?.title || 'Unknown'),
            price: Number(addon?.currencies[0]?.price?.toString() || '0')
          })
        }

        const priceObj: any = fp.product_price_object

        // Logo technology: from fp.logo_technology (root) or from fp.custom_logos[].logo_technology
        let logoTechnology: { label: string; price: number } | undefined
        const ltRoot: any = fp.logo_technology
        if (ltRoot && typeof ltRoot === 'object') {
          const price = Number(ltRoot.price)
          if (!Number.isNaN(price)) {
            logoTechnology = { label: String(ltRoot.label || 'Logo technology'), price }
          }
        }
        if (!logoTechnology) {
          const customLogos: any[] = Array.isArray(fp.custom_logos) ? fp.custom_logos : []
          let totalLogoPrice = 0
          let firstLabel: string | null = null
          for (const logo of customLogos) {
            const lt: any = logo?.logo_technology
            if (lt && typeof lt === 'object') {
              const p = Number(lt.price)
              if (!Number.isNaN(p)) {
                totalLogoPrice += p
                if (firstLabel === null) firstLabel = String(lt.label || 'Logo technology')
              }
            }
          }
          if (totalLogoPrice > 0) {
            logoTechnology = {
              label: firstLabel || 'Logo technology',
              price: totalLogoPrice
            }
          }
        }

        mappedProducts.push({
          cart_item_id: item.id,
          factory_product_id: String(fp?.id || ''),
          product_id: Number(fp?.product_id || 0),
          product_name: String(fp?.product_display_name || fp?.product_name || ''),
          design_id: Number(fp?.design_id || 0),
          quantity: Number(priceObj?.quantity || 0),
          price: Number(priceObj?.product_price || 0),
          style: String(fp?.style_name || ''),
          addons: allAddons,
          front_image: fp?.front_image ? String(fp.front_image) : undefined,
          back_image: fp?.back_image ? String(fp.back_image) : undefined,
          logo_technology: logoTechnology,
          minimum_order_quantity:
            fp?.is_custom_moq == 'true' && fp.minimum_order_quantity_type === 'by_cart'
              ? Number(fp.minimum_order_quantity)
              : fp.sku_minimum_order_quantity_type === 'by_cart'
                ? Number(fp.sku_minimum_order_quantity)
                : 1
        })
      }
    }

    return mappedProducts
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

  // ===== ACTIONS =====
  /**
   * Fetch cart from API
   */
  async function fetchCart() {
    await cartStore.fetchCart()
    // Always map cart data to products, even if fetch returned early
    // (e.g., if cart was already fetched on page load)
    products.value = mapCartItemsToProducts()
  }

  /**
   * Remove product from cart (without confirmation - confirmation handled in CartDialog)
   */
  async function removeProduct(factoryProductId: string): Promise<void> {
    const product = products.value.find(p => p.factory_product_id === factoryProductId)
    if (!product) {
      console.error('Product not found:', factoryProductId)
      return
    }
    await cartStore.deleteCartItem(product.cart_item_id, factoryProductId)
    // Refresh products after deletion
    products.value = mapCartItemsToProducts()
  }

  /**
   * Edit product - navigate to customization
   */
  async function editProduct(_factoryProductId: string): Promise<void> {
    // This will be handled by CartDialog which has access to the composable
    // The actual loading is done in CartDialog
  }

  /**
   * Add product to cart
   */
  async function addProduct(payload: {
    factory_product_id: number
    quantity?: number
  }): Promise<void> {
    try {
      await cartStore.addProductToCart(payload)
      // Refresh products after adding
      products.value = mapCartItemsToProducts()
    } catch (error) {
      console.error('Failed to add product:', error)
      throw error
    }
  }

  /**
   * Update product quantity
   */
  async function updateProductQuantity(factoryProductId: string, quantity: number): Promise<void> {
    const product = products.value.find(p => p.factory_product_id === factoryProductId)
    if (!product) {
      console.error('Product not found:', factoryProductId)
      return
    }

    try {
      await cartStore.updateCartItem(product.cart_item_id, { quantity })
      // Refresh products after update
      products.value = mapCartItemsToProducts()
    } catch (error) {
      console.error('Failed to update product quantity:', error)
      throw error
    }
  }

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`
  }

  const formatAddons = (addons: Array<{ id: number; title: string }>): string => {
    return addons.map(addon => addon.title).join(', ')
  }

  /**
   * Item subtotal: (quantity × unit price) + sum(addon × quantity) + logo technology price
   */
  function getItemSubtotal(product: CartProduct): number {
    const productTotal = product.quantity * product.price
    const addonsTotal = product.addons.reduce(
      (sum, addon) => sum + addon.price * product.quantity,
      0
    )
    const logoTotal = product.logo_technology?.price ?? 0
    return productTotal + addonsTotal + logoTotal
  }

  /**
   * Pricing rows for per-item breakdown (product, addons, logo technology, subtotal)
   */
  function getItemPricingRows(product: CartProduct): PricingRow[] {
    const rows: PricingRow[] = []

    rows.push({
      label: product.product_name,
      qty: product.quantity,
      unitPrice: product.price,
      total: product.quantity * product.price,
      type: 'product'
    })

    for (const addon of product.addons) {
      rows.push({
        label: addon.title,
        qty: product.quantity,
        unitPrice: addon.price,
        total: addon.price * product.quantity,
        type: 'addon'
      })
    }

    if (product.logo_technology) {
      rows.push({
        label: product.logo_technology.label,
        qty: 1,
        unitPrice: product.logo_technology.price,
        total: product.logo_technology.price,
        type: 'logo_technology'
      })
    }

    rows.push({
      label: 'Subtotal',
      qty: 0,
      unitPrice: 0,
      total: getItemSubtotal(product),
      type: 'subtotal'
    })

    return rows
  }

  /**
   * Validate cart for checkout: no item must have quantity 0
   */
  function validateCartForCheckout(): { valid: boolean; invalidFactoryProductIds: string[] } {
    console.log(products.value)
    const invalidFactoryProductIds = products.value
      .filter(p => p.quantity === 0)
      .map(p => p.factory_product_id)
    return {
      valid: invalidFactoryProductIds.length === 0,
      invalidFactoryProductIds
    }
  }
  const minimumCartQuantity = () => {
    const settingMoq = Number(companyStore?.settings?.settings?.moq)

    // 1) Use global setting if > 0
    if (settingMoq && settingMoq > 0) {
      return settingMoq
    }

    // 2) Fallback to max product minimum_order_quantity
    if (!products.value?.length) return 1

    const maxProductMoq = products.value.reduce((max, product) => {
      return Math.max(max, Number(product.minimum_order_quantity || 0))
    }, 0)

    return maxProductMoq > 0 ? maxProductMoq : 1
  }

  // ===== WATCHERS =====
  // Watch cart store changes and update products automatically
  watch(
    () => cartStore.cart,
    () => {
      if (cartStore.cart) {
        products.value = mapCartItemsToProducts()
      } else {
        products.value = []
      }
    },
    { deep: true, immediate: true }
  )

  // ===== RETURN =====
  return {
    // State
    products,
    isLoading,
    error,

    // Computed
    totalItems,
    totalPrice,

    // Actions
    fetchCart,
    removeProduct,
    editProduct,
    addProduct,
    updateProductQuantity,
    minimumCartQuantity,

    // Utilities
    formatPrice,
    formatAddons,
    getItemSubtotal,
    getItemPricingRows,
    validateCartForCheckout
  }
}
