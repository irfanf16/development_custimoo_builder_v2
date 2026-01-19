/**
 * Shopify Cart Service
 *
 * Handles cart synchronization with Shopify platform
 */
import { BaseEcommerceCartService } from './base.service'
import type {
  IEcommerceCartService,
  ProcessCartItemConfig,
  ProcessCartResult,
  EcommerceCartItem,
  EcommerceAddon,
  EcommerceAddonResult
} from './types'
import { createEcommerceHttpClient } from './http-client'

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

export class ShopifyCartService extends BaseEcommerceCartService implements IEcommerceCartService {
  private httpClient: ReturnType<typeof createEcommerceHttpClient>

  constructor(companyDomain: string) {
    super(companyDomain)
    this.httpClient = createEcommerceHttpClient(companyDomain)
  }

  /**
   * Get the current Shopify cart
   */
  async getCart(): Promise<{ items: EcommerceCartItem[] }> {
    const response = await this.httpClient.get<{ items: EcommerceCartItem[] }>('/cart.js')
    return response.data
  }

  /**
   * Remove cart items from Shopify
   */
  async removeCartItems(removeItems: Record<string, number>): Promise<void> {
    if (Object.keys(removeItems).length === 0) {
      return
    }

    const token = this.generateRandomToken()
    await this.httpClient.post(`/cart/update.js?token=${token}`, {
      updates: removeItems
    })
  }

  /**
   * Add Shopify addons to cart
   */
  private async addShopifyAddons(
    addonIds: number[],
    totalQuantity: number
  ): Promise<EcommerceAddonResult> {
    const removeAddons: Record<string, number> = {}
    const addonQuantities: Record<string, number> = {}
    const addCartAddons: EcommerceAddon[] = []

    // Get current cart
    const cartResponse = await this.getCart()
    const shopifyCartItems = cartResponse.items

    // Find existing addons in cart
    const removeAddonsCart = shopifyCartItems.filter(item => addonIds.includes(Number(item.id)))

    if (removeAddonsCart.length > 0) {
      removeAddonsCart.forEach(removeAddon => {
        const variantId = safeStringify(removeAddon.variant_id ?? removeAddon.id)
        addonQuantities[variantId] = Number(removeAddon.quantity) || 0
        removeAddons[safeStringify(removeAddon.key)] = 0
      })

      await this.removeCartItems(removeAddons)
    }

    // Build addon items to add
    addonIds.forEach(addonEcommerceVariantId => {
      const variantId = String(addonEcommerceVariantId)
      const existingQuantity = addonQuantities[variantId] || 0

      addCartAddons.push({
        id: addonEcommerceVariantId,
        quantity: existingQuantity + totalQuantity,
        properties: {
          _is_custimoo_addon: true
        }
      })
    })

    return { addons: addCartAddons }
  }

  /**
   * Update Shopify addons when editing a cart item
   */
  private async updateShopifyAddons(
    cartItemIndex: number,
    updatedAddonIds: number[],
    totalQuantity: number,
    ecommerceUpdateId: string
  ): Promise<EcommerceAddonResult> {
    let remainingAddons = [...updatedAddonIds]
    const removeAddons: Record<string, number> = {}
    const addCartAddons: EcommerceAddon[] = []

    // Get current cart
    const cartResponse = await this.getCart()
    const shopifyCartItems = cartResponse.items

    const productCartItem = shopifyCartItems[cartItemIndex]
    if (!productCartItem) {
      return { addons: [] }
    }

    let productCartItemQuantity = 0
    const childAddonIds =
      ((productCartItem.properties as Record<string, unknown>)?.child_addons as number[]) || []

    const previousAddonsCartItems: EcommerceCartItem[] = []
    const cartItemsWithSameKey: Record<string, number> = {}

    // Find related cart items
    shopifyCartItems.forEach(item => {
      if (childAddonIds.includes(Number(item.id))) {
        previousAddonsCartItems.push(item)
      }

      const properties = item.properties as Record<string, unknown>
      if (
        properties?._custimoo_cart_item_key &&
        properties._custimoo_cart_item_key === ecommerceUpdateId
      ) {
        cartItemsWithSameKey[String(item.key)] = 0
        productCartItemQuantity += Number(item.quantity) || 0
      }
    })

    // Process previous addons
    previousAddonsCartItems.forEach(prevCartItem => {
      removeAddons[String(prevCartItem.key)] = 0
      const prevAddonId = Number(prevCartItem.id)
      const prevQuantity = Number(prevCartItem.quantity) || 0

      if (!updatedAddonIds.includes(prevAddonId)) {
        // Addon was removed, keep remaining quantity
        const remainingQuantity = prevQuantity - productCartItemQuantity
        if (remainingQuantity > 0) {
          addCartAddons.push({
            id: prevAddonId,
            quantity: remainingQuantity,
            properties: {
              _is_custimoo_addon: true
            }
          })
        }
      } else {
        // Addon still exists, update quantity
        addCartAddons.push({
          id: prevAddonId,
          quantity: prevQuantity - productCartItemQuantity + totalQuantity,
          properties: {
            _is_custimoo_addon: true
          }
        })
        remainingAddons = remainingAddons.filter(addonId => addonId !== prevAddonId)
      }
    })

    // Remove old items
    const removeCartItems = { ...removeAddons, ...cartItemsWithSameKey }
    await this.removeCartItems(removeCartItems)

    // Add remaining new addons
    if (remainingAddons.length > 0) {
      remainingAddons.forEach(remainingId => {
        addCartAddons.push({
          id: remainingId,
          quantity: totalQuantity,
          properties: {
            _is_custimoo_addon: true
          }
        })
      })
    }

    return { addons: addCartAddons }
  }

  /**
   * Make Shopify cart API call to add items
   */
  private async makeShopifyCartCall(
    shopifyCartData: EcommerceCartItem[],
    collectionView: boolean,
    deleteCartItemUrl: string
  ): Promise<ProcessCartResult> {
    try {
      const token = this.generateRandomToken()
      const ecomUrl = `${this.companyDomain}/cart/add.js?token=${token}`

      await this.httpClient.post(ecomUrl, { items: shopifyCartData })

      return {
        success: true,
        redirectUrl: collectionView ? undefined : this.buildCartRedirectUrl()
      }
    } catch (error) {
      // If cart add fails, try to delete the created cart item
      try {
        await fetch(deleteCartItemUrl, { method: 'DELETE' })
      } catch (deleteError) {
        console.error('Failed to delete cart item after error:', deleteError)
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to sync cart with Shopify'
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Process and sync a cart item to Shopify
   */
  async processCartItem(config: ProcessCartItemConfig): Promise<ProcessCartResult> {
    const {
      cartProduct,
      custimooCartItem,
      productEditInfo,
      collectionView = false,
      merchantMoq = 0,
      customizerPageUrl = '',
      deleteCartItemUrl
    } = config

    const isCustimooMoq =
      (cartProduct.minimum_order_quantity_type === 'by_cart' &&
        Number(cartProduct.minimum_order_quantity) > 0) ||
      false

    const ecommerceUpdateId = productEditInfo?.cart_product_info?.ecommerce_cart_id || null

    // Extract addon IDs
    const ecomAddonIds: number[] = []
    const addons = (cartProduct.addons as Array<{ addon_ecommerce_variant_id?: number }>) || []
    for (const addon of addons) {
      if (addon.addon_ecommerce_variant_id) {
        ecomAddonIds.push(Number(addon.addon_ecommerce_variant_id))
      }
    }

    // Build Shopify item properties
    const shopifyItemProperties: Record<string, unknown> = {
      _custimoo_cart_id: custimooCartItem.new_created_id,
      _custimoo_cart_item_key: custimooCartItem.cart_item_key,
      _custimoo_front_image: custimooCartItem.front_image_url,
      _custimoo_back_image: custimooCartItem.back_image_url,
      _custimoo_cart_url: `${this.companyDomain}/${customizerPageUrl}/#/?sync_id=${safeStringify(cartProduct.sync_id)}&update_item=${custimooCartItem.cart_item_key}&update_cart=${custimooCartItem.new_created_id}`,
      _custimoo_delete_cart_url: deleteCartItemUrl,
      _custimoo_product_name: safeStringify(cartProduct.product_name),
      _custimoo_product_id: Number(cartProduct.product_id || 0),
      _custimoo_minimum_order_quantity: 0,
      _custimoo_merchant_moq: merchantMoq,
      'DESIGN NAME': safeStringify(cartProduct.product_name),
      'YOUR DESIGN': 'Below are the links of your customized designs.',
      'FRONT IMAGE': custimooCartItem.front_image_short,
      'BACK IMAGE': custimooCartItem.back_image_short,
      child_addons: ecomAddonIds,
      design_id: Number(cartProduct.design_id || 0)
    }

    if (isCustimooMoq) {
      shopifyItemProperties._custimoo_minimum_order_quantity = Number(
        cartProduct.minimum_order_quantity || 0
      )
    }

    // Build cart items
    const shopifyCartItemsData: EcommerceCartItem[] = []
    let calculatedTotalQuantity = 0
    const sizeVariantMapping = cartProduct.size_variants_mapping as
      | Record<string, { id: string | number }>
      | undefined

    const rosterDetail =
      (cartProduct.product_roster_detail as Array<{
        size: string
        quantity: number | string
      }>) || []

    if (sizeVariantMapping) {
      // Handle size variants
      rosterDetail.forEach(item => {
        const sizeVariant = sizeVariantMapping[item.size]
        if (sizeVariant) {
          const shopifyCartItem: EcommerceCartItem = {
            id: sizeVariant.id,
            quantity: Number(item.quantity),
            properties: { ...shopifyItemProperties }
          }

          const properties = shopifyCartItem.properties as Record<string, unknown>
          properties._custimoo_product_name = `${safeStringify(cartProduct.product_name)} (${safeStringify(item.size)})`
          properties._custimoo_product_size = safeStringify(item.size)
          properties._custimoo_delete_cart_url = `${deleteCartItemUrl}?size=${safeStringify(item.size)}`

          shopifyCartItemsData.push(shopifyCartItem)
          calculatedTotalQuantity += Number(item.quantity)
        }
      })
    } else {
      // Handle single variant with size breakdown
      const shopifySizes: Record<string, number> = {}
      rosterDetail.forEach(item => {
        const size = String(item.size)
        shopifySizes[size] = (shopifySizes[size] || 0) + Number(item.quantity)
        calculatedTotalQuantity += Number(item.quantity)
      })

      const shopifyCartItem: EcommerceCartItem = {
        id: safeStringify(cartProduct.ecommerce_variant_id),
        quantity: calculatedTotalQuantity,
        properties: { ...shopifyItemProperties }
      }

      // Add size properties
      if (Object.keys(shopifySizes).length > 0) {
        const properties = shopifyCartItem.properties as Record<string, unknown>
        for (const size in shopifySizes) {
          properties[`_Size ${size}`] = shopifySizes[size]
        }
      }

      shopifyCartItemsData.push(shopifyCartItem)
    }

    // Process addons
    if (ecommerceUpdateId) {
      // Update existing cart item
      const cartItemIndex = Number(productEditInfo?.cart_product_info?.shopify_line_item || 1) - 1
      const addonResult = await this.updateShopifyAddons(
        cartItemIndex,
        ecomAddonIds,
        calculatedTotalQuantity,
        String(ecommerceUpdateId)
      )

      const addShopifyItems = [...addonResult.addons, ...shopifyCartItemsData]
      return await this.makeShopifyCartCall(addShopifyItems, collectionView, deleteCartItemUrl)
    } else {
      // Add new cart item
      const addonResult = await this.addShopifyAddons(ecomAddonIds, calculatedTotalQuantity)
      const addShopifyItems = [...addonResult.addons, ...shopifyCartItemsData]
      return await this.makeShopifyCartCall(addShopifyItems, collectionView, deleteCartItemUrl)
    }
  }
}
