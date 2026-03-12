import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth/auth.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import {
  auth_error_email_not_exist,
  auth_error_invalid_password,
  auth_error_login_failed,
  msg_send_reset_link_success,
  msg_send_unable_to_reset_password_error
} from '@/paraglide/messages'
import { useLocalStorage } from '@/composables/useLocalStorage'
import { useCompanyStore } from '@/stores/company/company.store'
import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
import { useSceneStore } from '@/stores/scene/scene.store'
import { useLogosStore } from '@/stores/logos/logos.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import type { InputResetPassword } from '@/services/authentication/types'

// ============================================================================
// Shared Singleton State - Single source of truth for dialog visibility
// ============================================================================
const isSignInDialogOpen = ref(false)
const isSignUpDialogOpen = ref(false)
const isForgotPasswordDialogOpen = ref(false)
const isResetPasswordDialogOpen = ref(false)

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
  isForgotPasswordDialogOpen.value = false
  isResetPasswordDialogOpen.value = false
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

  const setForgotPasswordDialogOpen = (open: boolean) => {
    isForgotPasswordDialogOpen.value = open
    if (open) {
      resetCredentials(authStore)
    }
  }

  const setResetPasswordDialogOpen = (open: boolean) => {
    isResetPasswordDialogOpen.value = open
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
    const errors = (result.axiosError?.response?.data as { errors?: Record<string, string[]> })
      ?.errors
    const locale = currentLocale.value
    if (errors?.email) {
      authStore.setError(auth_error_email_not_exist({}, { locale }))
    } else if (errors?.password) {
      authStore.setError(auth_error_invalid_password({}, { locale }))
    } else {
      authStore.setError(auth_error_login_failed({}, { locale }))
    }
    return false
  }

  const handleCancel = () => {
    isSignInDialogOpen.value = false
  }

  const handleOpenSignUp = () => {
    isSignInDialogOpen.value = false
    isSignUpDialogOpen.value = true
    isForgotPasswordDialogOpen.value = false
  }

  const handleSignUpSuccess = () => {
    isSignUpDialogOpen.value = false
  }

  const handleOpenSignIn = () => {
    isSignInDialogOpen.value = true
    isSignUpDialogOpen.value = false
    isForgotPasswordDialogOpen.value = false
  }

  const handleOpenForgotPassword = () => {
    isSignInDialogOpen.value = false
    isForgotPasswordDialogOpen.value = true
  }

  const handleForgotPassword = async (): Promise<boolean> => {
    authStore.setError(null)
    const result = await authStore.postForgotPassword({
      email_address: credentials.value.email
    })
    const locale = currentLocale.value

    if (result.success) {
      authStore.setError(msg_send_reset_link_success({}, { locale }))
      return true
    }

    authStore.setError(msg_send_unable_to_reset_password_error({}, { locale }))
    return false
  }

  const handleResetPassword = async (data: InputResetPassword): Promise<boolean> => {
    authStore.setError(null)
    const result = await authStore.postResetPassword(data)
    const locale = currentLocale.value
    if (result.content?.success) {
      return true
    }

    authStore.setError(msg_send_unable_to_reset_password_error({}, { locale }))
    return false
  }

  const clearAuthError = () => {
    authStore.setError(null)
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
    const { clearCustomization, clearReorderData } = useCustomizationStore()
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
    isForgotPasswordDialogOpen,
    isResetPasswordDialogOpen,
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
    setForgotPasswordDialogOpen,
    setResetPasswordDialogOpen,
    handleSignIn,
    handleCancel,
    handleOpenSignUp,
    handleSignUpSuccess,
    handleLogout,
    checkAuthFromStorage,
    handleOpenSignIn,
    handleOpenForgotPassword,
    handleForgotPassword,
    handleResetPassword,
    clearAuthError
  }
}
