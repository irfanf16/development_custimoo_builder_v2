import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { API } from '@/services'
import type {
  Cart,
  StoreProductToCartPayload,
  UpdateCartItemPayload,
  GenerateSignedUploadUrlPayload,
  GenerateSignedUploadUrlResponse,
  AddLockerProductsToCartPayload
} from '@/services/cart/types'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import { toast } from 'vue-sonner'
import { createEcommerceCartService, isEcommercePlatformSupported } from '@/services/ecommerce'
import type { ProcessCartItemConfig } from '@/services/ecommerce/types'
import { useCompanyStore } from '@/stores/company/company.store'
import { useQueryParams } from '@/composables/useQueryParams'

export const useCartStore = defineStore('cartStore', () => {
  // ===== DEPENDENCIES =====
  const { tryCatchApi } = useTryCatchApi({ defaultProperties: { store: 'cartStore' } })
  const companyStore = useCompanyStore()

  // ===== STATE =====
  const cart = ref<Cart | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Track if we're editing a cart product
  const editingCartItemId = ref<number | null>(null)
  const editingFactoryProductId = ref<string | null>(null)

  // Track if cart has been fetched on page load
  const hasFetchedOnPageLoad = ref(false)

  // ===== LOCAL STORAGE PERSISTENCE =====
  const STORAGE_KEY = 'cartStore'
  const { getItem, setItem, removeItem } = useLocalStorage()

  function saveToLocalStorage() {
    try {
      const state = {
        cart: cart.value
      }
      setItem(STORAGE_KEY, state)
    } catch (e) {
      console.error('Failed to save cartStore to localStorage:', e)
    }
  }

  function loadFromLocalStorage() {
    try {
      const state = getItem<{
        cart?: Cart | null
      }>(STORAGE_KEY)

      if (!state) return false

      if (state.cart) cart.value = state.cart

      return true
    } catch (e) {
      console.error('Failed to load cartStore from localStorage:', e)
      return false
    }
  }

  function clearLocalStorage() {
    removeItem(STORAGE_KEY)
  }

  // ===== ERROR HANDLING =====
  function setError(errorMessage: string | null) {
    error.value = errorMessage
    if (errorMessage) {
      toast.error(errorMessage, {
        position: 'top-right',
        richColors: true
      })
    }
  }

  function setSuccessMessage(successMessage: string) {
    toast.success(successMessage, {
      position: 'top-right',
      richColors: true
    })
  }

  /**
   * Safely convert a value to string, avoiding object stringification
   */
  function safeStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return ''
    }
    if (typeof value === 'string') {
      return value
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
    // If it's an object or other type, return empty string
    return ''
  }

  // ===== ACTIONS =====

  /**
   * Fetch customer's cart
   */
  async function fetchCart(force = false) {
    if (companyStore.isEcommercePlatform || !companyStore.company) {
      return
    }
    if (hasFetchedOnPageLoad.value && !force) {
      return
    }
    isLoading.value = true
    error.value = null
    const response = await tryCatchApi(API.cart.getCustomerCart(), {
      operation: 'fetchCart'
    })
    if (response.success && response.content) {
      const cartResponse = response.content
      if (cartResponse.result) {
        cart.value = cartResponse.result
        saveToLocalStorage()
        hasFetchedOnPageLoad.value = true
      } else {
        setError(cartResponse.message || 'Failed to load cart')
      }
    } else {
      setError('Failed to load cart')
    }
    isLoading.value = false
  }

  /**
   * Sync cart item with ecommerce platform
   */
  async function syncWithEcommercePlatform(
    cartProduct: Record<string, unknown>,
    custimooCartItem: {
      new_created_id: number | string
      cart_item_key: string
      front_image_url: string
      back_image_url: string
      front_image_short: string
      back_image_short: string
    },
    productEditInfo?: {
      cart_product_info?: {
        ecommerce_cart_id?: string
        shopify_line_item?: string | number
      }
    },
    collectionView?: boolean
  ): Promise<void> {
    // Check if ecommerce sync is needed
    const company = companyStore.company
    if (!company || !isEcommercePlatformSupported(company.platform)) {
      return
    }

    try {
      const merchantMoq = companyStore.settings?.settings?.moq || 0
      const deleteCartItemUrl = `${import.meta.env.VITE_API_ENDPOINT}/api/v2/carts/cart-items/${custimooCartItem.new_created_id}/factory_product/${custimooCartItem.cart_item_key}`

      // Create ecommerce cart service
      const ecommerceService = createEcommerceCartService(company.platform, company.company_domain)

      // Build config for ecommerce service
      const config: ProcessCartItemConfig = {
        cartProduct,
        custimooCartItem,
        productEditInfo,
        collectionView,
        merchantMoq,
        companyDomain: company.company_domain,
        customizerPageUrl: company.customizer_page_url || '',
        deleteCartItemUrl
      }

      // Process cart item with ecommerce platform
      const result = await ecommerceService.processCartItem(config)

      if (result.success) {
        // Redirect to cart if not in collection view
        if (result.redirectUrl && !collectionView) {
          window.location.replace(result.redirectUrl)
        }
      } else {
        console.error('Ecommerce sync error:', result.error)
        // Don't throw error - cart was still added to our system
        // Just log the error for debugging
      }
    } catch (error) {
      console.error('Failed to sync with ecommerce platform:', error)
      // Don't throw error - cart was still added to our system
      // Just log the error for debugging
    }
  }

  /**
   * Add product to cart
   */
  async function addProductToCart(payload: StoreProductToCartPayload) {
    isLoading.value = true
    error.value = null
    const response = await tryCatchApi(API.cart.storeProductToCart(payload), {
      operation: 'addProductToCart'
    })
    if (response.success && response.content) {
      const cartResponse = response.content
      if (cartResponse.result) {
        setSuccessMessage('Product added to cart successfully')

        const company = companyStore.company
        if (company && isEcommercePlatformSupported(company.platform) && payload.factory_product) {
          const result = cartResponse.result
          // Extract cart item data from result object (properties are at root level of API response)
          const resultWithCartData = result as unknown as Record<string, unknown>
          const custimooCartItem = {
            new_created_id: resultWithCartData.new_created_id as string | number,
            cart_item_key: safeStringify(resultWithCartData.cart_item_key),
            front_image_url: safeStringify(resultWithCartData.front_image_url),
            back_image_url: safeStringify(resultWithCartData.back_image_url),
            front_image_short:
              safeStringify(resultWithCartData.front_image_short) ||
              safeStringify(resultWithCartData.front_image_url),
            back_image_short:
              safeStringify(resultWithCartData.back_image_short) ||
              safeStringify(resultWithCartData.back_image_url)
          }
          await syncWithEcommercePlatform(payload.factory_product, custimooCartItem)
        }
        // Refresh cart to get updated state (force refresh)
        await fetchCart(true)
        return cartResponse
      } else {
        setError(cartResponse.message || 'Failed to add product to cart')
      }
    } else {
      setError('Failed to add product to cart')
    }
    isLoading.value = false
    return response.content
  }

  /**
   * Add locker products to cart (locker-only or product-level selection)
   */
  async function addLockerProductsToCart(payload: AddLockerProductsToCartPayload) {
    isLoading.value = true
    error.value = null
    const response = await tryCatchApi(API.cart.addLockerProductsToCart(payload), {
      operation: 'addLockerProductsToCart'
    })
    if (response.success && response.content) {
      const cartResponse = response.content
      if (cartResponse.result) {
        setSuccessMessage('Products added to cart successfully')
        await fetchCart(true)
        return cartResponse
      } else {
        setError(cartResponse.message || 'Failed to add products to cart')
      }
    } else {
      setError('Failed to add products to cart')
    }
    isLoading.value = false
    return response.content
  }

  /**
   * Update cart item
   */
  async function updateCartItem(cartItemId: number | string, payload: UpdateCartItemPayload) {
    isLoading.value = true
    error.value = null

    const response = await tryCatchApi(API.cart.updateCartItem(cartItemId, payload), {
      operation: 'updateCartItem',
      cart_item_id: cartItemId
    })

    if (response.success && response.content) {
      const cartResponse = response.content

      if (cartResponse.result && !cartResponse.errors.length) {
        setSuccessMessage('Cart item updated successfully')

        const company = companyStore.company
        if (company && isEcommercePlatformSupported(company.platform) && payload.factory_product) {
          // Extract cart item data from result object
          const result = cartResponse.result
          const resultWithCartData = result as unknown as Record<string, unknown>

          const custimooCartItem = {
            new_created_id: resultWithCartData.new_created_id as string | number,
            cart_item_key: safeStringify(resultWithCartData.cart_item_key),
            front_image_url: safeStringify(resultWithCartData.front_image_url),
            back_image_url: safeStringify(resultWithCartData.back_image_url),
            front_image_short:
              safeStringify(resultWithCartData.front_image_short) ||
              safeStringify(resultWithCartData.front_image_url),
            back_image_short:
              safeStringify(resultWithCartData.back_image_short) ||
              safeStringify(resultWithCartData.back_image_url)
          }

          const { line, updateItem } = useQueryParams()
          const productEditInfo = {
            cart_product_info: {
              ecommerce_cart_id: updateItem.value,
              shopify_line_item: line.value
            }
          }
          await syncWithEcommercePlatform(
            payload.factory_product,
            custimooCartItem,
            productEditInfo
          )
        }
        // Refresh cart to get updated state (force refresh)
        await fetchCart(true)
        return cartResponse
      } else {
        setError(cartResponse.message || 'Failed to update cart item')
        isLoading.value = false
        return null
      }
    } else {
      setError('Failed to update cart item')
      isLoading.value = false
      return null
    }
  }

  /**
   * Delete cart item
   */
  async function deleteCartItem(cartItemId: number | string, factoryProductId: number | string) {
    isLoading.value = true
    error.value = null
    const response = await tryCatchApi(API.cart.deleteCartItem(cartItemId, factoryProductId), {
      operation: 'deleteCartItem',
      cart_item_id: cartItemId,
      factory_product_id: factoryProductId
    })
    if (response.success && response.content) {
      const cartResponse = response.content
      if (cartResponse.result) {
        setSuccessMessage('Cart item deleted successfully')
        // Refresh cart to get updated state (force refresh)
        await fetchCart(true)
        return cartResponse
      } else {
        setError(cartResponse.message || 'Failed to delete cart item')
      }
    } else {
      setError('Failed to delete cart item')
    }
    isLoading.value = false
    return response.content
  }

  /**
   * Upload cart assets
   */
  async function uploadCartAssets(
    files: File[],
    cartItemId?: number,
    additionalData?: Record<string, unknown>
  ) {
    isLoading.value = true
    error.value = null
    const payload = {
      files,
      cart_item_id: cartItemId,
      ...additionalData
    }
    const response = await tryCatchApi(API.cart.uploadCartAssets(payload), {
      operation: 'uploadCartAssets',
      cart_item_id: cartItemId
    })
    if (response.success && response.content) {
      const cartResponse = response.content
      if (cartResponse.success) {
        setSuccessMessage('Cart assets uploaded successfully')
        // Optionally refresh cart after upload
        await fetchCart()
        return cartResponse
      } else {
        setError(cartResponse.message || 'Failed to upload cart assets')
      }
    } else {
      setError('Failed to upload cart assets')
    }
    isLoading.value = false
    return response.content
  }

  /**
   * Generate signed upload URLs for cart assets
   */
  async function generateSignedUploadUrl(
    payload: GenerateSignedUploadUrlPayload
  ): Promise<GenerateSignedUploadUrlResponse | null> {
    isLoading.value = true
    error.value = null
    const response = await tryCatchApi(API.cart.generateSignedUploadUrl(payload), {
      operation: 'generateSignedUploadUrl',
      company_id: payload.companyId,
      factory_id: payload.factoryId || undefined
    })
    if (response.success && response.content) {
      const urlResponse = response.content
      if (urlResponse.result.urls.length > 0) {
        return urlResponse
      } else {
        setError(urlResponse.message || 'Failed to generate signed upload URLs')
      }
    } else {
      setError('Failed to generate signed upload URLs')
    }
    isLoading.value = false
    return response.content
  }

  /**
   * Clear cart state
   */
  function clearCart() {
    cart.value = null
    error.value = null
    editingCartItemId.value = null
    editingFactoryProductId.value = null
    hasFetchedOnPageLoad.value = false
    clearLocalStorage()
  }

  /**
   * Set editing cart product state
   */
  function setEditingCartProduct(cartItemId: number, factoryProductId: string) {
    editingCartItemId.value = cartItemId
    editingFactoryProductId.value = factoryProductId
  }

  /**
   * Clear editing cart product state
   */
  function clearEditingCartProduct() {
    editingCartItemId.value = null
    editingFactoryProductId.value = null
  }

  /**
   * Check if we're currently editing a cart product
   */
  const isEditingCartProduct = computed(() => {
    return editingCartItemId.value !== null && editingFactoryProductId.value !== null
  })

  /**
   * Get total cart items count
   */
  const cartItemsCount = computed(() => {
    if (!cart.value?.items) return 0
    return cart.value.items.reduce((total, item) => {
      return total + (item.factory_products?.length || 0)
    }, 0)
  })

  // ===== RETURN =====
  return {
    // State
    cart,
    isLoading,
    error,
    editingCartItemId,
    editingFactoryProductId,
    isEditingCartProduct,
    cartItemsCount,
    hasFetchedOnPageLoad,

    // Actions
    fetchCart,
    addProductToCart,
    addLockerProductsToCart,
    updateCartItem,
    deleteCartItem,
    uploadCartAssets,
    generateSignedUploadUrl,
    clearCart,
    setEditingCartProduct,
    clearEditingCartProduct,

    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  }
})
