import { computed, type ComputedRef } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { WorkflowRouteStep } from '@/components/customization-workflow/types'

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
    const step = workflowStore.activeStep
    if (step === 'Designs') return 'designs'
    if (step === 'Styles') return 'styles'
    if (step === 'Logos') return 'logos'
    if (step === 'Colors') return 'colors'
    if (step === 'Patterns') {
      const patternsSubStep = workflowStore.patternsSubStep || 'list'
      return patternsSubStep === 'list' ? 'patterns' : 'patterns-group'
    }
    if (step === 'Texts') {
      const textsSubStep = workflowStore.textsSubStep || 'list'
      return textsSubStep === 'list' ? 'texts' : 'texts-placement'
    }
    if (step === 'Roster') {
      const rosterSubStep = workflowStore.rosterSubStep || 'list'
      return rosterSubStep === 'list' ? 'roster' : 'roster-edit'
    }
    if (step === 'Summary') return 'summary'
    if (step === 'Products') return 'product'
    if (step === 'Categories') {
      const sub = workflowStore.productsSubStep || 'category'
      return sub as 'category' | 'subcategory' | 'product'
    }
    return 'category' // fallback
  })

  // ===== ACTIONS =====
  const handleCategorySelect = (categoryId: number) => {
    workflowStore.setSelectedCategoryForPreview(categoryId)
    // If category has subcategories, go to subcategory step, otherwise products
    const hasSubcategories = !!productsStore.categories?.data?.find(
      c => c.id === categoryId && c.subcategories && c.subcategories.length
    )
    workflowStore.setProductsSubStep(
      (hasSubcategories ? 'subcategory' : 'product') as
        | 'subcategory'
        | 'product'
    )
  }

  const handleSubcategorySelect = (subcategoryId: number) => {
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
