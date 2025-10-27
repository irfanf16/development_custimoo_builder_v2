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
import type { HeaderConfiguration } from '@/components/customization-workflow/types'

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
  const rosterSubStep = ref<RosterSubStep>('list')
  const patternsSubStep = ref<PatternsSubStep>('list')
  const activePatternGroupName = ref<string | null>(null)
  const activeLogoId = ref<string | null>(null)

  // Canvas state
  const activeCanvasSide = ref<CanvasSide>('front')
  const canvasZoom = ref<number>(1)

  // Mobile panel state
  const panelOpen = ref<boolean>(true)

  // Header configuration state
  const currentHeaderConfig = ref<HeaderConfiguration | null>(null)

  // Preview selection state
  const selectedCategoryId = ref<number | null>(null)
  const selectedSubCategoryId = ref<number | null>(null)

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
    window.localStorage.setItem('workflow.rosterSubStep', rosterSubStep.value)
    window.localStorage.setItem('workflow.patternsSubStep', patternsSubStep.value || '')
    window.localStorage.setItem(
      'workflow.activePatternGroupName',
      activePatternGroupName.value || ''
    )
    window.localStorage.setItem('workflow.activeLogoId', activeLogoId.value || '')
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
        | null
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
      if (roster) rosterSubStep.value = roster
      if (patterns) patternsSubStep.value = patterns
      if (patternGroupName) activePatternGroupName.value = patternGroupName
      if (logoId) activeLogoId.value = logoId
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

  // ===== NAVIGATION ACTIONS =====
  function handleCategorySelect(categoryId: number) {
    setSelectedCategoryForPreview(categoryId)
    const hasSubcategories = !!productsStore.categories?.data?.find(
      c => c.id === categoryId && c.subcategories && c.subcategories.length
    )
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
  function setCurrentHeaderConfig(config: HeaderConfiguration | null) {
    currentHeaderConfig.value = config
  }

  function clearHeaderConfig() {
    currentHeaderConfig.value = null
  }

  // ===== RETURN =====
  return {
    // State
    activeStep,
    logosSubStep,
    productsSubStep,
    textsSubStep,
    rosterSubStep,
    patternsSubStep,
    activePatternGroupName,
    activeLogoId,
    selectedCategoryId,
    selectedSubCategoryId,
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
    setRosterSubStep,
    setActivePatternSubStep,
    setActiveLogoId,
    // Business Logic
    commitSelectedCategory,
    commitSelectedSubCategory,
    setSelectedCategoryForPreview,
    setSelectedSubCategoryForPreview,
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
    setCurrentHeaderConfig,
    clearHeaderConfig
  }
})
