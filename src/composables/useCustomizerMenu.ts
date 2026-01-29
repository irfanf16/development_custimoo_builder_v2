import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'
import {
  nav_product,
  nav_design,
  nav_style,
  nav_logo,
  nav_color,
  nav_pattern,
  nav_text,
  nav_roster,
  nav_summary
} from '@/paraglide/messages'

export function useCustomizerMenu() {
  const workflowStore = useWorkflowStore()
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()

  // Ensure the product menu entry stays visible even when category data is missing
  const shouldShowProductsMenuItem = computed(() => {
    return true
  })

  // Styles visibility: show if more than one style OR addons available
  const shouldShowStyles = computed(() => {
    const stylesCount = (productsStore.stylePreviews || []).length
    const hasAddons = !!(
      (productsStore.activeProductDetails?.company_addons &&
        productsStore.activeProductDetails?.company_addons.length) ||
      (productsStore.activeProductDetails?.product_addons &&
        productsStore.activeProductDetails?.product_addons.length)
    )
    return stylesCount > 1 || hasAddons
  })

  function isActive(label: CustomizerStep) {
    // Handle the case when no categories are available
    if (!shouldShowProductsMenuItem.value && label === 'product') {
      return false
    }
    if (label === 'product') {
      const currentStep = workflowStore.activeStep || 'product'
      if (currentStep !== 'product') return false
      const sub = workflowStore.productsSubStep
      return ['category', 'subcategory', 'product'].includes(sub || 'category')
    }

    // Check if we're in Logos-related substeps
    if (label === 'logos') {
      const currentStep = workflowStore.activeStep || 'product'
      const logosSubStep = workflowStore.logosSubStep

      // Highlight Logos if we're in Logos step and have a substep
      return (
        currentStep === 'logos' &&
        logosSubStep &&
        ['list', 'placement', 'edit'].includes(logosSubStep)
      )
    }

    // Check if we're in Patterns-related substeps
    if (label === 'patterns') {
      const currentStep = workflowStore.activeStep || 'product'
      return currentStep === 'patterns'
    }

    return (workflowStore.activeStep || 'product') === label
  }

  async function goTo(nextStep: CustomizerStep) {
    if (nextStep === 'product') {
      // Restore category state when navigating to product step
      const categoryId = customizationStore.activeCategoryId
      const subCategoryId = customizationStore.activeSubCategoryId

      if (categoryId) {
        // Restore selected category/subcategory from customization
        workflowStore.setSelectedCategoryForPreview(categoryId)
        if (subCategoryId) {
          workflowStore.setSelectedSubCategoryForPreview(subCategoryId)
        } else {
          workflowStore.setSelectedSubCategoryForPreview(null)
        }

        // Determine the correct productsSubStep
        const hasCategories = (productsStore.categories?.data?.length ?? 0) > 0
        if (hasCategories) {
          if (subCategoryId) {
            // Subcategory exists → show product previews directly
            workflowStore.setProductsSubStep('product')
          } else {
            // Check if category has subcategories
            const category = productsStore.categories?.data?.find(c => c.id === categoryId)
            const hasSubcategories = !!(
              category?.subcategories && category.subcategories.length > 0
            )
            if (hasSubcategories) {
              // Category has subcategories but none selected → show subcategory selection
              workflowStore.setProductsSubStep('subcategory')
            } else {
              // Category has no subcategories → show product previews directly
              workflowStore.setProductsSubStep('product')
            }
          }
        } else {
          // No categories available → show products directly
          workflowStore.setProductsSubStep('product')
        }

        // Fetch product previews if needed
        const hasPreviews =
          Array.isArray(productsStore.productPreviews) && productsStore.productPreviews.length > 0
        if (!hasPreviews) {
          await productsStore.fetchProductPreviews(categoryId, subCategoryId ?? undefined)
        }
      } else {
        // No category in customization → show category listing
        const hasCategories = (productsStore.categories?.data?.length ?? 0) > 0
        workflowStore.setProductsSubStep(hasCategories ? 'category' : 'product')
      }
    } else if (nextStep === 'designs') {
      const styleId = productsStore.activeStyleDetails?.id
      const hasPreviews =
        Array.isArray(productsStore.designPreviews) && productsStore.designPreviews.length > 0
      if (!hasPreviews && styleId) {
        await productsStore.fetchDesignPreviewsByStyleId(styleId)
      }
    } else if (nextStep === 'styles') {
      const pid = productsStore.activeProductDetails?.id
      if (pid) {
        if (!productsStore.stylePreviews) {
          await productsStore.fetchStylePreviews(pid)
        }
      }
    } else if (nextStep === 'logos') {
      // Prefetch recent logos is done in useWorkflowEffects
    } else if (nextStep === 'colors') {
      // Set step directly; colors lives inside product details
    } else if (nextStep === 'patterns') {
      // Ensure we start at the patterns list
      workflowStore.setPatternsSubStep('list')
    } else if (nextStep === 'texts') {
      // Text substep management would go here if implemented
    } else if (nextStep === 'roster') {
      // Roster substep management would go here if implemented
    }
    workflowStore.setActiveStep(nextStep)
  }

  // Helper function to get translated text for a navigation step
  function getNavText(step: CustomizerStep) {
    switch (step) {
      case 'product':
        return nav_product({}, { locale: profileStore.currentLocale })
      case 'designs':
        return nav_design({}, { locale: profileStore.currentLocale })
      case 'styles':
        return nav_style({}, { locale: profileStore.currentLocale })
      case 'logos':
        return nav_logo({}, { locale: profileStore.currentLocale })
      case 'colors':
        return nav_color({}, { locale: profileStore.currentLocale })
      case 'patterns':
        return nav_pattern({}, { locale: profileStore.currentLocale })
      case 'texts':
        return nav_text({}, { locale: profileStore.currentLocale })
      case 'roster':
        return nav_roster({}, { locale: profileStore.currentLocale })
      case 'summary':
        return nav_summary({}, { locale: profileStore.currentLocale })
      default:
        return step
    }
  }

  // Define all available menu items with their configuration
  const menuItems = computed(() => {
    const items = [
      {
        step: 'product' as CustomizerStep,
        show: shouldShowProductsMenuItem.value
      },
      {
        step: 'designs' as CustomizerStep,
        show: true
      },
      {
        step: 'styles' as CustomizerStep,
        show: shouldShowStyles.value
      },
      {
        step: 'logos' as CustomizerStep,
        show: true
      },
      {
        step: 'colors' as CustomizerStep,
        show: true
      },
      {
        step: 'patterns' as CustomizerStep,
        show: false
      },
      {
        step: 'texts' as CustomizerStep,
        show: true
      },
      {
        step: 'roster' as CustomizerStep,
        show: true
      },
      {
        step: 'summary' as CustomizerStep,
        show: true
      }
    ]

    return items.filter(item => item.show)
  })

  return {
    shouldShowProductsMenuItem,
    shouldShowStyles,
    isActive,
    goTo,
    getNavText,
    menuItems
  }
}
