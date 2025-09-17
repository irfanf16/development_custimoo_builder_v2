import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ActiveProductCustomization,
  OutputAddon,
  OutputColor,
  OutputDesignDetails,
  OutputDesignPreview
} from '@/services/products/types'
import { API } from '@/services'
import { useProductsStore } from '../products/products.store'

export const useCustomizationStore = defineStore('customizationStore', () => {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()

  // ===== STATE =====
  const customization = ref<ActiveProductCustomization | null>(null)

  // ===== COMPUTED =====
  const activeProductId = computed(() =>
    customization.value ? Number(customization.value.product_id) : null
  )
  const activeStyleId = computed(() => customization.value?.style_id ?? null)
  const activeDesignId = computed(() => customization.value?.design_id ?? null)
  const activeDesignName = computed(
    () => customization.value?.design_name ?? null
  )
  const activeCategoryId = computed(
    () => customization.value?.category_id ?? null
  )
  const activeSubCategoryId = computed(
    () => customization.value?.sub_category_id ?? null
  )

  // ===== PERSISTENCE =====
  function saveToLocalStorage() {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(
      'activeProductCustomization',
      JSON.stringify(customization.value)
    )
  }

  function loadFromLocalStorage(): boolean {
    if (typeof window === 'undefined') return false
    const raw = window.localStorage.getItem('activeProductCustomization')
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw)
      if (parsed) {
        customization.value = parsed as ActiveProductCustomization
        return true
      }
    } catch (_) {}
    return false
  }

  // ===== ACTIONS =====
  function setCustomization(initial: ActiveProductCustomization) {
    customization.value = initial
    saveToLocalStorage()
  }

  async function setCategory(categoryId: number) {
    if (!customization.value) return
    if (customization.value.category_id === categoryId) return
    customization.value.category_id = categoryId
    await API.products.getProductPreviewsByCategory(categoryId)
    saveToLocalStorage()
  }

  async function setProduct(productId: number) {
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

  async function setStyle(styleId: number) {
    if (!customization.value) return
    const prev = customization.value.style_id
    if (prev === styleId) return
    customization.value.style_id = styleId
    // Fetch orchestration handled in products store watcher
    saveToLocalStorage()
  }

  async function setDesign(design: OutputDesignDetails | OutputDesignPreview) {
    if (!customization.value) return
    const prev = customization.value.design_id
    if (prev === design.id) return
    customization.value.design_id = design.id
    customization.value.design_name = design.design_name
    // Fetch orchestration handled in products store watcher
    saveToLocalStorage()
  }

  async function setAddons(addons: OutputAddon[]) {
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

  function setGroupColor(groupName: string, groupColor: OutputColor) {
    if (!customization.value) return
    customization.value.group_colors[groupName] = {
      color: groupColor.value,
      name: groupColor.name
    }
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
      roster_detail: [],
      products_rosters: {},
      shuffle_color_number: 0,
      addons_info: {},
      group_patterns: {},
      sub_category_id: preservedIds.subCategoryId ?? null,
      sub_category_index: null
    } as ActiveProductCustomization
  }

  function clearCustomization() {
    const existing = customization.value
    const productId =
      (existing && Number(existing.product_id)) ||
      productsStore.activeProductDetails?.id ||
      0
    const styleId =
      (existing && Number(existing.style_id)) ||
      productsStore.activeStyleDetails?.id ||
      0
    const designId =
      (existing && Number(existing.design_id)) ||
      productsStore.activeDesignDetails?.id ||
      0
    const categoryId = (existing && Number(existing.category_id)) || 0
    const subCategoryId = existing?.sub_category_id ?? null

    setCustomization(
      createDefaultCustomization({
        productId,
        styleId,
        designId,
        categoryId,
        subCategoryId
      })
    )
  }

  // ===== BUSINESS LOGIC =====
  function ensureCustomization() {
    if (customization.value) return
    setCustomization(createDefaultCustomization())
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
    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    // Actions
    setCustomization,
    setCategory,
    setSubCategory,
    setProduct,
    setStyle,
    setDesign,
    setAddons,
    setGroupColor,
    // Business Logic
    ensureCustomization,
    resetCustomizationToCurrentProductDefaults,
    clearCustomization,
    createDefaultCustomization
  }
})
