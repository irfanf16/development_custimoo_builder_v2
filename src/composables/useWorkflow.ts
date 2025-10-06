import { computed, watch, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useLogosStore } from '@/stores/logos/logos.store'
import type { WorkflowRouteStep } from '@/components/customization-workflow/types'
import type {
  CustomizerStep,
  LogosSubStep,
  ProductsSubStep,
  TextsSubStep,
  RosterSubStep
} from '@/stores/workflow/workflow.store.types'

export type NavigationItem = {
  label: string
  action?: () => void
  isActive?: boolean
}

export interface UseWorkflowOptions {
  /**
   * Automatically initialize workflow side effects (data prefetching).
   * Defaults to true.
   */
  autoInitializeEffects?: boolean
}

export interface UseWorkflowApi {
  // ===== CORE STATE =====
  activeStep: Ref<CustomizerStep | null | undefined>
  currentStep: ComputedRef<WorkflowRouteStep>
  contentKey: ComputedRef<string>
  isPanelOpen: ComputedRef<boolean>

  // ===== SUB-STEPS =====
  logosSubStep: Ref<LogosSubStep>
  productsSubStep: Ref<ProductsSubStep>
  textsSubStep: Ref<TextsSubStep>
  rosterSubStep: Ref<RosterSubStep>

  // ===== NAVIGATION =====
  navigationItems: ComputedRef<NavigationItem[]>

  // ===== ACTIONS =====
  handleCategorySelect: (categoryId: number) => void
  handleSubcategorySelect: (subcategoryId: number) => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void

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

  const {
    activeStep,
    logosSubStep,
    productsSubStep,
    textsSubStep,
    rosterSubStep,
    panelOpen,
    selectedCategoryId,
    selectedSubCategoryId
  } = storeToRefs(workflowStore)

  const { activeCategoryId, activeSubCategoryId } =
    storeToRefs(customizationStore)

  // ===== DERIVED STATE =====
  const currentStep = computed<WorkflowRouteStep>(() => {
    const step = activeStep.value as CustomizerStep | null
    switch (step) {
      case 'designs':
        return 'designs'
      case 'styles':
        return 'styles'
      case 'logos':
        return 'logos'
      case 'colors':
        return 'colors'
      case 'patterns':
        return 'patterns'
      case 'texts':
        return textsSubStep.value === 'placement' ? 'texts-placement' : 'texts'
      case 'roster':
        return rosterSubStep.value === 'edit' ? 'roster-edit' : 'roster'
      case 'summary':
        return 'summary'
      case 'product':
        return 'product'
      default:
        return 'product'
    }
  })

  const contentKey = computed(() => {
    const step = activeStep.value
    if (step === 'logos') {
      return `logos-${logosSubStep.value || 'list'}`
    }
    if (step === 'texts') {
      return `texts-${textsSubStep.value || 'list'}`
    }
    if (step === 'roster') {
      return `roster-${rosterSubStep.value || 'list'}`
    }
    return step || 'product'
  })

  const isPanelOpen = computed(() => panelOpen.value)

  const navigationItems = computed<NavigationItem[]>(() => {
    const step = activeStep.value || 'product'

    if (step === 'product') {
      if (productsSubStep.value === 'category') {
        return [{ label: 'Category' }]
      }

      const categoryIdForTrail =
        selectedCategoryId.value ?? activeCategoryId.value ?? null

      const category = productsStore.categories?.data?.find(
        c => c.id === categoryIdForTrail
      )

      const subId =
        selectedSubCategoryId.value ?? activeSubCategoryId.value ?? null

      if (productsSubStep.value === 'subcategory') {
        return [
          {
            label: 'Category',
            action: () => {
              workflowStore.setProductsSubStep('category')
            }
          },
          { label: category?.category_name || '—' }
        ]
      }

      const hasSubs = !!(
        category &&
        category.subcategories &&
        category.subcategories.length
      )

      if (hasSubs) {
        const selectedSub =
          category && subId
            ? category.subcategories?.find(s => s.id === subId)
            : undefined
        const subLabel = selectedSub?.category_name || 'Subcategory'
        return [
          {
            label: 'Category',
            action: () => {
              workflowStore.setProductsSubStep('category')
            }
          },
          { label: subLabel }
        ]
      }

      return [
        {
          label: 'Category',
          action: () => {
            workflowStore.setProductsSubStep('category')
          }
        },
        { label: category?.category_name || '—' }
      ]
    }

    if (step === 'designs') {
      return [{ label: 'Designs' }]
    }

    if (step === 'styles') {
      const title = productsStore.activeProductDetails?.display_name || 'Styles'
      return [{ label: title }]
    }

    if (step === 'logos') {
      const map: Record<LogosSubStep, string> = {
        list: 'Logos',
        placement: 'Placement',
        edit: 'Controls'
      }
      const trail: NavigationItem[] = [
        {
          label: 'Logos',
          action: () => {
            workflowStore.setLogosSubStep('list')
          }
        }
      ]
      if (logosSubStep.value && logosSubStep.value !== 'list') {
        trail.push({ label: map[logosSubStep.value] })
      }
      return trail
    }

    if (step === 'colors') {
      return [{ label: 'Color' }]
    }

    if (step === 'patterns') {
      return [{ label: 'Pattern' }]
    }

    if (step === 'texts') {
      return [{ label: 'Texts' }]
    }

    if (step === 'roster') {
      return [{ label: 'Roster' }]
    }

    if (step === 'summary') {
      return [{ label: 'Summary' }]
    }

    return [{ label: String(step) }]
  })

  // ===== ACTIONS =====
  const handleCategorySelect = (categoryId: number) => {
    workflowStore.setSelectedCategoryForPreview(categoryId)
    const hasSubcategories = !!productsStore.categories?.data?.find(
      c => c.id === categoryId && c.subcategories && c.subcategories.length
    )
    if (!hasSubcategories) {
      workflowStore.setSelectedSubCategoryForPreview(null)
    }
    workflowStore.setProductsSubStep(
      hasSubcategories ? 'subcategory' : 'product'
    )
  }

  const handleSubcategorySelect = (subcategoryId: number) => {
    workflowStore.setSelectedSubCategoryForPreview(subcategoryId)
    workflowStore.setProductsSubStep('product')
  }

  const togglePanel = () => {
    workflowStore.togglePanel()
  }

  const setPanelOpen = (open: boolean) => {
    workflowStore.setPanelOpen(open)
  }

  // ===== EFFECTS =====
  const initializeEffects = () => {
    if (effectsInitialized) return
    effectsInitialized = true

    watch(
      () => activeStep.value,
      async step => {
        if (step === 'designs') {
          const styleId =
            productsStore.activeStyleDetails?.id ||
            customizationStore.activeStyleId
          const needsPreviews = !(
            Array.isArray(productsStore.designPreviews) &&
            productsStore.designPreviews.length > 0
          )
          if (needsPreviews && styleId) {
            await productsStore.fetchDesignPreviewsByStyleId(styleId)
          }
        } else if (step === 'styles') {
          const pid =
            productsStore.activeProductDetails?.id ||
            customizationStore.activeProductId
          if (pid && !productsStore.stylePreviews) {
            await productsStore.fetchStylePreviews(pid)
          }
        } else if (step === 'logos') {
          await logosStore.fetchRecentLogos()
        }
      },
      { immediate: true }
    )
  }

  if (options.autoInitializeEffects ?? true) {
    initializeEffects()
  }

  // ===== RETURN =====
  return {
    activeStep,
    currentStep,
    contentKey,
    isPanelOpen,
    logosSubStep,
    productsSubStep,
    textsSubStep,
    rosterSubStep,
    navigationItems,
    handleCategorySelect,
    handleSubcategorySelect,
    togglePanel,
    setPanelOpen,
    initializeEffects
  }
}
