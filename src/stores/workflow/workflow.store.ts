import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCustomizationStore } from '../customization/customization.store'
import type {
  LogosSubStep,
  ProductsSubStep,
  PatternsSubStep,
  TextsSubStep,
  RosterSubStep,
  CanvasSide,
  CustomizerStep
} from './workflow.store.types'

export const useWorkflowStore = defineStore('workflowStore', () => {
  // ===== DEPENDENCIES =====
  const customization = useCustomizationStore()

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
  const activeTextIndex = ref<number | null>(null)
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
    window.localStorage.setItem('workflow.productsSubStep', productsSubStep.value)
    window.localStorage.setItem('workflow.textsSubStep', textsSubStep.value)
    window.localStorage.setItem('workflow.textsActiveIndex', String(activeTextIndex.value ?? ''))
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
      const textIndex = window.localStorage.getItem('workflow.textsActiveIndex')
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
      if (textIndex) activeTextIndex.value = Number(textIndex)
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

  function setActiveTextIndex(index: number | null) {
    activeTextIndex.value = index
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
    activeTextIndex.value = null
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

  // ===== RETURN =====
  return {
    // State
    activeStep,
    logosSubStep,
    productsSubStep,
    textsSubStep,
    activeTextIndex,
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
