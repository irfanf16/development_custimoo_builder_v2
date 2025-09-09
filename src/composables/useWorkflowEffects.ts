import { watch } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'

/**
 * Centralized side effects for workflow step changes.
 * Handles data fetching and orchestration when workflow state changes.
 * Keep this separate from UI navigation logic.
 */
export function useWorkflowEffects() {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()

  // ===== WATCHERS =====
  // Watch for step changes and trigger appropriate data fetches
  watch(
    () => workflowStore.activeStep,
    async step => {
      if (step === 'Designs') {
        // Ensure design previews are available after a reload
        const styleId =
          productsStore.activeStyleDetails?.id ||
          customizationStore.activeStyleId
        const needsPreviews = !(
          Array.isArray(productsStore.designPreviews) &&
          productsStore.designPreviews.length > 0
        )
        if (needsPreviews && styleId) {
          await productsStore.fetchDesignPreviewsByStyleId(styleId as number)
        }
      } else if (step === 'Styles') {
        const pid =
          productsStore.activeProductDetails?.id ||
          customizationStore.activeProductId
        if (pid && !productsStore.stylePreviews) {
          await productsStore.fetchStylePreviews(pid as number)
          await productsStore.fetchProductAddons(pid as number)
        }
      } else if (step === 'Logos') {
        // Ensure recent logos are loaded
        if (!productsStore.recentLogos) {
          await productsStore.fetchRecentLogos()
        }
      }
    },
    { immediate: true }
  )

  // Watch for products sub-step changes while in Categories flow
  watch(
    () => workflowStore.productsSubStep,
    async sub => {
      if (workflowStore.activeStep === 'Categories') {
        // When returning to categories, snapshot defaults for potential reset later
        if (sub === 'category') {
          productsStore.captureDefaultsSnapshot()
        }
      }
    }
  )

  // ===== BUSINESS LOGIC =====
  const triggerStepEffects = async (step: string) => {
    // Manual trigger for effects if needed
    if (step === 'Designs') {
      const styleId =
        productsStore.activeStyleDetails?.id || customizationStore.activeStyleId
      if (styleId) {
        await productsStore.fetchDesignPreviewsByStyleId(styleId as number)
      }
    } else if (step === 'Styles') {
      const pid =
        productsStore.activeProductDetails?.id ||
        customizationStore.activeProductId
      if (pid) {
        await productsStore.fetchStylePreviews(pid as number)
        await productsStore.fetchProductAddons(pid as number)
      }
    } else if (step === 'Logos') {
      await productsStore.fetchRecentLogos()
    }
  }

  // ===== RETURN =====
  return {
    triggerStepEffects
  }
}
