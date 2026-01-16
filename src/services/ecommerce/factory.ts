/**
 * Ecommerce Cart Service Factory
 *
 * Factory pattern to resolve the correct ecommerce cart service
 * based on the company's platform
 */
import type { IEcommerceCartService } from './types'
import { ShopifyCartService } from './shopify.service'
import { WooCommerceCartService } from './woocommerce.service'
import type { Platform } from '@/services/company/types'

/**
 * Create the appropriate ecommerce cart service based on platform
 */
export function createEcommerceCartService(
  platform: Platform,
  companyDomain: string
): IEcommerceCartService {
  const normalizedPlatform = platform.toLowerCase()

  switch (normalizedPlatform) {
    case 'shopify':
      return new ShopifyCartService(companyDomain)

    case 'wordpress':
      // WooCommerce runs on WordPress
      return new WooCommerceCartService(companyDomain)

    case 'bigcommerce':
      // TODO: Implement BigCommerce service when needed
      throw new Error(`BigCommerce cart service not yet implemented for platform: ${platform}`)

    case 'self':
    case 'cdnexceptlogin':
    default:
      throw new Error(
        `Ecommerce cart synchronization not supported for platform: ${platform}. Only ecommerce platforms (shopify, wordpress, bigcommerce) are supported.`
      )
  }
}

/**
 * Check if a platform supports ecommerce cart synchronization
 */
export function isEcommercePlatformSupported(platform: Platform): boolean {
  const normalizedPlatform = platform.toLowerCase()
  return ['shopify', 'wordpress', 'bigcommerce'].includes(normalizedPlatform)
}
