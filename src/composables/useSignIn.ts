import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useCompanyStore } from '@/stores/company/company.store'
import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
import { useSceneStore } from '@/stores/scene/scene.store'
import { useLogosStore } from '@/stores/logos/logos.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'

// ============================================================================
// Shared Singleton State - Single source of truth for dialog visibility
// ============================================================================
const isSignInDialogOpen = ref(false)
const isSignUpDialogOpen = ref(false)

// Shared credentials state
const credentials = ref({
  email: '',
  password: ''
})

// ============================================================================
// Types
// ============================================================================
export interface LogoutOptions {
  /** Whether to clear all localStorage (not just auth-related) */
  clearAllStorage?: boolean
  /** Whether to reset the profile store state */
  resetProfileStore?: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Resets the sign-in form credentials and clears any auth errors
 */
function resetCredentials(authStore: ReturnType<typeof useAuthStore>) {
  credentials.value = { email: '', password: '' }
  authStore.setError(null)
}

/**
 * Closes all authentication-related dialogs
 */
function closeAllDialogs() {
  isSignInDialogOpen.value = false
  isSignUpDialogOpen.value = false
}

// ============================================================================
// Main Composable
// ============================================================================
export function useSignIn() {
  const authStore = useAuthStore()
  const profileStore = useProfileStore()
  const companyStore = useCompanyStore()
  const {
    isLoading,
    error: authError,
    isAuthenticated,
    customer,
    customerInitials
  } = storeToRefs(authStore)
  const { currentLocale } = storeToRefs(profileStore)

  // ============================================================================
  // Dialog State Management
  // ============================================================================

  const openSignInDialog = () => {
    if (companyStore.company?.platform === 'self') {
      isSignInDialogOpen.value = true
      resetCredentials(authStore)
    } else if (companyStore.company?.login_code?.type === 'url') {
      window.location.href = companyStore.company?.login_code?.action || ''
    } else if (companyStore.company?.login_code?.type === 'code') {
      try {
        // Start listening for external auth before executing custom code
        // This ensures we detect when the external system sets jwtToken/customer
        authStore.startListeningForAuth()

        eval(companyStore.company?.login_code?.action || '')
      } catch (error) {
        console.error('Error evaluating login code:', error)
        // Stop listening if code execution failed
        authStore.stopListeningForAuth()
      }
    }
  }

  const closeSignInDialog = () => {
    isSignInDialogOpen.value = false
  }

  const setSignInDialogOpen = (open: boolean) => {
    isSignInDialogOpen.value = open
    if (open) {
      resetCredentials(authStore)
    }
  }

  // ============================================================================
  // Authentication Actions
  // ============================================================================

  const handleSignIn = async (): Promise<boolean> => {
    authStore.setError(null)
    const result = await authStore.login(credentials.value)
    if (result.success) {
      isSignInDialogOpen.value = false
      resetCredentials(authStore)
      return true
    }
    return false
  }

  const handleCancel = () => {
    isSignInDialogOpen.value = false
  }

  const handleOpenSignUp = () => {
    isSignInDialogOpen.value = false
    isSignUpDialogOpen.value = true
  }

  const handleSignUpSuccess = () => {
    isSignUpDialogOpen.value = false
  }

  /**
   * Manually triggers authentication check from localStorage
   * Useful when external systems have just set auth data and want immediate hydration
   *
   * @example
   * // External system sets auth and triggers check
   * localStorage.setItem('jwtToken', token)
   * localStorage.setItem('customer', JSON.stringify(customer))
   * window.customizerApi?.checkAuth() // If exposed globally
   */
  const checkAuthFromStorage = async () => {
    try {
      const hasAuth = await authStore.loadFromLocalStorage({ force: true })
      if (hasAuth) {
        closeAllDialogs()
        console.log('[Auth] Successfully authenticated from localStorage')
      }
      return hasAuth
    } catch (error) {
      console.error('[Auth] Failed to check auth from localStorage:', error)
      return false
    }
  }

  /**
   * Centralized logout handler
   *
   * This method orchestrates the complete logout flow:
   * 1. Closes all authentication dialogs
   * 2. Clears auth state and auth-related localStorage (via authStore.logout())
   * 3. Optionally performs additional cleanup based on options
   * 4. Starts listening for new authentication data
   *
   * @param options - Optional configuration for logout behavior
   * @param options.clearAllStorage - If true, clears ALL localStorage (not just auth-related). Default: false
   * @param options.resetProfileStore - If true, resets the profile store state. Default: false
   *
   * @example
   * // Basic logout (auth only)
   * handleLogout()
   *
   * // Full cleanup logout
   * handleLogout({ clearAllStorage: true, resetProfileStore: true })
   */
  const handleLogout = (options?: LogoutOptions) => {
    const { company } = companyStore
    const { resetLockerState } = useLockerRoomStore()
    const { resetSceneStore } = useSceneStore()
    const { resetLogosStore } = useLogosStore()
    const { clearAll } = useLocalStorage()
    const { resetWorkFlowStore } = useWorkflowStore()
    const { clearCustomization, initializeProductTextsFromDetails, clearReorderData } =
      useCustomizationStore()
    const productsStore = useProductsStore()
    const loginCode = companyStore.company?.login_code

    // Determine platform-specific logout action
    if (company?.platform === 'self') {
      authStore.logout() // This now also starts listening for new auth
    } else if (loginCode?.type === 'url') {
      window.location.href = loginCode.logout_action || ''
      return // Redirecting, no further actions needed
    } else if (loginCode?.type === 'code') {
      try {
        eval(loginCode.logout_action || '')
      } catch (error) {
        console.error('Error evaluating logout code:', error)
      }
      // After custom logout code, perform standard logout
      authStore.logout()
    }
    resetLockerState() // Clear locker room state on logout
    resetSceneStore() // Clear scene store state on logout
    resetLogosStore() // Clear logos store state on logout
    resetWorkFlowStore() // Clear workflow store state on logout
    clearCustomization()
    const details = productsStore.activeProductDetails
    if (details?.product_texts?.length) {
      initializeProductTextsFromDetails(details.id, details.product_texts)
    }
    clearReorderData()

    // Close any opened authentication dialogs
    closeAllDialogs()

    // Perform standard logout operations on the auth store
    // Note: authStore.logout() already calls stopListeningForAuth() and then startListeningForAuth()
    authStore.logout()

    // Optionally clear all of localStorage
    if (options?.clearAllStorage) {
      clearAll()
    }
  }

  return {
    // State (shared singleton refs)
    isSignInDialogOpen,
    isSignUpDialogOpen,
    credentials,
    isLoading,
    authError,
    isAuthenticated,
    customer,
    customerInitials,
    currentLocale,
    // Methods
    openSignInDialog,
    closeSignInDialog,
    setSignInDialogOpen,
    handleSignIn,
    handleCancel,
    handleOpenSignUp,
    handleSignUpSuccess,
    handleLogout,
    checkAuthFromStorage
  }
}
