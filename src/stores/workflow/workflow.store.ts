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

  // Preview selection state
  const selectedCategoryId = ref<number | null>(null)
  const selectedSubCategoryId = ref<number | null>(null)

  function saveStep() {
    if (typeof window === 'undefined') return
    if (activeStep.value)
      window.localStorage.setItem('activeStep', activeStep.value)
  }

  function setActiveStep(step: string | null) {
    activeStep.value = step
    saveStep()
  }

  function setLogosSubStep(step: LogosSubStep) {
    logosSubStep.value = step
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('workflow.logosSubStep', step)
    }
  }

  function setProductsSubStep(step: ProductsSubStep) {
    productsSubStep.value = step
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('workflow.productsSubStep', step)
    }
  }

  function setPatternsSubStep(step: PatternsSubStep) {
    patternsSubStep.value = step
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('workflow.patternsSubStep', step)
    }
  }

  function setTextsSubStep(step: TextsSubStep) {
    textsSubStep.value = step
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('workflow.textsSubStep', step)
    }
  }

  function setRosterSubStep(step: RosterSubStep) {
    rosterSubStep.value = step
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('workflow.rosterSubStep', step)
    }
  }

  function setActivePatternGroup(name: string | null) {
    activePatternGroupName.value = name
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('workflow.patternsGroupName', name || '')
    }
  }

  function loadWorkflowSubStepsFromLocalStorage() {
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

  // Commit preview selections into customization store
  function commitSelectedCategory() {
    const customization = useCustomizationStore()
    if (selectedCategoryId.value != null) {
      customization.setCategory(selectedCategoryId.value)
      selectedCategoryId.value = null
    }
  }

  function commitSelectedSubCategory() {
    const customization = useCustomizationStore()
    if (selectedSubCategoryId.value != null) {
      customization.setSubCategory(selectedSubCategoryId.value)
      selectedSubCategoryId.value = null
    }
  }

  function setSelectedCategoryForPreview(categoryId: number | null) {
    selectedCategoryId.value = categoryId
  }

  function setSelectedSubCategoryForPreview(subCategoryId: number | null) {
    selectedSubCategoryId.value = subCategoryId
  }

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
  function zoomIn(step = 0.1) {
    setCanvasZoom(canvasZoom.value + step)
  }
  function zoomOut(step = 0.1) {
    setCanvasZoom(canvasZoom.value - step)
  }

  return {
    // step
    activeStep,
    setActiveStep,
    // substeps
    logosSubStep,
    productsSubStep,
    patternsSubStep,
    textsSubStep,
    rosterSubStep,
    activePatternGroupName,
    setLogosSubStep,
    setProductsSubStep,
    setPatternsSubStep,
    setTextsSubStep,
    setRosterSubStep,
    setActivePatternGroup,
    loadWorkflowSubStepsFromLocalStorage,
    // preview selection
    selectedCategoryId,
    selectedSubCategoryId,
    setSelectedCategoryForPreview,
    setSelectedSubCategoryForPreview,
    commitSelectedCategory,
    commitSelectedSubCategory,
    // canvas
    activeCanvasSide,
    canvasZoom,
    setActiveCanvasSide,
    toggleActiveCanvasSide,
    setCanvasZoom,
    zoomIn,
    zoomOut
  }
})
