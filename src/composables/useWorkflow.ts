import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useLogosStore } from '@/stores/logos/logos.store'

export interface UseWorkflowOptions {
  /**
   * Automatically initialize workflow side effects (data prefetching).
   * Defaults to true.
   */
  autoInitializeEffects?: boolean
}

export interface UseWorkflowApi {
  // ===== EFFECTS =====
  initializeEffects: () => void
}

let effectsInitialized = false

export function useWorkflow(options: UseWorkflowOptions = {}): UseWorkflowApi {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const logosStore = useLogosStore()

  const { activeStep, logosSubStep } = storeToRefs(workflowStore)

  // ===== EFFECTS =====
  const initializeEffects = () => {
    if (effectsInitialized) return

    effectsInitialized = true

    async function initializeDesigns() {
      const styleId = productsStore.activeStyleDetails?.id || customizationStore.activeStyleId
      const needsPreviews = !(
        Array.isArray(productsStore.designPreviews) && productsStore.designPreviews.length > 0
      )
      if (needsPreviews && styleId) {
        await productsStore.fetchDesignPreviewsByStyleId(styleId)
      }
    }
    async function initializeStyles() {
      const pid = productsStore.activeProductDetails?.id || customizationStore.activeProductId
      if (pid && !productsStore.stylePreviews) {
        await productsStore.fetchStylePreviews(pid)
      }
    }

    watch(
      () => activeStep.value,
      async step => {
        if (step === 'designs') {
          await initializeDesigns()
        } else if (step === 'styles') {
          await initializeStyles()
        } else if (step === 'logos') {
          await logosStore.fetchRecentLogos()
        }
      },
      { immediate: true }
    )

    watch(
      () => logosSubStep.value,
      async subStep => {
        if (subStep === 'list') {
          await logosStore.fetchRecentLogos()
        }
      }
    )
  }

  if (options.autoInitializeEffects ?? true) {
    initializeEffects()
  }

  // ===== RETURN =====
  return {
    initializeEffects
  }
}
