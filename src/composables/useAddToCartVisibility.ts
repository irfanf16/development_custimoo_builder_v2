import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useCompanyStore } from '@/stores/company/company.store'

/**
 * Centralized logic for Add to Cart button visibility.
 *
 * Returns true when the button should be shown, false when it should be hidden.
 * Combines:
 * - Company feature access (e.g. place-order permission for self/cdnExceptLogin)
 * - Ecommerce platform check (hide when ecommerce + admin token)
 * - Admin token check (hide Add to Cart when logged in as admin on ecommerce)
 *
 * Inspired by canAccessCompanyFeatures from the legacy kitbuilder Helpers.
 * Quote-related checks are intentionally excluded.
 */
export function useAddToCartVisibility() {
  const authStore = useAuthStore()
  const companyStore = useCompanyStore()

  const shouldShowAddToCartButton = computed(() => {
    if (!companyStore.company) {
      return false
    }

    const platform = companyStore.company.platform?.toLowerCase()
    const requiresOrderPermission = companyStore.settings?.settings?.requires_order_permission
    const permissions = authStore.permissions?.permissions ?? []
    const hasPlaceOrderPermission = permissions.includes('place-order')

    // Company feature access: for self/cdnExceptLogin, respect requires_order_permission
    let canAccessCompanyFeatures: boolean
    if (platform === 'self' || platform === 'cdnexceptlogin') {
      canAccessCompanyFeatures = requiresOrderPermission ? hasPlaceOrderPermission : true
    } else {
      canAccessCompanyFeatures = true
    }

    if (!canAccessCompanyFeatures) {
      return false
    }

    // Hide when ecommerce platform and user has admin token (admin cannot add to cart)
    if (companyStore.isEcommercePlatform && authStore.hasAdminToken) {
      return false
    }

    return true
  })

  return {
    shouldShowAddToCartButton
  }
}
