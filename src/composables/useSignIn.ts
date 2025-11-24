import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useLocalStorage } from '@/composables/useLocalStorage'

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
    isSignInDialogOpen.value = true
    resetCredentials(authStore)
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
    // Step 1: Close all authentication dialogs
    closeAllDialogs()

    // Step 2: Clear auth state and auth-related localStorage
    // This handles: customer, accessToken, refreshToken, and auth localStorage keys
    authStore.logout()

    // Step 3: Optional - Clear all localStorage (including non-auth data)
    if (options?.clearAllStorage) {
      clearAll()
    }

    // Step 4: Optional - Reset profile store state
    if (options?.resetProfileStore) {
      profileStore.$reset()
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
