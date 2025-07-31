import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const isMobileMenuOpen = ref(false)
  const isLoginDialogOpen = ref(false)
  const isRegisterDialogOpen = ref(false)
  const isLoading = ref(false)

  // Actions
  const openMobileMenu = () => {
    isMobileMenuOpen.value = true
  }

  const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
  }

  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }

  const openLoginDialog = () => {
    isLoginDialogOpen.value = true
    isRegisterDialogOpen.value = false
  }

  const closeLoginDialog = () => {
    isLoginDialogOpen.value = false
  }

  const openRegisterDialog = () => {
    isRegisterDialogOpen.value = true
    isLoginDialogOpen.value = false
  }

  const closeRegisterDialog = () => {
    isRegisterDialogOpen.value = false
  }

  const closeAllDialogs = () => {
    isLoginDialogOpen.value = false
    isRegisterDialogOpen.value = false
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  return {
    // State
    isMobileMenuOpen,
    isLoginDialogOpen,
    isRegisterDialogOpen,
    isLoading,

    // Actions
    openMobileMenu,
    closeMobileMenu,
    toggleMobileMenu,
    openLoginDialog,
    closeLoginDialog,
    openRegisterDialog,
    closeRegisterDialog,
    closeAllDialogs,
    setLoading
  }
})
