import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ActiveProductCustomization,
  OutputAddon
} from '@/services/products/types'
import { API } from '@/services'
import { useProductsStore } from './products/products.store'

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

export const useCustomizationStore = defineStore('customizationStore', () => {
  const productsStore = useProductsStore()

  const customization = ref<ActiveProductCustomization | null>(null)

  const undoStack = ref<SelectionCommand[]>([])
  const redoStack = ref<SelectionCommand[]>([])
  const isApplying = ref(false)

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

  async function setCategory(categoryId: number) {
    if (!customization.value) return
    const prev = customization.value.category_id
    if (prev === categoryId) return
    customization.value.category_id = categoryId
    pushCommand({
      key: 'category_id',
      prev,
      next: categoryId,
      timestamp: Date.now()
    })
    await API.products.getProductPreviewsByCategory(categoryId)
    save()
  }

  async function setProduct(productId: number) {
    if (!customization.value) return
    const prev = customization.value.product_id
    const next = String(productId)
    if (prev === next) return
    customization.value.product_id = next
    customization.value.style_id = 0
    customization.value.design_id = 0
    pushCommand({
      key: 'product_id',
      prev,
      next,
      timestamp: Date.now()
    })
    const resp = await API.products.getActiveProductDetails(productId)
    if ('data' in resp && resp.data) {
      const details = resp.data
      ;(
        productsStore as unknown as {
          setActiveProductDetailsState: (
            p: import('@/services/products/types').OutputProductDetails
          ) => void
          setActiveStyleDetailsState: (
            s: import('@/services/products/types').OutputStyleDetails
          ) => void
          setActiveDesignDetailsState: (
            d: import('@/services/products/types').OutputDesignDetails
          ) => void
        }
      ).setActiveProductDetailsState(details.productDetails)
      ;(productsStore as unknown as any).setActiveStyleDetailsState(
        details.styleDetails
      )
      ;(productsStore as unknown as any).setActiveDesignDetailsState(
        details.designDetails
      )
    }
    save()
  }

  async function setSubCategory(subCategoryId: number) {
    if (!customization.value) return
    const prev = customization.value.sub_category_id
    if (prev === subCategoryId) return
    customization.value.sub_category_id = subCategoryId
    pushCommand({
      key: 'sub_category_id',
      prev,
      next: subCategoryId,
      timestamp: Date.now()
    })
    try {
      await API.products.getProductPreviewsByCategory(subCategoryId)
    } catch (_) {}
    save()
  }

  async function setStyle(styleId: number) {
    if (!customization.value) return
    const prev = customization.value.style_id
    if (prev === styleId) return
    customization.value.style_id = styleId
    customization.value.design_id = 0
    pushCommand({
      key: 'style_id',
      prev,
      next: styleId,
      timestamp: Date.now()
    })
    const resp = await API.products.getActiveStyleDetails(styleId)
    if ('data' in resp) {
      const { productstyle, productdesign } = resp.data as {
        productstyle: import('@/services/products/types').OutputStyleDetails
        productdesign: import('@/services/products/types').OutputDesignDetails
      }
      ;(productsStore as unknown as any).setActiveStyleDetailsState(
        productstyle
      )
      ;(productsStore as unknown as any).setActiveDesignDetailsState(
        productdesign
      )
    }
    save()
  }

  async function setDesign(designId: number) {
    if (!customization.value) return
    const prev = customization.value.design_id
    if (prev === designId) return
    customization.value.design_id = designId
    pushCommand({
      key: 'design_id',
      prev,
      next: designId,
      timestamp: Date.now()
    })
    const resp = await API.products.getDesignDetailsById(designId)
    if ('data' in resp) {
      ;(productsStore as unknown as any).setActiveDesignDetailsState(resp.data)
    }
    save()
  }

  async function setAddons(addons: OutputAddon[]) {
    if (!customization.value) return
    const key = customization.value.product_id
    const prev = customization.value.addons_info?.[key]?.simple_addons ?? []
    if (!customization.value.addons_info)
      customization.value.addons_info =
        {} as import('@/services/products/types').APCustomizationAddonsInfo
    customization.value.addons_info[key] = {
      grouped_addons: {},
      ungrouped_addons: [],
      simple_addons: addons.map(a => a.addon_id)
    }
    pushCommand({
      key: 'addons',
      prev,
      next: customization.value.addons_info[key].simple_addons,
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
          customization.value!.addons_info =
            {} as import('@/services/products/types').APCustomizationAddonsInfo
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

  function ensureCustomization() {
    if (customization.value) return
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
    const productId = productsStore.activeProductDetails?.id ?? 0
    const styleId = productsStore.activeStyleDetails?.id ?? 0
    const designId = productsStore.activeDesignDetails?.id ?? 0
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
    customization,
    undoStack,
    redoStack,
    // computed ids
    activeProductId,
    activeStyleId,
    activeDesignId,
    activeCategoryId,
    activeSubCategoryId,
    // persistence and history
    load,
    save,
    setCustomization,
    setCategory,
    setSubCategory,
    setProduct,
    setStyle,
    setDesign,
    setAddons,
    undo,
    redo,
    ensureCustomization,
    resetCustomizationToCurrentProductDefaults
  }
})
