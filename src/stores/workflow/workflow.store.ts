import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCustomizationStore } from '../customization/customization.store'
import { useProductsStore } from '../products/products.store'
import type {
  LogosSubStep,
  ProductsSubStep,
  PatternsSubStep,
  TextsSubStep,
  RosterSubStep,
  CanvasSide,
  CustomizerStep,
  WorkflowRouteStep,
  NavigationItem
} from './workflow.store.types'
import type {
  FooterConfiguration,
  HeaderConfiguration
} from '@/components/customization-workflow/types'
import type { Ref } from 'vue'

// Internal store type that includes refs
type HeaderConfigWithRefs = HeaderConfiguration & {
  _refs?: { search?: Ref<string>; applyOverrides?: Ref<boolean> }
}

export const useWorkflowStore = defineStore('workflowStore', () => {
  // ===== DEPENDENCIES =====
  const customization = useCustomizationStore()
  const productsStore = useProductsStore()

  // ===== STATE =====
  const activeStep = ref<CustomizerStep | null | undefined>(
    typeof window !== 'undefined'
      ? (window.localStorage.getItem('activeStep') as CustomizerStep | null)
      : null
  )

  // Workflow UI state
  const logosSubStep = ref<LogosSubStep>('list')
  const productsSubStep = ref<ProductsSubStep>('category')
  const textsSubStep = ref<TextsSubStep>('list')
  const activeTextId = ref<number | null>(null)
  const activeTextItemIndex = ref<number | null>(null)
  const pendingTextTemplateId = ref<number | null>(null)
  const pendingNumberPreset = ref<string | null>(null)
  const rosterSubStep = ref<RosterSubStep>('list')
  const patternsSubStep = ref<PatternsSubStep>('list')
  const activePatternGroupName = ref<string | null>(null)
  const activeLogoId = ref<string | null>(null)
  const textClipboard = ref<{ style: unknown } | null>(null)

  // Canvas state
  const activeCanvasSide = ref<CanvasSide>('front')
  const canvasZoom = ref<number>(1)

  // Mobile panel state
  const panelOpen = ref<boolean>(true)

  // Header configuration state (with refs for two-way binding)
  const currentHeaderConfig = ref<HeaderConfigWithRefs | null>(null)
  const currentFooterConfig = ref<FooterConfiguration | null>(null)

  // Preview selection state
  const selectedCategoryId = ref<number | null>(null)
  const selectedSubCategoryId = ref<number | null>(null)
  const selectedDesignCategoryId = ref<number | null>(null)

  // ===== COMPUTED PROPERTIES =====
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
        return 'texts'
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

      const categoryIdForTrail = selectedCategoryId.value ?? customization.activeCategoryId ?? null

      const category = productsStore.categories?.data?.find(c => c.id === categoryIdForTrail)

      const subId = selectedSubCategoryId.value ?? customization.activeSubCategoryId ?? null

      if (productsSubStep.value === 'subcategory') {
        return [
          {
            label: 'Category',
            action: () => {
              setProductsSubStep('category')
            }
          },
          { label: category?.category_name || '—' }
        ]
      }

      const hasSubs = !!(category && category.subcategories && category.subcategories.length)

      const trail: NavigationItem[] = [
        {
          label: 'Category',
          action: () => {
            setProductsSubStep('category')
          }
        }
      ]

      const categoryLabel = category?.category_name || '—'

      if (categoryLabel) {
        trail.push({
          label: categoryLabel,
          action: hasSubs
            ? () => {
                setProductsSubStep('subcategory')
              }
            : undefined
        })
      }

      if (hasSubs) {
        const selectedSub =
          subId && category ? category.subcategories?.find(s => s.id === subId) : undefined
        if (selectedSub) {
          trail.push({ label: selectedSub.category_name })
        }
      }

      return trail
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
            setLogosSubStep('list')
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

  // ===== PERSISTENCE =====
  function saveToLocalStorage() {
    if (typeof window === 'undefined') return
    if (activeStep.value) {
      window.localStorage.setItem('activeStep', activeStep.value)
    }
  }

  function saveSubStepsToLocalStorage() {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('workflow.logosSubStep', logosSubStep.value)
    window.localStorage.setItem('workflow.productsSubStep', productsSubStep.value)
    window.localStorage.setItem('workflow.textsSubStep', textsSubStep.value)
    window.localStorage.setItem('workflow.textsActiveId', String(activeTextId.value ?? ''))
    window.localStorage.setItem(
      'workflow.textsActiveItemIndex',
      String(activeTextItemIndex.value ?? '')
    )
    window.localStorage.setItem(
      'workflow.textsPendingTemplate',
      String(pendingTextTemplateId.value ?? '')
    )
    window.localStorage.setItem('workflow.textsPendingPreset', pendingNumberPreset.value ?? '')
    window.localStorage.setItem('workflow.rosterSubStep', rosterSubStep.value)
    window.localStorage.setItem('workflow.patternsSubStep', patternsSubStep.value || '')
    window.localStorage.setItem(
      'workflow.activePatternGroupName',
      activePatternGroupName.value || ''
    )
    window.localStorage.setItem('workflow.activeLogoId', activeLogoId.value || '')
    window.localStorage.setItem('workflow.textClipboard', JSON.stringify(textClipboard.value))
  }

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      const logos = window.localStorage.getItem('workflow.logosSubStep') as
        | 'list'
        | 'placement'
        | 'edit'
        | null
      const products = window.localStorage.getItem('workflow.productsSubStep') as
        | 'category'
        | 'subcategory'
        | 'product'
        | null
      const texts = window.localStorage.getItem('workflow.textsSubStep') as
        | 'list'
        | 'placement'
        | 'edit'
        | 'number-font'
        | null
      const textId = window.localStorage.getItem('workflow.textsActiveId')
      const textIndexLegacy = window.localStorage.getItem('workflow.textsActiveIndex') // Legacy support
      const templateId = window.localStorage.getItem('workflow.textsPendingTemplate')
      const preset = window.localStorage.getItem('workflow.textsPendingPreset')
      const activeItemIndex = window.localStorage.getItem('workflow.textsActiveItemIndex')
      const roster = window.localStorage.getItem('workflow.rosterSubStep') as 'list' | 'edit' | null
      const patterns = window.localStorage.getItem('workflow.patternsSubStep') as
        | 'list'
        | 'edit'
        | null
      const patternGroupName = window.localStorage.getItem('workflow.activePatternGroupName')
      const logoId = window.localStorage.getItem('workflow.activeLogoId')
      if (logos) logosSubStep.value = logos
      if (products) productsSubStep.value = products
      if (texts) textsSubStep.value = texts
      if (textId) activeTextId.value = Number(textId)
      // Legacy: migrate from index to ID if needed
      else if (textIndexLegacy) {
        const index = Number(textIndexLegacy)
        const texts = customization.activeProductTexts
        if (texts[index]?.id) {
          activeTextId.value = texts[index].id
        }
      }
      if (templateId) pendingTextTemplateId.value = Number(templateId)
      if (preset) pendingNumberPreset.value = preset
      if (activeItemIndex) activeTextItemIndex.value = Number(activeItemIndex)
      if (roster) rosterSubStep.value = roster
      if (patterns) patternsSubStep.value = patterns
      if (patternGroupName) activePatternGroupName.value = patternGroupName
      if (logoId) activeLogoId.value = logoId
      const clipboardRaw = window.localStorage.getItem('workflow.textClipboard')
      if (clipboardRaw) {
        try {
          textClipboard.value = JSON.parse(clipboardRaw) as { style: unknown } | null
        } catch (_) {
          textClipboard.value = null
        }
      }
    } catch (_) {}
  }

  // ===== ACTIONS =====
  function setActiveStep(step: CustomizerStep) {
    activeStep.value = step
    saveToLocalStorage()
  }

  function setLogosSubStep(step: LogosSubStep) {
    logosSubStep.value = step
    saveSubStepsToLocalStorage()
  }

  function setProductsSubStep(step: ProductsSubStep) {
    productsSubStep.value = step
    saveSubStepsToLocalStorage()
  }

  function setPatternsSubStep(step: PatternsSubStep) {
    patternsSubStep.value = step
    saveSubStepsToLocalStorage()
  }

  function setTextsSubStep(step: TextsSubStep) {
    textsSubStep.value = step
    saveSubStepsToLocalStorage()
  }

  function setActiveTextId(textId: number | null) {
    activeTextId.value = textId
    saveSubStepsToLocalStorage()
  }

  // Legacy function for backward compatibility
  function setActiveTextIndex(index: number | null) {
    if (index === null) {
      activeTextId.value = null
      return
    }
    const texts = customization.activeProductTexts
    if (texts[index]?.id) {
      activeTextId.value = texts[index].id
    }
    saveSubStepsToLocalStorage()
  }

  function setActiveTextItemIndex(index: number | null) {
    activeTextItemIndex.value = index
    saveSubStepsToLocalStorage()
  }

  function setPendingTextTemplateId(templateId: number | null) {
    pendingTextTemplateId.value = templateId
    saveSubStepsToLocalStorage()
  }

  function setPendingNumberPreset(preset: string | null) {
    pendingNumberPreset.value = preset
    saveSubStepsToLocalStorage()
  }

  function setRosterSubStep(step: RosterSubStep) {
    rosterSubStep.value = step
    saveSubStepsToLocalStorage()
  }

  function setActivePatternSubStep(name: string | null) {
    activePatternGroupName.value = name
    saveSubStepsToLocalStorage()
  }

  function setActiveLogoId(logoId: string | null) {
    activeLogoId.value = logoId
    saveSubStepsToLocalStorage()
  }

  function setTextClipboard(payload: { style: unknown } | null) {
    textClipboard.value = payload
    saveSubStepsToLocalStorage()
  }

  function resetWorkflowSubSteps() {
    logosSubStep.value = 'list'
    productsSubStep.value = 'category'
    textsSubStep.value = 'list'
    rosterSubStep.value = 'list'
    patternsSubStep.value = 'list'
    activePatternGroupName.value = null
    activeLogoId.value = null
    textClipboard.value = null
    activeTextId.value = null
    activeTextItemIndex.value = null
    pendingTextTemplateId.value = null
    pendingNumberPreset.value = null
    activeCanvasSide.value = 'front'
    canvasZoom.value = 1
    panelOpen.value = true
    selectedCategoryId.value = null
    selectedSubCategoryId.value = null
    saveSubStepsToLocalStorage()
  }

  // ===== BUSINESS LOGIC =====
  function commitSelectedCategory() {
    if (selectedCategoryId.value != null) {
      void customization.setCategory(selectedCategoryId.value)
      //selectedCategoryId.value = null
    }
  }

  function commitSelectedSubCategory() {
    if (selectedSubCategoryId.value != null) {
      void customization.setSubCategory(selectedSubCategoryId.value)
      //selectedSubCategoryId.value = null
    }
  }

  function setSelectedCategoryForPreview(categoryId: number | null) {
    selectedCategoryId.value = categoryId
  }

  function setSelectedSubCategoryForPreview(subCategoryId: number | null) {
    selectedSubCategoryId.value = subCategoryId
  }

  function setSelectedDesignCategory(dCategoryId: number | null) {
    selectedDesignCategoryId.value = dCategoryId
  }

  // ===== NAVIGATION ACTIONS =====
  function handleCategorySelect(categoryId: number) {
    console.log('handleCategorySelect from workflow store', categoryId)
    setSelectedCategoryForPreview(categoryId)
    setSelectedSubCategoryForPreview(null)
    const hasSubcategories = !!productsStore.categories?.data?.find(
      c => c.id === categoryId && c.subcategories && c.subcategories.length
    )
    console.log('hasSubcategories', hasSubcategories)
    if (!hasSubcategories) {
      setSelectedSubCategoryForPreview(null)
    }
    setProductsSubStep(hasSubcategories ? 'subcategory' : 'product')
  }

  function handleSubcategorySelect(subcategoryId: number) {
    setSelectedSubCategoryForPreview(subcategoryId)
    setProductsSubStep('product')
  }

  // ===== CANVAS ACTIONS =====
  function setActiveCanvasSide(side: CanvasSide) {
    activeCanvasSide.value = side
  }

  function toggleActiveCanvasSide() {
    activeCanvasSide.value = activeCanvasSide.value === 'front' ? 'back' : 'front'
  }

  function setCanvasZoom(zoom: number) {
    const clamped = Math.max(0.25, Math.min(4, zoom))
    canvasZoom.value = clamped
  }

  function zoomIn(step = 0.3) {
    setCanvasZoom(canvasZoom.value + step)
  }

  function zoomOut(step = 0.3) {
    setCanvasZoom(canvasZoom.value - step)
  }

  // ===== MOBILE PANEL ACTIONS =====
  function setPanelOpen(open: boolean) {
    panelOpen.value = open
  }
  function togglePanel() {
    panelOpen.value = !panelOpen.value
  }

  // ===== HEADER CONFIG ACTIONS =====
  function setCurrentHeaderConfig(config: HeaderConfigWithRefs | null) {
    currentHeaderConfig.value = config
  }
  function setCurrentFooterConfig(config: FooterConfiguration | null) {
    currentFooterConfig.value = config
  }

  function clearHeaderAndFooterConfig() {
    currentHeaderConfig.value = null
    currentFooterConfig.value = null
  }

  // ===== RETURN =====
  return {
    // State
    activeStep,
    logosSubStep,
    productsSubStep,
    textsSubStep,
    activeTextId,
    setActiveTextId,
    // Legacy compatibility
    pendingTextTemplateId,
    activeTextItemIndex,
    pendingNumberPreset,
    textClipboard,
    rosterSubStep,
    patternsSubStep,
    activePatternGroupName,
    activeLogoId,
    selectedCategoryId,
    selectedSubCategoryId,
    selectedDesignCategoryId,
    activeCanvasSide,
    canvasZoom,
    // Computed
    currentStep,
    contentKey,
    isPanelOpen,
    navigationItems,
    // Persistence
    saveToLocalStorage,
    saveSubStepsToLocalStorage,
    loadFromLocalStorage,
    // Actions
    setActiveStep,
    setLogosSubStep,
    setProductsSubStep,
    setPatternsSubStep,
    setTextsSubStep,
    setActiveTextIndex,
    setPendingTextTemplateId,
    setActiveTextItemIndex,
    setPendingNumberPreset,
    setRosterSubStep,
    setActivePatternSubStep,
    setActiveLogoId,
    setTextClipboard,
    resetWorkflowSubSteps,
    // Business Logic
    commitSelectedCategory,
    commitSelectedSubCategory,
    setSelectedCategoryForPreview,
    setSelectedSubCategoryForPreview,
    setSelectedDesignCategory,
    // Navigation Actions
    handleCategorySelect,
    handleSubcategorySelect,
    // Canvas Actions
    setActiveCanvasSide,
    toggleActiveCanvasSide,
    setCanvasZoom,
    zoomIn,
    zoomOut,
    // Mobile Panel
    panelOpen,
    setPanelOpen,
    togglePanel,
    // Header Config
    currentHeaderConfig,
    currentFooterConfig,
    setCurrentHeaderConfig,
    setCurrentFooterConfig,
    clearHeaderAndFooterConfig
  }
})
