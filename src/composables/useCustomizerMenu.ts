import { computed } from 'vue'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useProductsStore } from '@/stores/products/products.store'
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
  const profileStore = useProfileStore()

  // Determine if we should show Categories step based on available categories
  const shouldShowCategories = computed(() => {
    return productsStore.categories?.data && productsStore.categories.data.length > 0
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
    if (!shouldShowCategories.value && label === 'product') {
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
    if (nextStep === 'designs') {
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
        show: shouldShowCategories.value
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
        show: true
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
    shouldShowCategories,
    shouldShowStyles,
    isActive,
    goTo,
    getNavText,
    menuItems
  }
}
