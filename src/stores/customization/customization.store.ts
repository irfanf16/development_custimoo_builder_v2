import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ActiveProductCustomization,
  OutputAddon,
  OutputColor,
  OutputDesignDetails,
  OutputDesignPreviewFront,
  OutputDesignPreviewBack,
  OutputProductLogosSetting
} from '@/services/products/types'
import { API } from '@/services'
import { useProductsStore } from '../products/products.store'
import type { CustomLogo, LogoColor } from '@/services/logos/types'

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

  async function setDesign(
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

  function appendLogoColors(colors?: LogoColor[]) {
    if (!customization.value) return
    if (!colors || !colors.length) return
    if (!Array.isArray(customization.value.logo_colors))
      customization.value.logo_colors = []
    colors.forEach(c => customization.value!.logo_colors.push(c))
    saveToLocalStorage()
  }

  function addLogoToCustomizationFromSource(logo: CustomLogo) {
    if (!customization.value) return
    const key = String(customization.value.product_id)
    return { key, logo }
  }

  function getMergedCustomizationLogo(
    _logo: CustomLogo,
    _placement: OutputProductLogosSetting
  ) {
    return {
      id: _logo.id,
      product_id: _logo.product_id || _placement.product_id,
      product_style_id: _logo.product_style_id || _placement.product_style_id,
      following_product_ids:
        _logo.following_product_ids || _placement.following_product_ids,
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
      name_of_placement:
        _logo.name_of_placement || _placement.name_of_placement,
      originalHeight: _logo.originalHeight || _placement.originalHeight,
      originalWidth: _logo.originalWidth || _placement.originalWidth,
      original_logo: _logo.original_logo,
      original_logo_url: _logo.original_logo_url,
      rotation: _logo.rotation ?? _placement.rotation ?? 0,
      side: _logo.side || _placement.side || 'front',
      smart_transparent_logo: _logo.smart_transparent_logo,
      transparent_logo: _logo.transparent_logo,
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
    appendLogoColors,
    addLogoToCustomizationFromSource,
    getMergedCustomizationLogo,
    // Business Logic
    ensureCustomization,
    resetCustomizationToCurrentProductDefaults,
    clearCustomization,
    createDefaultCustomization
  }
})
