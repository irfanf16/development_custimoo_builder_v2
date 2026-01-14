# Ecommerce Cart Synchronization Architecture

## Overview

This module provides a clean, scalable architecture for synchronizing cart items with external ecommerce platforms (Shopify, WooCommerce, etc.). The architecture follows separation of concerns principles, keeping the Pinia store focused on state management while delegating platform-specific logic to dedicated service modules.

## Architecture Principles

1. **Separation of Concerns**: Pinia store handles state management and orchestration; services handle platform-specific logic
2. **Interface-Based Design**: All platform services implement a shared interface (`IEcommerceCartService`)
3. **Factory Pattern**: Runtime service resolution based on company platform
4. **Extensibility**: Easy to add new platforms by implementing the interface
5. **Testability**: Services can be tested independently

## Directory Structure

```
src/services/ecommerce/
├── types.ts              # Shared types and interfaces
├── base.service.ts       # Abstract base class with common functionality
├── shopify.service.ts    # Shopify platform implementation
├── woocommerce.service.ts # WooCommerce platform implementation
├── factory.ts            # Factory for service resolution
├── http-client.ts        # HTTP client for external ecommerce APIs
├── index.ts              # Main export point
└── README.md             # This file
```

## Core Components

### 1. Interface (`IEcommerceCartService`)

Defines the contract that all ecommerce platform services must implement:

```typescript
interface IEcommerceCartService {
  processCartItem(config: ProcessCartItemConfig): Promise<ProcessCartResult>
  removeCartItems(removeItems: Record<string, number>): Promise<void>
  getCart(): Promise<{ items: EcommerceCartItem[] }>
}
```

### 2. Base Service (`BaseEcommerceCartService`)

Abstract base class providing common functionality:

- Company domain management
- Helper methods (random token generation, URL building)
- Common error handling patterns

### 3. Platform Services

#### Shopify Service (`ShopifyCartService`)

- Implements Shopify Cart API integration
- Handles addon management
- Supports size variants
- Manages cart item properties and metadata

#### WooCommerce Service (`WooCommerceCartService`)

- Stub implementation (ready for WooCommerce REST API integration)
- Follows same interface pattern

### 4. Factory (`createEcommerceCartService`)

Resolves the correct service based on platform:

```typescript
const service = createEcommerceCartService(platform, companyDomain)
```

Supported platforms:

- `shopify` → `ShopifyCartService`
- `wordpress` → `WooCommerceCartService`
- `bigcommerce` → (TODO: implement)
- `magento` → (TODO: implement)

## Integration with Cart Store

The cart store (`src/stores/cart/cart.store.ts`) integrates ecommerce synchronization:

1. **After Adding to Cart**: Automatically syncs with ecommerce platform
2. **After Updating Cart**: Updates ecommerce platform cart
3. **Error Handling**: Non-blocking - cart operations succeed even if ecommerce sync fails

### Usage in Cart Store

```typescript
// Automatically called after addProductToCart or updateCartItem
await syncWithEcommercePlatform(cartProduct, custimooCartItem, productEditInfo, collectionView)
```

## Adding a New Platform

To add support for a new ecommerce platform:

1. **Create Service Class**:

   ```typescript
   export class NewPlatformCartService extends BaseEcommerceCartService {
     async processCartItem(config: ProcessCartItemConfig): Promise<ProcessCartResult> {
       // Implement platform-specific logic
     }

     async removeCartItems(removeItems: Record<string, number>): Promise<void> {
       // Implement platform-specific logic
     }

     async getCart(): Promise<{ items: EcommerceCartItem[] }> {
       // Implement platform-specific logic
     }
   }
   ```

2. **Update Factory**:

   ```typescript
   case 'newplatform':
     return new NewPlatformCartService(companyDomain)
   ```

3. **Update Platform Type** (if needed):
   Add the platform to the `Platform` type in `src/services/company/types.ts`

## HTTP Client

The `http-client.ts` module provides a dedicated axios instance for external ecommerce platform APIs. This is separate from the internal API client because:

- Different base URLs (company domain vs API endpoint)
- Different authentication requirements
- Different error handling needs

## Error Handling

- Ecommerce sync errors are logged but don't block cart operations
- Cart items are always saved to the internal system first
- If ecommerce sync fails, the cart operation still succeeds
- Errors are logged for debugging purposes

## Testing

Services can be tested independently:

```typescript
// Mock the HTTP client
const mockHttpClient = createMockHttpClient()
const service = new ShopifyCartService('https://example.myshopify.com')

// Test service methods
await service.processCartItem(config)
```

## Future Enhancements

- [ ] Implement WooCommerce full integration
- [ ] Add BigCommerce support
- [ ] Add Magento support
- [ ] Add retry logic for failed syncs
- [ ] Add queue system for async sync operations
- [ ] Add webhook support for cart updates
- [ ] Add comprehensive error recovery

## Notes

- The Shopify service is fully implemented based on the Vue 2 codebase
- WooCommerce service is a stub ready for implementation
- All platform-specific logic is isolated in service classes
- The cart store remains focused on state management
- Easy to extend to additional platforms
