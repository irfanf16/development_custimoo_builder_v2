import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useCompanyStore } from '@/stores/company/company.store'

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
  const { clearAll } = useLocalStorage()
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
    } else if (companyStore.loginCode?.type === 'url') {
      window.location.href = companyStore.loginCode?.action || ''
    } else if (companyStore.loginCode?.type === 'code') {
      try {
        eval(companyStore.loginCode?.action || '')
      } catch (error) {
        console.error('Error evaluating login code:', error)
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
   * Centralized logout handler
   *
   * This method orchestrates the complete logout flow:
   * 1. Closes all authentication dialogs
   * 2. Clears auth state and auth-related localStorage (via authStore.logout())
   * 3. Optionally performs additional cleanup based on options
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
    const loginCode = companyStore.loginCode

    // Determine platform-specific logout action
    if (company?.platform === 'self') {
      authStore.logout()
    } else if (loginCode?.type === 'url') {
      window.location.href = loginCode.logout_action || ''
      return // Redirecting, no further actions needed
    } else if (loginCode?.type === 'code') {
      try {
        eval(loginCode.logout_action || '')
      } catch (error) {
        console.error('Error evaluating logout code:', error)
      }
    }

    // Close any opened authentication dialogs
    closeAllDialogs()

    // Perform standard logout operations on the auth store
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
    handleLogout
  }
}
