import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCustomizationStore } from '../customization/customization.store'
import type {
  LogosSubStep,
  ProductsSubStep,
  PatternsSubStep,
  TextsSubStep,
  RosterSubStep,
  CanvasSide
} from './workflow.store.types'

export const useWorkflowStore = defineStore('workflowStore', () => {
  // ===== DEPENDENCIES =====
  const customization = useCustomizationStore()

  // ===== STATE =====
  const activeStep = ref<string | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem('activeStep')
      : null
  )

  // Workflow UI state
  const logosSubStep = ref<LogosSubStep>('list')
  const productsSubStep = ref<ProductsSubStep>('category')
  const patternsSubStep = ref<PatternsSubStep>('list')
  const textsSubStep = ref<TextsSubStep>('list')
  const rosterSubStep = ref<RosterSubStep>('list')
  const activePatternGroupName = ref<string | null>(null)

  // Canvas state
  const activeCanvasSide = ref<CanvasSide>('front')
  const canvasZoom = ref<number>(1)

  // Mobile panel state
  const panelOpen = ref<boolean>(true)

  // Preview selection state
  const selectedCategoryId = ref<number | null>(null)
  const selectedSubCategoryId = ref<number | null>(null)

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
    window.localStorage.setItem(
      'workflow.productsSubStep',
      productsSubStep.value
    )
    window.localStorage.setItem(
      'workflow.patternsSubStep',
      patternsSubStep.value
    )
    window.localStorage.setItem('workflow.textsSubStep', textsSubStep.value)
    window.localStorage.setItem('workflow.rosterSubStep', rosterSubStep.value)
    window.localStorage.setItem(
      'workflow.patternsGroupName',
      activePatternGroupName.value || ''
    )
  }

  function loadFromLocalStorage() {
    if (typeof window === 'undefined') return
    try {
      const logos = window.localStorage.getItem('workflow.logosSubStep') as
        | 'list'
        | 'placement'
        | 'edit'
        | null
      const products = window.localStorage.getItem(
        'workflow.productsSubStep'
      ) as 'category' | 'subcategory' | 'product' | null
      const patterns = window.localStorage.getItem(
        'workflow.patternsSubStep'
      ) as 'list' | 'group' | null
      const texts = window.localStorage.getItem('workflow.textsSubStep') as
        | 'list'
        | 'placement'
        | null
      const roster = window.localStorage.getItem('workflow.rosterSubStep') as
        | 'list'
        | 'edit'
        | null
      const group = window.localStorage.getItem('workflow.patternsGroupName')
      if (logos) logosSubStep.value = logos
      if (products) productsSubStep.value = products
      if (patterns) patternsSubStep.value = patterns
      if (texts) textsSubStep.value = texts
      if (roster) rosterSubStep.value = roster
      if (group) activePatternGroupName.value = group
    } catch (_) {}
  }

  // ===== ACTIONS =====
  function setActiveStep(step: string | null) {
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

  function setActivePatternGroup(name: string | null) {
    activePatternGroupName.value = name
    saveSubStepsToLocalStorage()
  }

  // ===== BUSINESS LOGIC =====
  function commitSelectedCategory() {
    if (selectedCategoryId.value != null) {
      void customization.setCategory(selectedCategoryId.value)
      selectedCategoryId.value = null
    }
  }

  function commitSelectedSubCategory() {
    if (selectedSubCategoryId.value != null) {
      void customization.setSubCategory(selectedSubCategoryId.value)
      selectedSubCategoryId.value = null
    }
  }

  function setSelectedCategoryForPreview(categoryId: number | null) {
    selectedCategoryId.value = categoryId
  }

  function setSelectedSubCategoryForPreview(subCategoryId: number | null) {
    selectedSubCategoryId.value = subCategoryId
  }

  // ===== CANVAS ACTIONS =====
  function setActiveCanvasSide(side: CanvasSide) {
    activeCanvasSide.value = side
  }

  function toggleActiveCanvasSide() {
    activeCanvasSide.value =
      activeCanvasSide.value === 'front' ? 'back' : 'front'
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

  // ===== RETURN =====
  return {
    // State
    activeStep,
    logosSubStep,
    productsSubStep,
    patternsSubStep,
    textsSubStep,
    rosterSubStep,
    activePatternGroupName,
    selectedCategoryId,
    selectedSubCategoryId,
    activeCanvasSide,
    canvasZoom,
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
    setActivePatternGroup,
    // Business Logic
    commitSelectedCategory,
    commitSelectedSubCategory,
    setSelectedCategoryForPreview,
    setSelectedSubCategoryForPreview,
    // Canvas Actions
    setActiveCanvasSide,
    toggleActiveCanvasSide,
    setCanvasZoom,
    zoomIn,
    zoomOut,
    // Mobile Panel
    panelOpen,
    setPanelOpen,
    togglePanel
  }
})
