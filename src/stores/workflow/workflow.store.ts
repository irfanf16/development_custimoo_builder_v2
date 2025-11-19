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
import {
  buildColorsBreadcrumbs,
  buildDesignBreadcrumbs,
  buildLogoBreadcrumbs,
  buildProductBreadcrumbs,
  buildTextsBreadcrumbs
} from '@/components/customization-workflow/breadcrumbs'
import { useProfileStore } from '@/stores/profile/profile.store'
import type { Ref } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'

// Internal store type that includes refs
type HeaderConfigWithRefs = HeaderConfiguration & {
  _refs?: { search?: Ref<string>; applyOverrides?: Ref<boolean> }
}

export const useWorkflowStore = defineStore('workflowStore', () => {
  // ===== DEPENDENCIES =====
  const customization = useCustomizationStore()
  const productsStore = useProductsStore()
  const { getItemRaw, setItemRaw } = useLocalStorage()
  const profileStore = useProfileStore()

  // ===== STATE =====
  // Initialize to null - will be loaded from localStorage after company is fetched
  const activeStep = ref<CustomizerStep | null | undefined>(null)

  // Workflow UI state
  const logosSubStep = ref<LogosSubStep>('list')
  const productsSubStep = ref<ProductsSubStep>('category')
  const textsSubStep = ref<TextsSubStep>('list')
  const activeTextId = ref<number | null>(null)
  const activeTextItemIndex = ref<number | null>(null)
  const pendingTextTemplateId = ref<number | null>(null)
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

    const locale = profileStore.currentLocale

    if (step === 'product') {
      return buildProductBreadcrumbs({
        hasCategories: !!productsStore.categories?.data?.length,
        productsSubStep: productsSubStep.value,
        categories: productsStore.categories?.data,
        selectedCategoryId: selectedCategoryId.value,
        activeCategoryId: customization.activeCategoryId,
        selectedSubCategoryId: selectedSubCategoryId.value,
        activeSubCategoryId: customization.activeSubCategoryId,
        onCategoryStep: () => {
          setProductsSubStep('category')
        },
        onSubCategoryStep: () => {
          setProductsSubStep('subcategory')
        },
        locale
      })
    }

    if (step === 'designs') {
      return buildDesignBreadcrumbs(locale)
    }

    if (step === 'styles') {
      const title = productsStore.activeProductDetails?.display_name || 'Styles'
      return [{ label: title }]
    }

    if (step === 'logos') {
      return buildLogoBreadcrumbs({
        logosSubStep: logosSubStep.value,
        hasActiveLogo: !!activeLogoId.value,
        onBackToList: () => {
          setLogosSubStep('list')
        },
        locale
      })
    }

    if (step === 'colors') {
      return buildColorsBreadcrumbs(locale)
    }

    if (step === 'patterns') {
      return [{ label: 'Pattern' }]
    }

    if (step === 'texts') {
      const activeText =
        activeTextId.value != null
          ? customization.activeProductTexts.find(text => text.id === activeTextId.value)
          : null

      return buildTextsBreadcrumbs({
        textsSubStep: textsSubStep.value,
        activeTextMeta: activeText
          ? { value: activeText.value, label: activeText.label }
          : undefined,
        onBackToList: () => {
          setTextsSubStep('list')
        },
        locale
      })
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
    if (activeStep.value) {
      setItemRaw('activeStep', activeStep.value)
    }
  }

  function saveSubStepsToLocalStorage() {
    setItemRaw('workflow.logosSubStep', logosSubStep.value)
    setItemRaw('workflow.productsSubStep', productsSubStep.value)
    setItemRaw('workflow.textsSubStep', textsSubStep.value)
    setItemRaw('workflow.textsActiveId', String(activeTextId.value ?? ''))
    setItemRaw('workflow.textsActiveItemIndex', String(activeTextItemIndex.value ?? ''))
    setItemRaw('workflow.textsPendingTemplate', String(pendingTextTemplateId.value ?? ''))
    setItemRaw('workflow.rosterSubStep', rosterSubStep.value)
    setItemRaw('workflow.patternsSubStep', patternsSubStep.value || '')
    setItemRaw('workflow.activePatternGroupName', activePatternGroupName.value || '')
    setItemRaw('workflow.activeLogoId', activeLogoId.value || '')
    // Note: textClipboard is not persisted - it's runtime-only
  }

  function loadFromLocalStorage() {
    try {
      // Load activeStep first (this is the main workflow step)
      const storedActiveStep = getItemRaw('activeStep') as CustomizerStep | null
      if (storedActiveStep) {
        activeStep.value = storedActiveStep
      }

      // Load all sub-steps
      const logos = getItemRaw('workflow.logosSubStep') as 'list' | 'placement' | 'edit' | null
      const products = getItemRaw('workflow.productsSubStep') as
        | 'category'
        | 'subcategory'
        | 'product'
        | null
      const texts = getItemRaw('workflow.textsSubStep') as
        | 'list'
        | 'placement'
        | 'edit'
        | 'number-font'
        | null
      const textId = window.localStorage.getItem('workflow.textsActiveId')
      const textIndexLegacy = getItemRaw('workflow.textsActiveIndex') // Legacy support
      const templateId = getItemRaw('workflow.textsPendingTemplate')
      const roster = getItemRaw('workflow.rosterSubStep') as 'list' | 'edit' | null
      const patterns = getItemRaw('workflow.patternsSubStep') as 'list' | 'edit' | null
      const patternGroupName = getItemRaw('workflow.activePatternGroupName')
      const logoId = getItemRaw('workflow.activeLogoId')
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
      if (roster) rosterSubStep.value = roster
      if (patterns) patternsSubStep.value = patterns
      if (patternGroupName) activePatternGroupName.value = patternGroupName
      if (logoId) activeLogoId.value = logoId
      // Note: textClipboard is not loaded from localStorage - it's runtime-only
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
    // Note: textClipboard is not persisted to localStorage - it's runtime-only
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
