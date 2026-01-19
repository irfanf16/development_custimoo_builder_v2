/**
 * Base Ecommerce Cart Service
 *
 * Abstract base class providing common functionality for ecommerce cart services
 */
import type {
  IEcommerceCartService,
  ProcessCartItemConfig,
  ProcessCartResult,
  EcommerceCartItem
} from './types'

export abstract class BaseEcommerceCartService implements IEcommerceCartService {
  protected companyDomain: string

  constructor(companyDomain: string) {
    this.companyDomain = companyDomain
  }

  /**
   * Process and sync a cart item to the ecommerce platform
   * Must be implemented by each platform
   */
  abstract processCartItem(config: ProcessCartItemConfig): Promise<ProcessCartResult>

  /**
   * Remove cart items from the ecommerce platform
   * Must be implemented by each platform
   */
  abstract removeCartItems(removeItems: Record<string, number>): Promise<void>

  /**
   * Get the current cart from the ecommerce platform
   * Must be implemented by each platform
   */
  abstract getCart(): Promise<{ items: EcommerceCartItem[] }>

  /**
   * Helper to generate random token for cache busting
   */
  protected generateRandomToken(): number {
    return Math.floor(Math.random() * 100) + 1
  }

  /**
   * Helper to build cart redirect URL
   */
  protected buildCartRedirectUrl(): string {
    return `${this.companyDomain}/cart`
  }
}
