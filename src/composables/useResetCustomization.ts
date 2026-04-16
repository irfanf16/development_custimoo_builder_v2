import { ref } from 'vue'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useHistoryStore } from '@/stores/history/history.store'
import { useCartStore } from '@/stores/cart/cart.store'

// ============================================================================
// Shared Singleton State - Single source of truth for reset dialog visibility
// ============================================================================
const isResetDialogOpen = ref(false)

// ============================================================================
// Main Composable
// ============================================================================
export function useResetCustomization() {
  const customizationStore = useCustomizationStore()
  const historyStore = useHistoryStore()
  const cartStore = useCartStore()

  // ============================================================================
  // Dialog State Management
  // ============================================================================

  const openResetDialog = () => {
    isResetDialogOpen.value = true
  }

  const closeResetDialog = () => {
    isResetDialogOpen.value = false
  }

  const setResetDialogOpen = (open: boolean) => {
    isResetDialogOpen.value = open
  }

  // ============================================================================
  // Reset Actions
  // ============================================================================

  const handleConfirmReset = () => {
    customizationStore.clearCustomization()
    historyStore.clear()
    if (cartStore.isEditingCartProduct) {
      cartStore.setPreferSkuPriceWhileEditingCart(true)
    }
    isResetDialogOpen.value = false
  }

  return {
    // State (shared singleton ref)
    isResetDialogOpen,
    // Methods
    openResetDialog,
    closeResetDialog,
    setResetDialogOpen,
    handleConfirmReset
  }
}
