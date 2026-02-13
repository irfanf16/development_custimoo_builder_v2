import { ref, computed, watch } from 'vue'
import { useCartStore } from '@/stores/cart/cart.store'
import { useCompanyStore } from '@/stores/company/company.store'

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
  addons: Array<{ id: number; name: string }>
  minimum_order_quantity: number

  // Additional fields for display
  front_image?: string
  back_image?: string
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
    return products.value.reduce((sum, product) => sum + product.price * product.quantity, 0)
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
        const allAddons: Array<{ id: number; name: string }> = []

        for (const addon of groupedAddons) {
          allAddons.push({ id: Number(addon?.id) || 0, name: String(addon?.name || 'Unknown') })
        }
        for (const addon of ungroupedAddons) {
          allAddons.push({ id: Number(addon?.id) || 0, name: String(addon?.name || 'Unknown') })
        }

        for (const addon of generalAddons) {
          allAddons.push({ id: Number(addon?.id) || 0, name: String(addon?.title || 'Unknown') })
        }

        const priceObj: any = fp.product_price_object

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

  const formatAddons = (addons: Array<{ id: number; name: string }>): string => {
    return addons.map(addon => addon.name).join(', ')
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
    formatAddons
  }
}
