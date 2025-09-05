import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ActiveProductCustomization,
  OutputAddon
} from '@/services/products/types'
import { useProductsStore } from './products/products.store'
import { API } from '@/services'

type SelectionKey =
  | 'category_id'
  | 'sub_category_id'
  | 'product_id'
  | 'style_id'
  | 'design_id'
  | 'addons'

type SelectionCommand = {
  key: SelectionKey
  prev: unknown
  next: unknown
  activeStep?: string | null
  timestamp: number
}

type LogosSubStep = 'list' | 'placement' | 'edit'
type ProductsSubStep = 'category' | 'subcategory' | 'product'
type PatternsSubStep = 'list' | 'group'
type CanvasSide = 'front' | 'back'

export const useSelectionStore = defineStore('selectionStore', () => {
  const productsStore = useProductsStore()

  const customization = ref<ActiveProductCustomization | null>(null)
  const activeStep = ref<string | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem('activeStep')
      : null
  )

  const undoStack = ref<SelectionCommand[]>([])
  const redoStack = ref<SelectionCommand[]>([])
  const isApplying = ref(false)

  // Workflow UI state
  const logosSubStep = ref<LogosSubStep>('list')
  const productsSubStep = ref<ProductsSubStep>('category')
  const patternsSubStep = ref<PatternsSubStep>('list')
  const activePatternGroupName = ref<string | null>(null)
  const selectedCustomLogoIdx = ref<number | null>(null)

  // Canvas state
  const activeCanvasSide = ref<CanvasSide>('front')
  const canvasZoom = ref<number>(1)

  // Preview selection state
  const selectedCategoryId = ref<number | null>(null)
  const selectedSubCategoryId = ref<number | null>(null)

  function save() {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      'activeProductCustomization',
      JSON.stringify(customization.value)
    )
    window.localStorage.setItem(
      'selection.undo',
      JSON.stringify(undoStack.value)
    )
    window.localStorage.setItem(
      'selection.redo',
      JSON.stringify(redoStack.value)
    )
    if (activeStep.value)
      window.localStorage.setItem('activeStep', activeStep.value)
  }

  function load(): boolean {
    if (typeof window === 'undefined') return false
    const raw = window.localStorage.getItem('activeProductCustomization')
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        typeof parsed.product_id === 'string' &&
        typeof parsed.style_id === 'number' &&
        typeof parsed.design_id === 'number'
      ) {
        customization.value = parsed as ActiveProductCustomization
        try {
          undoStack.value = JSON.parse(
            window.localStorage.getItem('selection.undo') || '[]'
          )
          redoStack.value = JSON.parse(
            window.localStorage.getItem('selection.redo') || '[]'
          )
        } catch (_) {
          undoStack.value = []
          redoStack.value = []
        }
        return true
      }
    } catch (_) {}
    return false
  }

  function pushCommand(cmd: SelectionCommand) {
    undoStack.value.push(cmd)
    redoStack.value = []
    save()
  }

  function setActiveStep(step: string | null) {
    activeStep.value = step
    save()
  }

  async function setCategory(
    categoryId: number,
    meta?: { activeStep?: string }
  ) {
    if (!customization.value) return
    const prev = customization.value.category_id
    if (prev === categoryId) return
    customization.value.category_id = categoryId
    if (meta?.activeStep) setActiveStep(meta.activeStep)
    pushCommand({
      key: 'category_id',
      prev,
      next: categoryId,
      activeStep: activeStep.value,
      timestamp: Date.now()
    })
    // optional: preload product previews for this category
    await API.products.getProductPreviewsByCategory(categoryId)
    save()
  }

  async function setProduct(productId: number, meta?: { activeStep?: string }) {
    if (!customization.value) return
    const prev = customization.value.product_id
    const next = String(productId)
    if (prev === next) return
    customization.value.product_id = next
    customization.value.style_id = 0
    customization.value.design_id = 0
    if (meta?.activeStep) setActiveStep(meta.activeStep)
    pushCommand({
      key: 'product_id',
      prev,
      next,
      activeStep: activeStep.value,
      timestamp: Date.now()
    })
    const resp = await API.products.getActiveProductDetails(productId)
    if ('data' in resp && resp.data) {
      const details = resp.data
      productsStore.activeProductDetails = details.productDetails
      productsStore.activeStyleDetails = details.styleDetails
      productsStore.activeDesignDetails = details.designDetails
    }
    save()
  }

  async function setSubCategory(
    subCategoryId: number,
    meta?: { activeStep?: string }
  ) {
    if (!customization.value) return
    const prev = customization.value.sub_category_id
    if (prev === subCategoryId) return
    customization.value.sub_category_id = subCategoryId
    if (meta?.activeStep) setActiveStep(meta.activeStep)
    pushCommand({
      key: 'sub_category_id',
      prev,
      next: subCategoryId,
      activeStep: activeStep.value,
      timestamp: Date.now()
    })
    // Optionally preload product previews for this subcategory
    try {
      await API.products.getProductPreviewsByCategory(subCategoryId)
    } catch (_) {}
    save()
  }

  async function setStyle(styleId: number, meta?: { activeStep?: string }) {
    if (!customization.value) return
    const prev = customization.value.style_id
    if (prev === styleId) return
    customization.value.style_id = styleId
    customization.value.design_id = 0
    if (meta?.activeStep) setActiveStep(meta.activeStep)
    pushCommand({
      key: 'style_id',
      prev,
      next: styleId,
      activeStep: activeStep.value,
      timestamp: Date.now()
    })
    const resp = await API.products.getActiveStyleDetails(styleId)
    if ('data' in resp) {
      const { productstyle, productdesign } = resp.data as any
      productsStore.activeStyleDetails = productstyle
      productsStore.activeDesignDetails = productdesign
    }
    save()
  }

  async function setDesign(designId: number, meta?: { activeStep?: string }) {
    if (!customization.value) return
    const prev = customization.value.design_id
    if (prev === designId) return
    customization.value.design_id = designId
    if (meta?.activeStep) setActiveStep(meta.activeStep)
    pushCommand({
      key: 'design_id',
      prev,
      next: designId,
      activeStep: activeStep.value,
      timestamp: Date.now()
    })
    const resp = await API.products.getDesignDetailsById(designId)
    if ('data' in resp) {
      productsStore.activeDesignDetails = resp.data
    }
    save()
  }

  async function setAddons(
    addons: OutputAddon[],
    meta?: { activeStep?: string }
  ) {
    if (!customization.value) return
    const key = customization.value.product_id
    const prev = customization.value.addons_info?.[key]?.simple_addons ?? []
    if (!customization.value.addons_info)
      customization.value.addons_info = {} as any
    customization.value.addons_info[key] = {
      grouped_addons: {},
      ungrouped_addons: [],
      simple_addons: addons.map(a => a.addon_id)
    }
    if (meta?.activeStep) setActiveStep(meta.activeStep)
    pushCommand({
      key: 'addons',
      prev,
      next: customization.value.addons_info[key].simple_addons,
      activeStep: activeStep.value,
      timestamp: Date.now()
    })
    save()
  }

  function applyCommand(cmd: SelectionCommand) {
    switch (cmd.key) {
      case 'category_id':
        customization.value!.category_id = cmd.next as number
        break
      case 'sub_category_id':
        customization.value!.sub_category_id = cmd.next as number
        break
      case 'product_id':
        customization.value!.product_id = cmd.next as string
        break
      case 'style_id':
        customization.value!.style_id = cmd.next as number
        break
      case 'design_id':
        customization.value!.design_id = cmd.next as number
        break
      case 'addons': {
        const key = customization.value!.product_id
        if (!customization.value!.addons_info)
          customization.value!.addons_info = {} as any
        customization.value!.addons_info[key] = {
          grouped_addons: {},
          ungrouped_addons: [],
          simple_addons: cmd.next as number[]
        }
        break
      }
    }
  }

  async function undo() {
    if (isApplying.value || !undoStack.value.length || !customization.value)
      return
    const cmd = undoStack.value.pop()!
    const inverse: SelectionCommand = { ...cmd, prev: cmd.next, next: cmd.prev }
    redoStack.value.push(cmd)
    isApplying.value = true
    applyCommand(inverse)
    isApplying.value = false
    save()
  }

  async function redo() {
    if (isApplying.value || !redoStack.value.length || !customization.value)
      return
    const cmd = redoStack.value.pop()!
    undoStack.value.push(cmd)
    isApplying.value = true
    applyCommand(cmd)
    isApplying.value = false
    save()
  }

  function setCustomization(initial: ActiveProductCustomization) {
    customization.value = initial
    save()
  }

  // Computed properties for active selections
  const activeProductId = computed(() =>
    customization.value ? Number(customization.value.product_id) : null
  )
  const activeStyleId = computed(() => customization.value?.style_id ?? null)
  const activeDesignId = computed(() => customization.value?.design_id ?? null)
  const activeCategoryId = computed(
    () => customization.value?.category_id ?? null
  )
  const activeSubCategoryId = computed(
    () => customization.value?.sub_category_id ?? null
  )
  const effectiveCategoryId = computed<number | null>(() => {
    return (
      selectedCategoryId.value ??
      activeSubCategoryId.value ??
      activeCategoryId.value ??
      null
    )
  })

  const effectiveStyleDetails = computed((): any => {
    if (!customization.value?.style_id || !productsStore.activeStyleDetails) {
      return productsStore.activeStyleDetails
    }
    if (customization.value.style_id === productsStore.activeStyleDetails.id) {
      return productsStore.activeStyleDetails
    }
    return productsStore.activeStyleDetails
  })

  const effectiveDesignDetails = computed((): any => {
    if (!customization.value?.design_id || !productsStore.activeDesignDetails) {
      return productsStore.activeDesignDetails
    }
    if (
      customization.value.design_id === productsStore.activeDesignDetails.id
    ) {
      return productsStore.activeDesignDetails
    }
    return productsStore.activeDesignDetails
  })

  // Workflow sub-step management
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
      const group = window.localStorage.getItem('workflow.patternsGroupName')
      if (logos) logosSubStep.value = logos
      if (products) productsSubStep.value = products
      if (patterns) patternsSubStep.value = patterns
      if (group) activePatternGroupName.value = group
    } catch (_) {}
  }

  // Preview selection management
  function setSelectedCategoryForPreview(categoryId: number | null) {
    selectedCategoryId.value = categoryId
  }

  function setSelectedSubCategoryForPreview(subCategoryId: number | null) {
    selectedSubCategoryId.value = subCategoryId
  }

  function commitSelectedCategory() {
    if (selectedCategoryId.value != null) {
      setCategory(selectedCategoryId.value)
      selectedCategoryId.value = null
    }
  }

  function commitSelectedSubCategory() {
    if (selectedSubCategoryId.value != null) {
      setSubCategory(selectedSubCategoryId.value)
      selectedSubCategoryId.value = null
    }
  }

  // Canvas management
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

  // Logo management
  function setSelectedCustomLogoIndex(idx: number | null) {
    selectedCustomLogoIdx.value = idx
  }

  // Customization management
  function ensureCustomization() {
    if (customization.value) return
    resetCustomizationToDefaults()
  }

  function resetCustomizationToDefaults() {
    setCustomization({
      fixed_logo_index: 0,
      category_index: 0,
      category_id: 0,
      design_index: 0,
      design_id: 0,
      product_index: 0,
      product_id: '0',
      search_products: '',
      style_index: 0,
      style_id: 0,
      page_no: 1,
      customized: true,
      personalized: false,
      private_product: false,
      product_custom_texts: {},
      custom_logos: {},
      default_colors: [
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null }
      ],
      group_colors: {},
      logo_colors: [],
      roster_detail: [],
      products_rosters: {},
      shuffle_color_number: 0,
      addons_info: {},
      group_patterns: {},
      sub_category_id: null,
      sub_category_index: null
    } as ActiveProductCustomization)
  }

  function resetCustomizationToCurrentProductDefaults() {
    if (!productsStore.activeProductDetails) return
    const productId = (productsStore.activeProductDetails as any)?.id ?? 0
    const styleId = (productsStore.activeStyleDetails as any)?.id ?? 0
    const designId = (productsStore.activeDesignDetails as any)?.id ?? 0
    setCustomization({
      fixed_logo_index: 0,
      category_index: 0,
      category_id: customization.value?.category_id ?? 0,
      design_index: 0,
      design_id: designId,
      product_index: 0,
      product_id: String(productId),
      search_products: '',
      style_index: 0,
      style_id: styleId,
      page_no: 1,
      customized: true,
      personalized: false,
      private_product: false,
      product_custom_texts: {},
      custom_logos: {},
      default_colors: [
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null },
        { color: null, pantone: null, name: null }
      ],
      group_colors: {},
      logo_colors: [],
      roster_detail: [],
      products_rosters: {},
      shuffle_color_number: 0,
      addons_info: {},
      group_patterns: {},
      sub_category_id: null,
      sub_category_index: null
    } as ActiveProductCustomization)
  }

  return {
    // Core state
    customization,
    activeStep,
    undoStack,
    redoStack,

    // Workflow UI state
    logosSubStep,
    productsSubStep,
    patternsSubStep,
    activePatternGroupName,
    selectedCustomLogoIdx,

    // Canvas state
    activeCanvasSide,
    canvasZoom,

    // Preview selection state
    selectedCategoryId,
    selectedSubCategoryId,

    // Computed properties
    activeProductId,
    activeStyleId,
    activeDesignId,
    activeCategoryId,
    activeSubCategoryId,
    effectiveCategoryId,
    effectiveStyleDetails,
    effectiveDesignDetails,

    // Core methods
    load,
    save,
    setActiveStep,
    setCustomization,
    setCategory,
    setSubCategory,
    setProduct,
    setStyle,
    setDesign,
    setAddons,
    undo,
    redo,

    // Workflow sub-step methods
    setLogosSubStep,
    setProductsSubStep,
    setPatternsSubStep,
    setActivePatternGroup,
    loadWorkflowSubStepsFromLocalStorage,

    // Preview selection methods
    setSelectedCategoryForPreview,
    setSelectedSubCategoryForPreview,
    commitSelectedCategory,
    commitSelectedSubCategory,

    // Canvas methods
    setActiveCanvasSide,
    toggleActiveCanvasSide,
    setCanvasZoom,
    zoomIn,
    zoomOut,

    // Logo methods
    setSelectedCustomLogoIndex,

    // Customization management
    ensureCustomization,
    resetCustomizationToDefaults,
    resetCustomizationToCurrentProductDefaults
  }
})
