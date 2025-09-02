import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  ActiveProductCustomization,
  OutputAddon
} from '@/services/products/types'
import { useProductsStore } from './products/products.store'
import { API } from '@/services'

type SelectionKey =
  | 'category_id'
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
    if ('data' in resp) {
      const details = resp.data
      productsStore.activeProductDetails = details.productDetails
      productsStore.activeStyleDetails = details.styleDetails
      productsStore.activeDesignDetails = details.designDetails
    }
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

  return {
    customization,
    activeStep,
    undoStack,
    redoStack,
    load,
    save,
    setActiveStep,
    setCustomization,
    setCategory,
    setProduct,
    setStyle,
    setDesign,
    setAddons,
    undo,
    redo
  }
})
