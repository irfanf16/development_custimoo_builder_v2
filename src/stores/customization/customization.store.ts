import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ActiveProductCustomization,
  OutputAddon,
  OutputColor,
  OutputDesignDetails,
  OutputDesignPreviewFront,
  OutputDesignPreviewBack,
  OutputProductLogosSetting,
  OutputProductText,
  OutputProductTextItem,
  GradientColor,
  APCustomizationRosterEntry,
  APCustomizationDefaultColor
} from '@/services/products/types'
import { API } from '@/services'
import { useProductsStore } from '../products/products.store'
import type { CustomLogo, LogoColor } from '@/services/logos/types'
import { useLocalStorage } from '@/composables/useLocalStorage'

export const useCustomizationStore = defineStore('customizationStore', () => {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const { getItem, setItem, removeItem } = useLocalStorage()

  // ===== STATE =====
  const customization = ref<ActiveProductCustomization | null>(null)

  // ===== COMPUTED =====
  const activeProductId = computed(() =>
    customization.value ? Number(customization.value.product_id) : null
  )
  const activeStyleId = computed(() => customization.value?.style_id ?? null)
  const activeDesignId = computed(() => customization.value?.design_id ?? null)
  const activeDesignName = computed(() => customization.value?.design_name ?? null)
  const activeCategoryId = computed(() => customization.value?.category_id ?? null)
  const activeSubCategoryId = computed(() => customization.value?.sub_category_id ?? null)
  const activeProductTexts = computed(() => {
    const prodId = customization.value?.product_id
    if (!prodId) return []
    const key = String(prodId)
    return customization.value?.product_custom_texts?.[key] ?? []
  })
  const reorderData = ref<{ orderItemId: number | null; factoryProductId: string | null }>({
    orderItemId: null,
    factoryProductId: null
  })

  const rosterEntries = computed(() => {
    const prodId = customization.value?.product_id
    if (!prodId) return []
    const key = String(prodId)
    if (!customization.value?.products_rosters[key]) return []
    return customization.value.products_rosters[key]
  })

  const selectedRosterPreviewIndex = computed(() => {
    const prodId = customization.value?.product_id
    if (!prodId) return null
    const key = String(prodId)
    const selection = customization.value?.roster_preview_selection?.[key]
    return typeof selection === 'number' && selection >= 0 ? selection : null
  })

  const ensureTextEntry = (productId: number, index: number, seed?: OutputProductText) => {
    const root = customization.value
    if (!root) return null
    const key = String(productId)
    if (!root.product_custom_texts[key]) root.product_custom_texts[key] = []
    const bucket = root.product_custom_texts[key]
    if (!bucket[index]) {
      bucket[index] =
        seed ??
        ({
          id: 0,
          product_id: productId,
          type: 'name',
          label: 'Custom text',
          placeholder: '',
          following_products: [],
          items: [],
          created_at: null,
          updated_at: null,
          deleted_at: null,
          value: '',
          manually_added: true,
          font_family: '',
          following_product_ids: [],
          active_item_index: 0
        } as OutputProductText)
    }
    return bucket[index]
  }

  const upsertTextEntry = (
    productId: number,
    index: number,
    payload: Partial<OutputProductText>
  ) => {
    const entry = ensureTextEntry(productId, index)
    if (!entry) return
    Object.assign(entry, payload)
    saveToLocalStorage()
  }

  const removeTextEntry = (productId: number, index: number) => {
    const root = customization.value
    if (!root) return
    const key = String(productId)
    const bucket = root.product_custom_texts[key]
    if (!bucket) return
    bucket.splice(index, 1)
    saveToLocalStorage()
  }

  /**
   * Set a text item's selected state (e.g. when user deletes the text from canvas).
   * Keeps the entry but marks the placement as not selected so it no longer appears.
   * If all items in the entry become unselected, the entry's value is set to ''.
   */
  function setProductTextItemSelected(
    productId: number,
    entryIndex: number,
    itemIndex: number,
    selected: boolean
  ): void {
    const root = customization.value
    if (!root) return
    const key = String(productId)
    const bucket = root.product_custom_texts[key]
    const entry = bucket?.[entryIndex]
    const item = entry?.items?.[itemIndex]
    if (!item) return
    item.selected = selected
    const allUnselected = entry?.items?.every(it => it.selected === false) ?? false
    if (allUnselected && entry) {
      entry.value = ''
    }
    saveToLocalStorage()
  }

  /**
   * Update a single text item's placement data (e.g. after user moves/scales/rotates on canvas).
   * Payload may include optional 3D/original fields (x_axis_3d, y_axis_3d, originalWidth, originalHeight).
   */
  function updateProductTextItem(
    productId: number,
    entryIndex: number,
    itemIndex: number,
    payload: Partial<OutputProductTextItem> & Record<string, unknown>
  ): void {
    const root = customization.value
    if (!root) return
    const key = String(productId)
    const bucket = root.product_custom_texts[key]
    const entry = bucket?.[entryIndex]
    const item = entry?.items?.[itemIndex]
    if (!item) return
    entry.items[itemIndex] = { ...item, ...payload }
    saveToLocalStorage()
  }

  /**
   * Generate a temporary negative ID for new text entries that haven't been saved to the backend
   * Temporary IDs are negative numbers (e.g., -1, -2, -3) to avoid conflicts with real backend IDs
   */
  function generateTemporaryTextId(productId: number): number {
    if (!customization.value) return -1
    const key = String(productId)
    const texts = customization.value.product_custom_texts[key] || []

    // Find the lowest (most negative) temporary ID in use
    let minId = 0
    for (const text of texts) {
      if (text.id < 0 && text.id < minId) {
        minId = text.id
      }
    }

    // Return the next available temporary ID (one less than the current minimum)
    return minId - 1
  }

  /**
   * Initialize product_custom_texts from activeProductDetails.product_texts
   * Only initializes if the key doesn't exist or the array is empty
   * Preserves existing customizations to avoid overwriting user edits
   */
  function initializeProductTextsFromDetails(productId: number, productTexts: OutputProductText[]) {
    if (!customization.value || !productTexts || productTexts.length === 0) return

    const key = String(productId)
    const existing = customization.value.product_custom_texts[key]

    // Only initialize if the key doesn't exist or the array is empty
    if (!Array.isArray(existing) || existing.length === 0) {
      customization.value.product_custom_texts[key] = productTexts.map(text => ({
        ...text,
        items: text.items ? [...text.items] : [],
        following_products: text.following_products ? [...text.following_products] : [],
        following_product_ids: text.following_product_ids ? [...text.following_product_ids] : []
      }))

      saveToLocalStorage()
    }
  }

  function clearRosterEntries() {
    if (!customization.value) return
    customization.value.products_rosters = {}
    saveToLocalStorage()
  }

  // ===== PERSISTENCE =====
  function saveToLocalStorage() {
    setItem('activeProductCustomization', customization.value)
    setItem('reorderData', reorderData.value)
  }

  function loadFromLocalStorage(): boolean {
    const parsed = getItem<ActiveProductCustomization>('activeProductCustomization')
    const reorderParsed = getItem<typeof reorderData.value>('reorderData')
    if (!parsed) return false
    customization.value = parsed
    reorderData.value = reorderParsed || { orderItemId: null, factoryProductId: null }
    return true
  }

  function clearLocalStorage() {
    removeItem('activeProductCustomization')
    removeItem('reorderData')
  }

  // ===== ACTIONS =====
  function setCustomization(initial: ActiveProductCustomization) {
    customization.value = initial
    saveToLocalStorage()
  }

  async function setCategory(categoryId: number) {
    if (!customization.value) return
    if (customization.value.category_id === categoryId) return

    // Check if the current subcategory belongs to the new category
    const currentSubCategoryId = customization.value.sub_category_id
    if (currentSubCategoryId) {
      // Find the new category and check if it contains the current subcategory
      const category = productsStore.categories?.data?.find(c => c.id === categoryId)
      const subcategoryBelongsToCategory = category?.subcategories?.some(
        sub => sub.id === currentSubCategoryId
      )

      // If the subcategory doesn't belong to the new category, clear it
      if (!subcategoryBelongsToCategory) {
        customization.value.sub_category_id = null
      }
    }

    customization.value.category_id = categoryId
    await API.products.getProductPreviewsByCategory(categoryId)
    saveToLocalStorage()
  }

  function setProduct(productId: number) {
    if (!customization.value) return
    const prev = customization.value.product_id
    const next = productId
    if (prev === next) return
    customization.value.product_id = next
    // Fetch orchestration handled in products store watcher
    saveToLocalStorage()
  }

  async function setSubCategory(subCategoryId: number) {
    if (!customization.value) return
    const prev = customization.value.sub_category_id
    if (prev === subCategoryId) return
    customization.value.sub_category_id = subCategoryId
    try {
      await API.products.getProductPreviewsByCategory(subCategoryId)
    } catch (_) {}
    saveToLocalStorage()
  }

  function setStyle(styleId: number) {
    if (!customization.value) return
    const prev = customization.value.style_id
    if (prev === styleId) return
    customization.value.style_id = styleId
    // Fetch orchestration handled in products store watcher
    saveToLocalStorage()
  }

  function setDesign(
    design:
      | OutputDesignDetails
      | OutputDesignPreviewFront
      | (OutputDesignPreviewFront & OutputDesignPreviewBack)
  ) {
    if (!customization.value) return
    const prev = customization.value.design_id
    if (prev === design.id) return
    customization.value.design_id = design.id
    customization.value.design_name = design.design_name
    // Fetch orchestration handled in products store watcher
    saveToLocalStorage()
  }

  function setAddons(addons: OutputAddon[]) {
    if (!customization.value) return
    const key = customization.value.product_id
    if (!customization.value.addons_info)
      customization.value.addons_info =
        {} as import('@/services/products/types').APCustomizationAddonsInfo
    customization.value.addons_info[key] = {
      grouped_addons: {},
      ungrouped_addons: [],
      simple_addons: addons.map(a => a.addon_id)
    }
    saveToLocalStorage()
  }

  function setGroupColor(groupName: string, groupColor: OutputColor, gradientIndex?: number) {
    if (!customization.value) return

    const existing = customization.value.group_colors[groupName]

    // If gradient index is provided, update gradient_colors
    if (gradientIndex !== undefined) {
      let gradient_colors: GradientColor[]

      if (existing?.gradient_colors) {
        // Use existing gradient_colors (preserve percentage if present)
        gradient_colors = existing.gradient_colors.map(gc => ({ ...gc }))
      } else {
        // Initialize from base svgGroup if available (preserve percentage)
        const baseSvgGroup = productsStore.svgGroups.find(g => g.id === groupName)
        if (baseSvgGroup?.gradient_colors) {
          gradient_colors = baseSvgGroup.gradient_colors.map(gc => ({
            color: gc.color,
            pantone: gc.pantone,
            name: gc.name,
            percentage: gc.percentage
          }))
        } else {
          // Fallback: create a new array with the current color
          const pantoneValue: string = (groupColor as { pantone?: string }).pantone || ''
          gradient_colors = [
            {
              color: groupColor.value,
              pantone: pantoneValue,
              name: groupColor.name || ''
            }
          ]
        }
      }

      // Update the specific gradient color (preserve existing percentage)
      const pantoneValue: string = (groupColor as { pantone?: string }).pantone || ''
      const existingGradientColor = gradient_colors[gradientIndex]
      gradient_colors[gradientIndex] = {
        color: groupColor.value,
        pantone: pantoneValue,
        name: groupColor.name || '',
        percentage: existingGradientColor?.percentage
      }

      customization.value.group_colors[groupName] = {
        ...existing,
        gradient_colors,
        color: existing?.color ?? null,
        name: existing?.name ?? null
      }
    } else {
      // Regular color update
      customization.value.group_colors[groupName] = {
        color: groupColor.value,
        name: groupColor.name
      }
    }
    saveToLocalStorage()
  }

  const nullDefaultColorSlot: APCustomizationDefaultColor = {
    color: null,
    pantone: null,
    name: null
  }

  function setDefaultColorAt(index: number, value: APCustomizationDefaultColor | null) {
    if (!customization.value) return
    if (index < 0 || index > 3) return
    let arr = customization.value.default_colors
    if (!Array.isArray(arr)) arr = []
    while (arr.length < 4) {
      arr.push({ ...nullDefaultColorSlot })
    }
    arr[index] = value ? { ...value } : { ...nullDefaultColorSlot }
    customization.value.default_colors = arr.slice(0, 4)
    saveToLocalStorage()
  }

  function removeDefaultColorAt(index: number) {
    setDefaultColorAt(index, null)
  }

  /** Clear all four default_colors slots (e.g. for "Use original colors"). */
  function clearDefaultColors() {
    if (!customization.value) return
    const arr = [
      { ...nullDefaultColorSlot },
      { ...nullDefaultColorSlot },
      { ...nullDefaultColorSlot },
      { ...nullDefaultColorSlot }
    ]
    customization.value.default_colors = arr
    saveToLocalStorage()
  }

  function appendLogoColors(colors?: LogoColor[]) {
    if (!customization.value) return
    if (!colors || !colors.length) return
    if (!Array.isArray(customization.value.logo_colors)) customization.value.logo_colors = []
    colors.forEach(c => customization.value!.logo_colors.push(c))
    saveToLocalStorage()
  }

  function addLogoToCustomizationFromSource(logo: CustomLogo) {
    if (!customization.value) return
    const key = String(customization.value.product_id)
    return { key, logo }
  }

  function getMergedCustomizationLogo(_logo: CustomLogo, _placement: OutputProductLogosSetting) {
    const productId = Number(_logo.product_id ?? _placement.product_id ?? 0)
    const styleId = Number(_logo.product_style_id ?? _placement.product_style_id ?? 0)
    return {
      id: _logo.id,
      product_id: productId,
      product_style_id: styleId,
      following_product_ids: _logo.following_product_ids || _placement.following_product_ids,
      haveControls: _logo.haveControls ?? true,
      height: _logo.height || _placement.height || 180,
      is_locked: _logo.is_locked ?? _placement.is_locked ?? 0,
      is_replace_success: _logo.is_replace_success ?? false,
      is_smart_transparent: _logo.is_smart_transparent ?? false,
      is_vector: _logo.is_vector ?? true,
      logo_colors: _logo.logo_colors || [],
      logo_index: _logo.logo_index ?? 0,
      logo_name: _logo.logo_name,
      logo_technologies: _logo.logo_technologies,
      logos_follows_product: _logo.logos_follows_product ?? 0,
      name_of_placement: _logo.name_of_placement || _placement.name_of_placement,
      originalHeight: _logo.originalHeight || _placement.originalHeight,
      originalWidth: _logo.originalWidth || _placement.originalWidth,
      original_logo: _logo.original_logo,
      original_logo_url: _logo.original_logo_url,
      rotation: _logo.rotation ?? _placement.rotation ?? 0,
      side: _logo.side || _placement.side || 'front',
      smart_transparent_logo_url: _logo.smart_transparent_logo_url,
      transparent_logo_url: _logo.transparent_logo_url,
      created_at: _logo.created_at,
      updated_at: _logo.updated_at,
      url: _logo.url,
      width: _logo.width || _placement.width || 0,
      x_axis: _logo.x_axis || _placement.x_axis || 300,
      x_axis_3d: _logo.x_axis_3d ?? _placement.x_axis_3d ?? 0,
      y_axis: _logo.y_axis || _placement.y_axis || 300,
      y_axis_3d: _logo.y_axis_3d ?? _placement.y_axis_3d ?? 0,
      actualWidth: _logo.actualWidth,
      actualHeight: _logo.actualHeight,
      scaleX: _logo.scaleX,
      scaleY: _logo.scaleY
    } as CustomLogo
  }

  function updateCustomLogo(params: {
    custom_logo_index: number
    data: Partial<CustomLogo>
    productId?: number | null
  }) {
    if (!customization.value) return
    const pid = params.productId ?? customization.value.product_id
    if (!pid) return
    const key = String(pid)
    const map = customization.value.custom_logos?.[key]
    if (!map || !map[params.custom_logo_index]) return
    map[params.custom_logo_index] = {
      ...map[params.custom_logo_index],
      ...params.data
    } as CustomLogo
  }

  function removeCustomLogo(productKey: string, logoIndex: number) {
    if (!customization.value?.custom_logos) return
    const arr = customization.value.custom_logos[productKey]
    if (!arr || logoIndex < 0 || logoIndex >= arr.length) return
    arr.splice(logoIndex, 1)
    saveToLocalStorage()
  }

  // Helper function to create default customization with preserved IDs
  function createDefaultCustomization(
    preservedIds: {
      productId?: number
      styleId?: number
      designId?: number
      categoryId?: number
      subCategoryId?: number | null
    } = {}
  ): ActiveProductCustomization {
    return {
      fixed_logo_index: 0,
      category_index: 0,
      category_id: preservedIds.categoryId ?? 0,
      design_index: 0,
      design_id: preservedIds.designId ?? 0,
      design_name: '',
      product_index: 0,
      product_id: preservedIds.productId ?? 0,
      search_products: '',
      style_index: 0,
      style_id: preservedIds.styleId ?? 0,
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
      products_rosters: {},
      shuffle_color_number: 0,
      addons_info: {},
      group_patterns: {},
      roster_preview_selection: {},
      sub_category_id: preservedIds.subCategoryId ?? null,
      sub_category_index: null
    } as ActiveProductCustomization
  }

  function clearCustomization() {
    const existing = customization.value
    const productId =
      (existing && Number(existing.product_id)) || productsStore.activeProductDetails?.id || 0
    const styleId =
      (existing && Number(existing.style_id)) || productsStore.activeStyleDetails?.id || 0
    const designId =
      (existing && Number(existing.design_id)) || productsStore.activeDesignDetails?.id || 0
    const categoryId = (existing && Number(existing.category_id)) || 0
    const subCategoryId = existing?.sub_category_id ?? null

    const newCustomization = createDefaultCustomization({
      productId,
      styleId,
      designId,
      categoryId,
      subCategoryId
    })

    // Explicitly reset colors
    newCustomization.default_colors = [
      { color: null, pantone: null, name: null },
      { color: null, pantone: null, name: null },
      { color: null, pantone: null, name: null },
      { color: null, pantone: null, name: null }
    ]
    newCustomization.group_colors = {}
    newCustomization.shuffle_color_number = 0

    setCustomization(newCustomization)
  }

  // ===== BUSINESS LOGIC =====
  function ensureCustomization(
    preservedIds: {
      productId?: number
      styleId?: number
      designId?: number
      categoryId?: number
      subCategoryId?: number | null
    } = {}
  ) {
    // if (customization.value) return
    setCustomization(createDefaultCustomization(preservedIds))
  }

  function resetCustomizationToCurrentProductDefaults() {
    if (!productsStore.activeProductDetails) return
    const productId = productsStore.activeProductDetails?.id ?? 0
    const styleId = productsStore.activeStyleDetails?.id ?? 0
    const designId = productsStore.activeDesignDetails?.id ?? 0
    const categoryId = customization.value?.category_id ?? 0

    setCustomization(
      createDefaultCustomization({
        productId,
        styleId,
        designId,
        categoryId
      })
    )
  }

  function ensureRosterPreviewSelectionMap() {
    if (!customization.value) return null
    if (!customization.value.roster_preview_selection) {
      customization.value.roster_preview_selection = {}
    }
    return customization.value.roster_preview_selection
  }

  function setSelectedRosterPreviewIndex(index: number | null) {
    if (!customization.value) return
    const prodId = customization.value.product_id
    if (!prodId) return
    const key = String(prodId)
    const map = ensureRosterPreviewSelectionMap()
    if (!map) return
    if (index == null || index < 0) {
      delete map[key]
    } else {
      map[key] = index
    }
    saveToLocalStorage()
  }

  function updateProductTextValueById(
    textId: number,
    value: string,
    options?: { persist?: boolean }
  ): boolean {
    const prodId = customization.value?.product_id
    if (!prodId || !customization.value) return false
    const key = String(prodId)
    const texts = customization.value.product_custom_texts[key]
    if (!texts) return false
    const entryIndex = texts.findIndex(text => text.id === textId)
    if (entryIndex === -1) return false
    const targetEntry = texts[entryIndex]
    if (!targetEntry) return false
    if (targetEntry.value === value) return true
    texts[entryIndex] = {
      ...targetEntry,
      value
    }
    if (options?.persist) {
      saveToLocalStorage()
    }
    return true
  }
  function setReorderData(orderItemId: number, factoryProductId: string) {
    reorderData.value = { orderItemId, factoryProductId }
    saveToLocalStorage()
  }
  const resetCustomizationStore = () => {
    customization.value = null
    clearLocalStorage()
  }
  function generateTemporaryId(): number {
    if (!customization.value) return -1
    const prodId = customization.value.product_id
    if (!prodId) return -1
    const key = String(prodId)
    const entries = customization.value.products_rosters?.[key] || []

    let minId = 0
    for (const entry of entries) {
      if (entry.id != null && entry.id < 0 && entry.id < minId) {
        minId = entry.id
      }
    }
    return minId - 1
  }
  function addEmptyRosterRow(initialData?: Partial<APCustomizationRosterEntry>) {
    if (!customization.value) return

    const newRow: APCustomizationRosterEntry = {
      id: generateTemporaryId(),
      text: initialData?.text || '',
      number: initialData?.number || '',
      size: initialData?.size || '',
      quantity: initialData?.quantity || 1
    }

    const productId = customization.value.product_id
    const key = String(productId)
    if (!customization.value.products_rosters[key]) {
      customization.value.products_rosters[key] = []
    }

    customization.value.products_rosters[key].push(newRow)
    saveToLocalStorage()
  }

  /**
   * Update roster row by index
   */
  function updateRosterRow(index: number, payload: Partial<APCustomizationRosterEntry>) {
    if (!customization.value) return

    const key = String(customization.value.product_id)
    const entries = customization.value.products_rosters[key]

    if (!entries || !entries[index]) return

    Object.assign(entries[index], payload)
    saveToLocalStorage()
  }

  function clearReorderData() {
    reorderData.value = { orderItemId: null, factoryProductId: null }
    saveToLocalStorage()
  }
  // ===== RETURN =====

  // ===== RETURN =====
  return {
    // State
    customization,
    // Computed
    activeProductId,
    activeStyleId,
    activeDesignId,
    activeDesignName,
    activeCategoryId,
    activeSubCategoryId,
    activeProductTexts,
    rosterEntries,
    selectedRosterPreviewIndex,
    reorderData,
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    // Actions
    setCustomization,
    setCategory,
    setSubCategory,
    setProduct,
    setStyle,
    setDesign,
    setAddons,
    setGroupColor,
    setDefaultColorAt,
    removeDefaultColorAt,
    clearDefaultColors,
    appendLogoColors,
    addLogoToCustomizationFromSource,
    getMergedCustomizationLogo,
    updateCustomLogo,
    removeCustomLogo,
    setReorderData,
    clearReorderData,
    // Business Logic
    ensureCustomization,
    resetCustomizationToCurrentProductDefaults,
    clearCustomization,
    createDefaultCustomization,
    ensureTextEntry,
    upsertTextEntry,
    removeTextEntry,
    setProductTextItemSelected,
    updateProductTextItem,
    clearRosterEntries,
    initializeProductTextsFromDetails,
    generateTemporaryTextId,
    setSelectedRosterPreviewIndex,
    updateProductTextValueById,
    resetCustomizationStore,
    addEmptyRosterRow,
    updateRosterRow
  }
})
