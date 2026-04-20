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
import type { APCustomizationGroupColor } from '@/services/products/types'
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
  const activeStep = ref<CustomizerStep | null>(null)

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
  /** Logo whose palette was applied to the design ("Apply colors"). */
  const activeLogoId = ref<string | null>(null)
  /**
   * Index in `customization.custom_logos[productKey]` for the row whose palette was applied.
   * Required when multiple placements share the same customer `logo.id` (replicated logo).
   */
  const logoApplySourceIndex = ref<number | null>(null)
  /** Logo currently open in the editor (list / summary / canvas); must not imply Apply. */
  const logoEditorLogoId = ref<string | null>(null)
  const activeLogoIndex = ref<number | null>(null)
  /**
   * Runtime only (not persisted): after list swatch click, LogoEdit opens this swatch in Logos Color.
   */
  const pendingOpenLogosColorSwatchIndex = ref<number | null>(null)
  const textClipboard = ref<{ style: unknown } | null>(null)
  const activeColorAccordionIndex = ref<number | null>(null)
  /** Active SVG group ID for color selection (set when opening color editor from canvas part double-click). */
  const activeColorGroupId = ref<string | number | null>(null)
  /** Snapshot of group_colors before applying logo colors (for "Use original colors"). */
  const groupColorsBeforeLogoApply = ref<Record<string, APCustomizationGroupColor> | null>(null)
  /** Source of current default_colors: from logo apply or from "Shuffle design colors". */
  const defaultColorsSource = ref<'logo' | 'design' | null>(null)

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
  /** Set when user selects a product and we navigate to designs before load completes. */
  const pendingProductId = ref<number | null>(null)

  const pendingProductPreviewPipeline = ref(false)
  /** Set while applying a design (fetch + sync) so UI can show loading and block double-select. */
  const pendingDesignId = ref<number | null>(null)

  // ===== COMPUTED PROPERTIES =====
  const currentStep = computed<WorkflowRouteStep>(() => {
    const step = activeStep.value
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
        return 'roster'
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
        hasActiveLogo: !!logoEditorLogoId.value,
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

      const hasMultipleItems = (activeText?.items?.length ?? 0) > 1
      const activeItemLabel =
        textsSubStep.value === 'single' && hasMultipleItems
          ? (() => {
              const idx = activeText!.active_item_index ?? 0
              const item = activeText!.items?.[idx]
              const label = item && 'label' in item && item.label ? item.label : null
              if (label?.trim()) return label
              return `Placement ${idx + 1}`
            })()
          : null

      return buildTextsBreadcrumbs({
        textsSubStep: textsSubStep.value,
        activeTextMeta: activeText
          ? { value: activeText.value, label: activeText.label }
          : undefined,
        activeItemLabel: activeItemLabel ?? null,
        onBackToList: () => setTextsSubStep('list'),
        onBackToMultipleItems: hasMultipleItems
          ? () => setTextsSubStep('multipleitems')
          : undefined,
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
    setItemRaw('workflow.logoApplySourceIndex', String(logoApplySourceIndex.value ?? ''))
    setItemRaw('workflow.logoEditorLogoId', logoEditorLogoId.value || '')
    setItemRaw('workflow.activeLogoIndex', String(activeLogoIndex.value ?? ''))
    setItemRaw('workflow.activeColorAccordionIndex', String(activeColorAccordionIndex.value ?? ''))
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
      const textsRaw = getItemRaw('workflow.textsSubStep')
      const textsMigrated: TextsSubStep | null = textsRaw
        ? textsRaw === 'edit'
          ? 'single'
          : textsRaw === 'number-font'
            ? 'multipleitems'
            : ['list', 'placement', 'single', 'multipleitems'].includes(textsRaw)
              ? (textsRaw as TextsSubStep)
              : null
        : null
      const textId = window.localStorage.getItem('workflow.textsActiveId')
      const textItemIndex = getItemRaw('workflow.textsActiveItemIndex')
      const textIndexLegacy = getItemRaw('workflow.textsActiveIndex') // Legacy support
      const templateId = getItemRaw('workflow.textsPendingTemplate')
      const roster = getItemRaw('workflow.rosterSubStep') as 'list' | 'edit' | null
      const patterns = getItemRaw('workflow.patternsSubStep') as 'list' | 'edit' | null
      const patternGroupName = getItemRaw('workflow.activePatternGroupName')
      const logoId = getItemRaw('workflow.activeLogoId')
      const logoApplyIdxRaw = getItemRaw('workflow.logoApplySourceIndex')
      const logoEditorId = getItemRaw('workflow.logoEditorLogoId')
      const logoIndex = getItemRaw('workflow.activeLogoIndex')
      const colorAccordionIndex = getItemRaw('workflow.activeColorAccordionIndex')
      if (logos) logosSubStep.value = logos
      if (products) productsSubStep.value = products
      if (textsMigrated) textsSubStep.value = textsMigrated
      if (textId) activeTextId.value = Number(textId)
      // Legacy: migrate from index to ID if needed
      else if (textIndexLegacy) {
        const index = Number(textIndexLegacy)
        const texts = customization.activeProductTexts
        if (texts[index]?.id) {
          activeTextId.value = texts[index].id
        }
      }
      if (textItemIndex !== undefined && textItemIndex !== null && textItemIndex !== '') {
        const num = Number(textItemIndex)
        if (!Number.isNaN(num)) activeTextItemIndex.value = num
      }
      if (templateId) pendingTextTemplateId.value = Number(templateId)
      if (roster) rosterSubStep.value = roster
      if (patterns) patternsSubStep.value = patterns
      if (patternGroupName) activePatternGroupName.value = patternGroupName
      if (logoId) activeLogoId.value = logoId
      if (logoApplyIdxRaw !== undefined && logoApplyIdxRaw !== null && logoApplyIdxRaw !== '') {
        const n = Number(logoApplyIdxRaw)
        if (!Number.isNaN(n)) logoApplySourceIndex.value = n
      }
      if (logoEditorId) {
        logoEditorLogoId.value = logoEditorId
      } else if (logos === 'edit' && logoId) {
        // Legacy: activeLogoId used to double as the open-editor selection
        logoEditorLogoId.value = logoId
      }
      if (logoIndex) activeLogoIndex.value = Number(logoIndex)
      if (colorAccordionIndex) activeColorAccordionIndex.value = Number(colorAccordionIndex)
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
    if (step === 'list') {
      pendingOpenLogosColorSwatchIndex.value = null
      logoEditorLogoId.value = null
      activeLogoIndex.value = null
    }
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

  /**
   * FROM CUSTOMIZER - Open text editor (e.g. when user selects a text on canvas).
   * Binds itemIndex to the text entry's active_item_index in the customization store so the rest of the app uses the same variable.
   * @param textId - Text ID (required for identification)
   * @param itemIndex - Item index in text.items array
   */
  function openTextEditorFromCustomizer(textId: number, itemIndex: number) {
    const prodId = customization.activeProductId
    if (prodId != null && customization.customization?.product_custom_texts) {
      const key = String(prodId)
      const texts = customization.customization.product_custom_texts[key]
      const entry = texts?.find((e: { id: number }) => e.id === textId)
      if (entry) entry.active_item_index = itemIndex
    }
    setActiveStep('texts')
    setActiveTextId(textId)
    setTextsSubStep('single')
    setActiveTextItemIndex(itemIndex)
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
    if (logoId === null) {
      logoApplySourceIndex.value = null
    }
    saveSubStepsToLocalStorage()
  }

  /** Sets which custom_logos row had its palette applied (with matching customer logo id). */
  function setAppliedLogoColorsSource(logoId: string, customLogosArrayIndex: number) {
    activeLogoId.value = logoId
    logoApplySourceIndex.value = customLogosArrayIndex
    saveSubStepsToLocalStorage()
  }

  /** After removing custom_logos[i], shift the stored apply index if needed. */
  function adjustLogoApplySourceIndexAfterRemoval(removedIndex: number) {
    const cur = logoApplySourceIndex.value
    if (cur === null || removedIndex > cur) return
    if (removedIndex < cur) {
      logoApplySourceIndex.value = cur - 1
      saveSubStepsToLocalStorage()
    }
  }

  function setLogoEditorLogoId(logoId: string | null) {
    logoEditorLogoId.value = logoId
    saveSubStepsToLocalStorage()
  }

  function setDefaultColorsSource(source: 'logo' | 'design' | null) {
    defaultColorsSource.value = source
  }

  function setActiveLogoIndex(logoIndex: number | null) {
    activeLogoIndex.value = logoIndex
    saveSubStepsToLocalStorage()
  }

  /** List: user clicked a detected color — open logo edit with Logos Color accordion for that swatch. */
  function openLogoEditorWithLogosColor(logoId: string, logoIndex: number, swatchIndex: number) {
    pendingOpenLogosColorSwatchIndex.value = swatchIndex
    logoEditorLogoId.value = logoId
    activeLogoIndex.value = logoIndex
    setLogosSubStep('edit')
  }

  function consumePendingOpenLogosColorSwatchIndex(): number | null {
    const v = pendingOpenLogosColorSwatchIndex.value
    pendingOpenLogosColorSwatchIndex.value = null
    return v
  }

  function clearPendingOpenLogosColorSwatchIndex() {
    pendingOpenLogosColorSwatchIndex.value = null
  }

  /**
   * FROM CUSTOMIZER - Open logo editor (e.g. when user selects a logo on canvas).
   * @param logoId - Logo ID (optional, use index if not available)
   * @param logoIndex - Logo index in custom_logos array
   */
  function openLogoEditorFromCustomizer(logoIndex?: number, logoId?: number) {
    setActiveStep('logos')
    logoEditorLogoId.value = logoId != null ? String(logoId) : null
    setActiveLogoIndex(logoIndex ?? null)
    setLogosSubStep('edit')
  }

  function setActiveColorAccordionIndex(index: number | null) {
    activeColorAccordionIndex.value = index
    saveSubStepsToLocalStorage()
  }

  /**
   * FROM CUSTOMIZER - Open color editor (e.g. when user double-clicks a design part on canvas).
   * @param groupId - SVG group ID (used as key in selectedGradientIndex)
   * @param accordionIndex - Index in effectiveSvgGroupsInteractive (0-based, or null for palette)
   */
  function openColorEditorFromCustomizer(
    groupId: string | number,
    accordionIndex: number | null = null
  ) {
    setActiveStep('colors')
    setActiveColorAccordionIndex(accordionIndex! + 1)
    activeColorGroupId.value = groupId
  }

  function setGroupColorsBeforeLogoApply(data: Record<string, APCustomizationGroupColor>) {
    groupColorsBeforeLogoApply.value = JSON.parse(JSON.stringify(data)) as Record<
      string,
      APCustomizationGroupColor
    >
  }

  function getAndClearGroupColorsBeforeLogoApply(): Record<
    string,
    APCustomizationGroupColor
  > | null {
    const snapshot = groupColorsBeforeLogoApply.value
    groupColorsBeforeLogoApply.value = null
    return snapshot
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
    logoApplySourceIndex.value = null
    logoEditorLogoId.value = null
    activeLogoIndex.value = null
    pendingOpenLogosColorSwatchIndex.value = null
    activeColorAccordionIndex.value = null
    activeColorGroupId.value = null
    textClipboard.value = null
    activeTextId.value = null
    activeTextItemIndex.value = null
    pendingTextTemplateId.value = null
    activeCanvasSide.value = 'front'
    canvasZoom.value = 1
    panelOpen.value = true
    selectedCategoryId.value = null
    selectedSubCategoryId.value = null
    pendingDesignId.value = null
    pendingProductPreviewPipeline.value = false
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

  function setPendingProductId(id: number | null) {
    pendingProductId.value = id
  }

  function setPendingDesignId(id: number | null) {
    pendingDesignId.value = id
  }

  function setPendingProductPreviewPipeline(pending: boolean) {
    pendingProductPreviewPipeline.value = pending
  }

  // ===== NAVIGATION ACTIONS =====
  function handleCategorySelect(categoryId: number) {
    setSelectedCategoryForPreview(categoryId)
    setSelectedSubCategoryForPreview(null)
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
  function resetWorkFlowStore() {
    activeStep.value = null
    resetWorkflowSubSteps()
    selectedCategoryId.value = null
    selectedSubCategoryId.value = null
    selectedDesignCategoryId.value = null
    pendingProductId.value = null
    pendingDesignId.value = null
    pendingProductPreviewPipeline.value = false
    clearHeaderAndFooterConfig()
    activeLogoId.value = null
    logoApplySourceIndex.value = null
    activeLogoIndex.value = null
    activeColorAccordionIndex.value = null
    activeColorGroupId.value = null
    textClipboard.value = null
    activeTextId.value = null
    activeTextItemIndex.value = null
    pendingTextTemplateId.value = null
    activeCanvasSide.value = 'front'
    canvasZoom.value = 1
    panelOpen.value = true
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
    logoApplySourceIndex,
    logoEditorLogoId,
    activeLogoIndex,
    activeColorAccordionIndex,
    activeColorGroupId,
    selectedCategoryId,
    selectedSubCategoryId,
    selectedDesignCategoryId,
    pendingProductId,
    setPendingProductId,
    pendingProductPreviewPipeline,
    setPendingProductPreviewPipeline,
    pendingDesignId,
    setPendingDesignId,
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
    openTextEditorFromCustomizer,
    setRosterSubStep,
    setActivePatternSubStep,
    setActiveLogoId,
    setAppliedLogoColorsSource,
    adjustLogoApplySourceIndexAfterRemoval,
    setLogoEditorLogoId,
    setActiveLogoIndex,
    openLogoEditorWithLogosColor,
    consumePendingOpenLogosColorSwatchIndex,
    clearPendingOpenLogosColorSwatchIndex,
    openLogoEditorFromCustomizer,
    setActiveColorAccordionIndex,
    openColorEditorFromCustomizer,
    setGroupColorsBeforeLogoApply,
    getAndClearGroupColorsBeforeLogoApply,
    defaultColorsSource,
    setDefaultColorsSource,
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
    clearHeaderAndFooterConfig,
    resetWorkFlowStore
  }
})
