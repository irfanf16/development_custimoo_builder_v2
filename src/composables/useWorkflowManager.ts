import { computed, type ComputedRef } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { WorkflowRouteStep } from '@/components/customization-workflow/types'
import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'

export interface UseWorkflowManagerApi {
  currentStep: ComputedRef<WorkflowRouteStep>
  handleCategorySelect: (categoryId: number) => void
  handleSubcategorySelect: (subcategoryId: number) => void
}

/**
 * Thin UI helper for workflow navigation.
 * No local state, no side effects, no data fetching.
 * All state comes from workflowStore, all effects handled by useWorkflowEffects.
 */
export function useWorkflowManager(): UseWorkflowManagerApi {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()

  // ===== COMPUTED =====
  const currentStep = computed<WorkflowRouteStep>(() => {
    const step = workflowStore.activeStep as CustomizerStep | null
    if (step === 'designs') return 'designs'
    if (step === 'styles') return 'styles'
    if (step === 'logos') return 'logos'
    if (step === 'colors') return 'colors'
    if (step === 'patterns') {
      return 'patterns'
    }
    if (step === 'texts') {
      const textsSubStep = workflowStore.textsSubStep || 'list'
      return textsSubStep === 'list' ? 'texts' : 'texts-placement'
    }
    if (step === 'roster') {
      const rosterSubStep = workflowStore.rosterSubStep || 'list'
      return rosterSubStep === 'list' ? 'roster' : 'roster-edit'
    }
    if (step === 'summary') return 'summary'
    if (step === 'product') {
      const sub = workflowStore.productsSubStep || 'category'
      return sub as 'product'
    }
    return 'product'
  })

  // ===== ACTIONS =====
  const handleCategorySelect = (categoryId: number) => {
    workflowStore.setSelectedCategoryForPreview(categoryId)
    // If category has subcategories, go to subcategory step, otherwise products
    const hasSubcategories = !!productsStore.categories?.data?.find(
      c => c.id === categoryId && c.subcategories && c.subcategories.length
    )
    workflowStore.setProductsSubStep(
      hasSubcategories ? 'subcategory' : 'product'
    )
  }

  const handleSubcategorySelect = (subcategoryId: number) => {
    console.log('handleSubcategorySelect', subcategoryId)
    workflowStore.setSelectedSubCategoryForPreview(subcategoryId)
    // Entering product list within Categories flow
    workflowStore.setProductsSubStep('product')
  }

  // ===== RETURN =====
  return {
    currentStep,
    handleCategorySelect,
    handleSubcategorySelect
  }
}
