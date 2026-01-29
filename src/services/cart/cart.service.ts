import http from '../api'
import type {
  GetCustomerCartResponse,
  StoreProductToCartPayload,
  StoreProductToCartResponse,
  UpdateCartItemPayload,
  UpdateCartItemResponse,
  DeleteCartItemResponse,
  UploadCartAssetsPayload,
  UploadCartAssetsResponse,
  GenerateSignedUploadUrlPayload,
  GenerateSignedUploadUrlResponse,
  FactoryProduct
} from './types'

/**
 * Get customer's cart
 */
async function getCustomerCart() {
  return await http.get<GetCustomerCartResponse>('carts')
}

/**
 * Store product to cart
 */
async function storeProductToCart(payload: StoreProductToCartPayload) {
  // Build FormData using objectToFormData utility for nested objects
  const formDataPayload: Record<string, unknown> = {}

  // Handle factory_product object
  if (payload.factory_product) {
    formDataPayload.factory_product = payload.factory_product
  }

  // Handle other fields
  if (payload.factory_product_id !== undefined) {
    formDataPayload.factory_product_id = payload.factory_product_id
  }
  if (payload.quantity !== undefined) {
    formDataPayload.quantity = payload.quantity
  }
  if (payload.get_quote !== undefined) {
    formDataPayload.get_quote = payload.get_quote
  }

  // // Handle file uploads - these need to be appended directly to FormData
  // const formData = objectToFormData(formDataPayload)
  // if (payload.product_assets && Array.isArray(payload.product_assets)) {
  //   payload.product_assets.forEach((file, index) => {
  //     formData.append(`product_assets[${index}]`, file)
  //   })
  // }

  return await http.post<StoreProductToCartResponse>('carts', formDataPayload)
}

/**
 * Update cart item
 */
async function updateCartItem(cartItemId: number | string, payload: UpdateCartItemPayload) {
  // Build FormData using objectToFormData utility for nested objects
  const formDataPayload: Record<string, unknown> = {}

  // Handle factory_product object
  if (payload.factory_product) {
    formDataPayload.factory_product = payload.factory_product
  }

  // Handle other fields
  if (payload.quantity !== undefined) {
    formDataPayload.quantity = payload.quantity
  }
  if (payload.get_quote !== undefined) {
    formDataPayload.get_quote = payload.get_quote
  }

  // Handle file uploads - these need to be appended directly to FormData
  // const formData = objectToFormData(formDataPayload)
  // if (payload.product_assets && Array.isArray(payload.product_assets)) {
  //   payload.product_assets.forEach((file, index) => {
  //     formData.append(`product_assets[${index}]`, file)
  //   })
  // }

  return await http.post<UpdateCartItemResponse>(
    `carts/cart-items/${cartItemId}/update`,
    formDataPayload
  )
}

/**
 * Delete cart item
 */
async function deleteCartItem(cartItemId: number | string, factoryProductId: number | string) {
  return await http.delete<DeleteCartItemResponse>(
    `carts/cart-items/${cartItemId}/factory_product/${factoryProductId}`
  )
}

/**
 * Upload cart assets (files)
 */
async function uploadCartAssets(payload: UploadCartAssetsPayload) {
  const formData = new FormData()

  // Append files
  payload.files.forEach((file, index) => {
    formData.append(`files[${index}]`, file)
  })

  // Append other fields if present
  if (payload.cart_item_id) {
    formData.append('cart_item_id', String(payload.cart_item_id))
  }

  // Append any additional fields
  Object.keys(payload).forEach(key => {
    if (key !== 'files' && key !== 'cart_item_id') {
      const value = payload[key]
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value)
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, JSON.stringify(value))
        }
      }
    }
  })

  return await http.post<UploadCartAssetsResponse>('carts/assets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * Generate signed upload URLs for cart assets
 */
async function generateSignedUploadUrl(payload: GenerateSignedUploadUrlPayload) {
  const requestPayload: Record<string, unknown> = {
    files: payload.files
  }

  if (payload.companyId !== undefined) {
    requestPayload.companyId = payload.companyId
  }
  if (payload.factoryId !== undefined && payload.factoryId !== null) {
    requestPayload.factoryId = payload.factoryId
  }
  if (payload.collectionId !== undefined && payload.collectionId !== null) {
    requestPayload.collectionId = payload.collectionId
  }
  if (payload.type !== undefined) {
    requestPayload.type = payload.type
  }
  if (payload.customer !== undefined) {
    requestPayload.customer = payload.customer
  }

  return await http.post<GenerateSignedUploadUrlResponse>('assets/upload-urls', requestPayload)
}

/**
 * Get cart product details
 */
async function getCartProductDetails(
  cartItemId: number | string,
  factoryProductId: number | string
) {
  return await http.post<{
    errors: unknown[]
    message: string
    result: {
      factoryProducts: FactoryProduct[]
      factoryProductActiveIndex: number | string
      lockerProductId: number | null
      activityId: number | null
      id: number
      orderId: number | null
      factoryId: number | null
      cartId: number
      activityItems: unknown
    }
  }>(`carts/cart-items/edit`, {
    cart_item_id: cartItemId,
    factory_product_id: factoryProductId
  })
}

export default {
  getCustomerCart,
  storeProductToCart,
  updateCartItem,
  deleteCartItem,
  uploadCartAssets,
  generateSignedUploadUrl,
  getCartProductDetails
}
