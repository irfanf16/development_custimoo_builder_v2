<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'

  const productsStore = useProductsStore()

  const currentStep = ref<
    | 'category'
    | 'subcategory'
    | 'product'
    | 'designs'
    | 'styles'
    | 'logos'
    | 'colors'
    | 'patterns'
    | 'patterns-group'
    | 'texts'
    | 'texts-placement'
    | 'roster'
    | 'roster-edit'
    | 'summary'
  >('category')

  const stepHistory = ref<string[]>(['category'])

  const navigateToStep = (
    step:
      | 'category'
      | 'subcategory'
      | 'product'
      | 'designs'
      | 'styles'
      | 'logos'
      | 'colors'
      | 'patterns'
      | 'patterns-group'
      | 'texts'
      | 'texts-placement'
      | 'roster'
      | 'roster-edit'
      | 'summary'
  ) => {
    if (step !== currentStep.value) {
      stepHistory.value.push(step)
      currentStep.value = step
    }
  }

  const navigateBack = () => {
    if (stepHistory.value.length > 1) {
      stepHistory.value.pop()
      const previousStep = stepHistory.value[stepHistory.value.length - 1] as
        | 'category'
        | 'product'
        | 'designs'
        | 'styles'
        | 'logos'
        | 'colors'
        | 'patterns'
        | 'patterns-group'
        | 'texts'
        | 'texts-placement'
        | 'roster'
        | 'roster-edit'
        | 'summary'
      if (previousStep === 'category') {
        // Category state is now handled through activeProductCustomization
      }
      currentStep.value = previousStep
    }
  }

  const handleCategorySelect = (categoryId: number) => {
    productsStore.setSelectedCategoryForPreview(categoryId)
    // If category has subcategories, go to subcategory step, otherwise products
    const hasSubcategories = !!productsStore.categories?.data?.find(
      c => c.id === categoryId && c.subcategories && c.subcategories.length
    )
    navigateToStep(hasSubcategories ? 'subcategory' : 'product')
  }

  const handleSubcategorySelect = (subcategoryId: number) => {
    productsStore.setSelectedSubCategoryForPreview(subcategoryId)
    navigateToStep('product')
  }

  // React to step changes from the menu/store
  watch(
    () => productsStore.activeStep,
    async step => {
      if (step === 'Categories' && currentStep.value !== 'category') {
        // When returning to categories, snapshot defaults for potential reset later
        productsStore.captureDefaultsSnapshot()
      }
      if (step === 'Designs') {
        // Ensure design previews are available after a reload
        const styleId =
          (productsStore.activeStyleDetails as any)?.id ||
          productsStore.activeStyleId
        const needsPreviews = !(
          Array.isArray(productsStore.designPreviews) &&
          productsStore.designPreviews.length > 0
        )
        if (needsPreviews && styleId) {
          await productsStore.dispatchGetDesignPreviewsByStyleId(
            styleId as number
          )
        }
        navigateToStep('designs')
      } else if (step === 'Styles') {
        const pid =
          (productsStore.activeProductDetails as any)?.id ||
          productsStore.activeProductId
        if (pid && !productsStore.stylePreviews) {
          await productsStore.dispatchGetStylePreviews(pid as number)
          await productsStore.dispatchGetProductAddons(pid as number)
        }
        navigateToStep('styles')
      } else if (step === 'Logos') {
        // Ensure recent logos are loaded
        if (!productsStore.recentLogos) {
          await productsStore.dispatchGetRecentLogos()
        }
        navigateToStep('logos')
      } else if (step === 'Colors') {
        navigateToStep('colors')
      } else if (step === 'Patterns') {
        const patternsSubStep = (productsStore as any).patternsSubStep || 'list'
        navigateToStep(
          patternsSubStep === 'list' ? 'patterns' : 'patterns-group'
        )
      } else if (step === 'Texts') {
        const textsSubStep = (productsStore as any).textsSubStep || 'list'
        navigateToStep(textsSubStep === 'list' ? 'texts' : 'texts-placement')
      } else if (step === 'Roster') {
        const rosterSubStep = (productsStore as any).rosterSubStep || 'list'
        navigateToStep(rosterSubStep === 'list' ? 'roster' : 'roster-edit')
      } else if (step === 'Summary') {
        navigateToStep('summary')
      } else if (step === 'Products') {
        // When no categories are available, go directly to product step
        navigateToStep('product')
      } else if (step === 'Categories') {
        const sub = (productsStore as any).productsSubStep || 'category'
        navigateToStep(sub as 'category' | 'subcategory' | 'product')
      } else if (currentStep.value === 'category') {
        // default after leaving categories is product step
        navigateToStep('product')
      }
    },
    { immediate: true }
  )

  // Expose reactive state and methods
  defineExpose({
    currentStep,
    stepHistory,
    navigateToStep,
    navigateBack,
    handleCategorySelect,
    handleSubcategorySelect
  })
</script>

<template>
  <!-- This component doesn't render anything, it just manages workflow state -->
</template>
