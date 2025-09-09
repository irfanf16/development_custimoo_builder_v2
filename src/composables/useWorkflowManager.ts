import { ref, watch, type Ref } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import type { WorkflowRouteStep } from '@/components/customization-workflow/types'

export interface UseWorkflowManagerApi {
  currentStep: Ref<WorkflowRouteStep>
  stepHistory: Ref<string[]>
  navigateToStep: (step: WorkflowRouteStep) => void
  navigateBack: () => void
  handleCategorySelect: (categoryId: number) => void
  handleSubcategorySelect: (subcategoryId: number) => void
}

export function useWorkflowManager(): UseWorkflowManagerApi {
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()

  const currentStep = ref<WorkflowRouteStep>('category')
  const stepHistory = ref<string[]>(['category'])

  const navigateToStep = (step: WorkflowRouteStep) => {
    if (step !== currentStep.value) {
      stepHistory.value.push(step)
      currentStep.value = step
    }
  }

  const navigateBack = () => {
    if (stepHistory.value.length > 1) {
      stepHistory.value.pop()
      const previousStep = stepHistory.value[
        stepHistory.value.length - 1
      ] as WorkflowRouteStep
      if (previousStep === 'category') {
        // Category state is now handled through activeProductCustomization
      }
      currentStep.value = previousStep
    }
  }

  const handleCategorySelect = (categoryId: number) => {
    workflowStore.setSelectedCategoryForPreview(categoryId)
    // If category has subcategories, go to subcategory step, otherwise products
    const hasSubcategories = !!productsStore.categories?.data?.find(
      c => c.id === categoryId && c.subcategories && c.subcategories.length
    )
    navigateToStep(hasSubcategories ? 'subcategory' : 'product')
    // Keep products sub-step in sync so breadcrumb actions can react
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
    navigateToStep('product')
  }

  // React to step changes from the menu/store
  watch(
    () => workflowStore.activeStep,
    async step => {
      if (step === 'Categories' && currentStep.value !== 'category') {
        // When returning to categories, snapshot defaults for potential reset later
        productsStore.captureDefaultsSnapshot()
      }
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
        navigateToStep('designs')
      } else if (step === 'Styles') {
        const pid =
          productsStore.activeProductDetails?.id ||
          customizationStore.activeProductId
        if (pid && !productsStore.stylePreviews) {
          await productsStore.fetchStylePreviews(pid as number)
          await productsStore.fetchProductAddons(pid as number)
        }
        navigateToStep('styles')
      } else if (step === 'Logos') {
        // Ensure recent logos are loaded
        if (!productsStore.recentLogos) {
          await productsStore.fetchRecentLogos()
        }
        navigateToStep('logos')
      } else if (step === 'Colors') {
        navigateToStep('colors')
      } else if (step === 'Patterns') {
        const patternsSubStep = workflowStore.patternsSubStep || 'list'
        navigateToStep(
          patternsSubStep === 'list' ? 'patterns' : 'patterns-group'
        )
      } else if (step === 'Texts') {
        const textsSubStep = workflowStore.textsSubStep || 'list'
        navigateToStep(textsSubStep === 'list' ? 'texts' : 'texts-placement')
      } else if (step === 'Roster') {
        const rosterSubStep = workflowStore.rosterSubStep || 'list'
        navigateToStep(rosterSubStep === 'list' ? 'roster' : 'roster-edit')
      } else if (step === 'Summary') {
        navigateToStep('summary')
      } else if (step === 'Products') {
        // When no categories are available, go directly to product step
        navigateToStep('product')
      } else if (step === 'Categories') {
        const sub = workflowStore.productsSubStep || 'category'
        navigateToStep(sub as 'category' | 'subcategory' | 'product')
      }
    },
    { immediate: true }
  )

  // React to products sub-step changes while in Categories flow
  watch(
    () => workflowStore.productsSubStep,
    sub => {
      if (workflowStore.activeStep === 'Categories') {
        navigateToStep(sub as 'category' | 'subcategory' | 'product')
      }
    }
  )

  return {
    currentStep,
    stepHistory,
    navigateToStep,
    navigateBack,
    handleCategorySelect,
    handleSubcategorySelect
  }
}
