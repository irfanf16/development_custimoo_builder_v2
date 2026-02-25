import { toRaw } from 'vue'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type {
  ActiveProductCustomization,
  APCustomizationRosterEntry
} from '@/services/products/types/customization'
import type { CustomLogo } from '@/services/logos/types'
import type {
  HistoryContext,
  HistoryActionType,
  ColorSetGroupPayload,
  TextSetValuePayload,
  TextAddEntryPayload,
  TextUpdateEntryPayload,
  TextRemoveEntryPayload,
  TextUpdateValuePayload,
  TextUpdateFontPayload,
  TextUpdateColorPayload,
  TextUpdateOutlineColorPayload,
  TextUpdateOutlineWidthPayload,
  TextUpdateHeightPayload,
  TextUpdateWidthPayload,
  TextUpdateRotationPayload,
  TextUpdatePlacementPayload,
  TextUpdateScalePayload,
  LogoAddPayload,
  LogoRemovePayload,
  LogoMovePayload,
  LogoUpdateUrlPayload,
  PatternSetGroupPayload,
  LogoUpdatePlacementPayload,
  LogoUpdateSizePayload,
  LogoUpdateRotationPayload,
  LogoRecolorPayload,
  AddonsSetPayload,
  RosterUpdateQuantityPayload,
  RosterUpdateSizePayload,
  RosterUpdateNumberPayload,
  RosterUpdateNamePayload,
  RosterRemoveEntryPayload,
  RosterAddEntryPayload
} from './types'
import type { OutputAddon, OutputCompanyAddon, OutputProductText } from '@/services/products/types'

type Handler<T> = {
  apply(ctx: HistoryContext, payload: T): void | Promise<void>
  revert(ctx: HistoryContext, payload: T): void | Promise<void>
  describe(ctx: HistoryContext, payload: T): string
}

type Registry = Record<
  HistoryActionType,
  | Handler<ColorSetGroupPayload>
  | Handler<TextSetValuePayload>
  | Handler<TextAddEntryPayload>
  | Handler<TextUpdateEntryPayload>
  | Handler<TextRemoveEntryPayload>
  | Handler<TextUpdateValuePayload>
  | Handler<TextUpdateFontPayload>
  | Handler<TextUpdateColorPayload>
  | Handler<TextUpdateOutlineColorPayload>
  | Handler<TextUpdateOutlineWidthPayload>
  | Handler<TextUpdateHeightPayload>
  | Handler<TextUpdateWidthPayload>
  | Handler<TextUpdateRotationPayload>
  | Handler<TextUpdatePlacementPayload>
  | Handler<TextUpdateScalePayload>
  | Handler<LogoAddPayload>
  | Handler<LogoRemovePayload>
  | Handler<LogoMovePayload>
  | Handler<LogoUpdateUrlPayload>
  | Handler<LogoRecolorPayload>
  | Handler<PatternSetGroupPayload>
  | Handler<RosterAddEntryPayload>
  | Handler<RosterRemoveEntryPayload>
  | Handler<RosterUpdateNamePayload>
  | Handler<RosterUpdateNumberPayload>
  | Handler<RosterUpdateSizePayload>
  | Handler<RosterUpdateQuantityPayload>
  | Handler<{
      productId: number
      prevIds: number[]
      nextIds: number[]
    }>
  | Handler<{
      entries: Array<{ type: HistoryActionType; payload: unknown }>
      label?: string
    }>
>

export function createHistoryContext(): HistoryContext {
  return {
    customizationStore: useCustomizationStore(),
    productsStore: useProductsStore(),
    workflowStore: useWorkflowStore()
  }
}

function getLogoArray(ctx: HistoryContext, key: string) {
  const map = ctx.customizationStore.customization?.custom_logos
  if (!map) return null
  return map[key] ?? null
}

function getTextArray(ctx: HistoryContext, key: string) {
  const root = ctx.customizationStore.customization
  if (!root) return null
  const map = root.product_custom_texts || (root.product_custom_texts = {})
  if (!map[key]) map[key] = []
  return map[key]
}

function getRosterArray(ctx: HistoryContext, key: string) {
  const root = ctx.customizationStore.customization
  if (!root) return null
  const map = root.products_rosters || (root.products_rosters = {})
  if (!map[key]) map[key] = []
  return map[key]
}

function cloneRosterEntry(entry: APCustomizationRosterEntry): APCustomizationRosterEntry {
  const rawEntry = toRaw(entry)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(rawEntry)
    } catch (_) {
      // Fall through to JSON clone if structuredClone fails (e.g., due to non-cloneable values)
    }
  }
  return JSON.parse(JSON.stringify(rawEntry)) as typeof entry
}

function findTextEntryById(
  ctx: HistoryContext,
  key: string,
  textId: number
): { array: OutputProductText[]; index: number } | null {
  const array = getTextArray(ctx, key)
  if (!array) return null
  const index = array.findIndex(entry => entry.id === textId)
  if (index === -1) return null
  return { array, index }
}

function cloneTextEntry(entry: import('@/services/products/types').OutputProductText) {
  const rawEntry = toRaw(entry)
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(rawEntry)
    } catch (_) {
      // Fall through to JSON clone if structuredClone fails (e.g., due to non-cloneable values)
    }
  }
  return JSON.parse(JSON.stringify(rawEntry)) as typeof entry
}

const TEXT_PREVIEW_LIMIT = 40

function truncateTextLabel(value: string, max = TEXT_PREVIEW_LIMIT) {
  const trimmed = value.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 3)}...`
}

function formatTextLabel(
  source?: {
    value?: string | null
    label?: string | null
    type?: string | null
  } | null,
  fallback = 'text'
): string {
  if (!source) return fallback
  const rawValue = typeof source.value === 'string' ? source.value.trim() : ''
  if (rawValue) return `"${truncateTextLabel(rawValue)}"`
  const rawLabel = typeof source.label === 'string' ? source.label.trim() : ''
  if (rawLabel) return truncateTextLabel(rawLabel)
  const type = typeof source.type === 'string' ? source.type.replace(/_/g, ' ') : ''
  if (type) return `${type} text`
  return fallback
}

function formatTextValue(value: string | null | undefined, fallback = 'text'): string {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return `"${truncateTextLabel(trimmed)}"`
}

function describeTextById(
  ctx: HistoryContext,
  key: string,
  textId: number,
  fallback?: string
): string {
  const result = findTextEntryById(ctx, key, textId)
  const fallbackLabel = fallback ?? `#${textId}`
  if (!result) return fallbackLabel
  return formatTextLabel(result.array[result.index], fallbackLabel)
}

function describeTextByIndex(
  ctx: HistoryContext,
  key: string,
  index: number,
  fallback?: string
): string {
  const array = getTextArray(ctx, key)
  const fallbackLabel = fallback ?? `#${index + 1}`
  if (!array || index < 0 || index >= array.length) return fallbackLabel
  return formatTextLabel(array[index], fallbackLabel)
}

function withLogoPatch(base: CustomLogo, patch: Partial<CustomLogo>): CustomLogo {
  return {
    ...base,
    ...patch,
    id: base.id,
    product_id: base.product_id,
    product_style_id: base.product_style_id,
    following_product_ids: base.following_product_ids,
    rotation: patch.rotation ?? base.rotation,
    width: patch.width ?? base.width,
    height: patch.height ?? base.height,
    placement: patch.placement ?? base.placement,
    name_of_placement: patch.name_of_placement ?? base.name_of_placement,
    url: patch.url ?? base.url,
    logo_colors: base.logo_colors,
    haveControls: base.haveControls,
    is_locked: base.is_locked,
    is_replace_success: base.is_replace_success,
    is_smart_transparent: base.is_smart_transparent,
    is_vector: base.is_vector,
    logo_index: base.logo_index,
    logo_name: base.logo_name,
    side: patch.side ?? base.side,
    x_axis: patch.x_axis ?? base.x_axis,
    y_axis: patch.y_axis ?? base.y_axis,
    x_axis_3d: patch.x_axis_3d !== undefined ? patch.x_axis_3d : base.x_axis_3d,
    y_axis_3d: patch.y_axis_3d !== undefined ? patch.y_axis_3d : base.y_axis_3d,
    originalWidth: patch.originalWidth ?? base.originalWidth,
    originalHeight: patch.originalHeight ?? base.originalHeight,
    logo_technologies: base.logo_technologies,
    logos_follows_product: base.logos_follows_product,
    created_at: base.created_at,
    updated_at: base.updated_at
  }
}

export const registry: Registry = {
  'color.set-group': {
    apply(ctx: HistoryContext, payload: ColorSetGroupPayload) {
      const customizationStore = ctx.customizationStore
      customizationStore.setGroupColor(payload.groupId, payload.nextColor, payload.gradientIndex)
    },
    revert(ctx: HistoryContext, payload: ColorSetGroupPayload) {
      const customizationStore = ctx.customizationStore
      if (payload.prevColor) {
        customizationStore.setGroupColor(payload.groupId, payload.prevColor, payload.gradientIndex)
      } else {
        const c = customizationStore.customization as ActiveProductCustomization | null
        const colors = c?.group_colors
        if (colors && colors[payload.groupId]) {
          delete colors[payload.groupId]
          customizationStore.saveToLocalStorage()
        }
      }
    },
    describe(_: HistoryContext, p: ColorSetGroupPayload) {
      const label = p.nextColor?.name || p.nextColor?.value || '—'
      const gradientLabel =
        p.gradientIndex !== undefined ? ` (Gradient ${p.gradientIndex + 1})` : ''
      return `Set color for ${p.groupId} to ${label}${gradientLabel}`
    }
  },
  'text.set-value': {
    apply(ctx: HistoryContext, payload: TextSetValuePayload) {
      const customizationStore = ctx.customizationStore
      const root = customizationStore.customization as ActiveProductCustomization | null
      if (!root) return
      const map = root.product_custom_texts
      const key = payload.key
      if (!map[key]) map[key] = []
      const arr = map[key]

      // Ensure array is large enough
      while (arr.length <= payload.index) {
        arr.push({
          id: 0,
          product_id: 0,
          type: 'name',
          label: '',
          value: '',
          following_products: [],
          items: [],
          created_at: null,
          updated_at: null,
          deleted_at: null,
          manually_added: false,
          font_family: '',
          following_product_ids: [],
          active_item_index: 0
        })
      }

      const item = arr[payload.index]
      if (item) {
        item.value = payload.nextValue
        customizationStore.saveToLocalStorage()
      }
    },
    revert(ctx: HistoryContext, payload: TextSetValuePayload) {
      const customizationStore = ctx.customizationStore
      const root = customizationStore.customization as ActiveProductCustomization | null
      if (!root) return
      const map = root.product_custom_texts
      const key = payload.key
      if (!map[key]) return
      const arr = map[key]

      if (payload.index < 0 || payload.index >= arr.length) return
      const item = arr[payload.index]
      if (item) {
        item.value = payload.prevValue
        customizationStore.saveToLocalStorage()
      }
    },
    describe(ctx: HistoryContext, p: TextSetValuePayload) {
      const fallback = formatTextValue(p.nextValue, `#${p.index + 1}`)
      const label = describeTextByIndex(ctx, p.key, p.index, fallback)
      return `Change text ${label}`
    }
  },
  'text.add-entry': {
    apply(ctx: HistoryContext, payload: TextAddEntryPayload) {
      const map = getTextArray(ctx, payload.key)
      if (!map) return
      const index = payload.index ?? map.length
      map.splice(index, 0, cloneTextEntry(payload.entry))
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextAddEntryPayload) {
      const map = getTextArray(ctx, payload.key)
      if (!map) return

      // Prefer removal by ID to avoid stale indices when arrays shift
      let removeIndex = -1
      const entryId = payload.entry?.id
      if (entryId !== undefined) {
        removeIndex = map.findIndex(item => item.id === entryId)
      }

      // Fallback to original index if ID lookup failed
      if (removeIndex === -1) {
        const fallbackIndex = payload.index ?? map.length - 1
        if (fallbackIndex >= 0 && fallbackIndex < map.length) {
          removeIndex = fallbackIndex
        }
      }

      if (removeIndex === -1) return
      const [removed] = map.splice(removeIndex, 1)
      if (!removed) return

      if (!payload.entry) {
        payload.entry = cloneTextEntry(removed)
      }
      ctx.customizationStore.saveToLocalStorage()

      const workflowStore = ctx.workflowStore
      const removedWasActive = workflowStore.activeTextId === removed.id

      if (removedWasActive) {
        workflowStore.setActiveTextId(null)
        workflowStore.setActiveTextItemIndex(null)

        if (workflowStore.textsSubStep === 'single') {
          workflowStore.setTextsSubStep('list')
        }
      }
    },
    describe(_: HistoryContext, payload: TextAddEntryPayload) {
      const label = formatTextLabel(payload.entry, 'text')
      return `Add text ${label}`
    }
  },
  'text.update-entry': {
    apply(ctx: HistoryContext, payload: TextUpdateEntryPayload) {
      // Find entry by ID (preferred) or fallback to index for backward compatibility
      let result: { array: OutputProductText[]; index: number } | null = null

      if (payload.textId) {
        result = findTextEntryById(ctx, payload.key, payload.textId)
      }

      // Fallback to index if ID lookup failed or not provided (backward compatibility)
      if (!result && payload.index !== undefined) {
        const map = getTextArray(ctx, payload.key)
        if (map && payload.index >= 0 && payload.index < map.length) {
          result = { array: map, index: payload.index }
        }
      }

      if (!result) return
      const { array, index } = result

      // Capture prev state if not provided
      const existingEntry = array[index]
      if (!payload.prev && existingEntry) {
        payload.prev = cloneTextEntry(existingEntry)
      }

      // Apply the update
      array[index] = cloneTextEntry(payload.next)
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateEntryPayload) {
      if (!payload.prev) return

      // Find entry by ID (preferred) or fallback to index
      let result: { array: OutputProductText[]; index: number } | null = null

      if (payload.textId) {
        result = findTextEntryById(ctx, payload.key, payload.textId)
      }

      // Fallback to index if ID lookup failed or not provided
      if (!result && payload.index !== undefined) {
        const map = getTextArray(ctx, payload.key)
        if (map && payload.index >= 0 && payload.index < map.length) {
          result = { array: map, index: payload.index }
        }
      }

      if (!result) return
      const { array, index } = result

      array[index] = cloneTextEntry(payload.prev)
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, payload: TextUpdateEntryPayload) {
      const fallback =
        payload.textId != null ? `#${payload.textId}` : `#${(payload.index ?? 0) + 1}`
      const label = formatTextLabel(payload.next, fallback)
      return `Update text ${label}`
    }
  },
  'text.remove-entry': {
    apply(ctx: HistoryContext, payload: TextRemoveEntryPayload) {
      const map = getTextArray(ctx, payload.key)
      if (!map || payload.index < 0 || payload.index >= map.length) return
      const entry = map[payload.index]
      if (entry) {
        payload.entry = cloneTextEntry(entry)
        map.splice(payload.index, 1)
        ctx.customizationStore.saveToLocalStorage()
      }
    },
    revert(ctx: HistoryContext, payload: TextRemoveEntryPayload) {
      const map = getTextArray(ctx, payload.key)
      if (!map || payload.entry == null) return
      map.splice(payload.index, 0, cloneTextEntry(payload.entry))
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextRemoveEntryPayload) {
      const label = describeTextByIndex(ctx, payload.key, payload.index, `#${payload.index + 1}`)
      return `Remove text ${label}`
    }
  },
  'text.update-value': {
    apply(ctx: HistoryContext, payload: TextUpdateValuePayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      if (!entry) return
      // Create new object reference to trigger reactivity
      result.array[result.index] = { ...entry, value: payload.nextValue }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateValuePayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      if (!entry) return
      // Create new object reference to trigger reactivity
      result.array[result.index] = { ...entry, value: payload.prevValue }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateValuePayload) {
      const baseLabel = describeTextById(ctx, payload.key, payload.textId)
      const label = formatTextValue(payload.nextValue, baseLabel)
      return `Change text value ${label}`
    }
  },
  'text.update-font': {
    apply(ctx: HistoryContext, payload: TextUpdateFontPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      if (!entry) return
      // Create new object references to trigger reactivity
      const item = entry.items?.[payload.itemIndex]
      const updatedItem = item ? { ...item, font_family: payload.nextFont } : item
      const updatedItems = item && entry.items ? [...entry.items] : entry.items || []
      if (updatedItem && item) {
        updatedItems[payload.itemIndex] = updatedItem
      }
      result.array[result.index] = { ...entry, font_family: payload.nextFont, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateFontPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      if (!entry) return
      // Create new object references to trigger reactivity
      const item = entry.items?.[payload.itemIndex]
      const updatedItem = item ? { ...item, font_family: payload.prevFont } : item
      const updatedItems = item && entry.items ? [...entry.items] : entry.items || []
      if (updatedItem && item) {
        updatedItems[payload.itemIndex] = updatedItem
      }
      result.array[result.index] = { ...entry, font_family: payload.prevFont, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateFontPayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change font for text ${label}`
    }
  },
  'text.update-color': {
    apply(ctx: HistoryContext, payload: TextUpdateColorPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, color: payload.nextColor }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateColorPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, color: payload.prevColor }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateColorPayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change color for text ${label}`
    }
  },
  'text.update-outline-color': {
    apply(ctx: HistoryContext, payload: TextUpdateOutlineColorPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, outline_color: payload.nextColor }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateOutlineColorPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, outline_color: payload.prevColor }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateOutlineColorPayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change outline color for text ${label}`
    }
  },
  'text.update-outline-width': {
    apply(ctx: HistoryContext, payload: TextUpdateOutlineWidthPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, outline_width: payload.nextWidth }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateOutlineWidthPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, outline_width: payload.prevWidth }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateOutlineWidthPayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change outline width for text ${label}`
    }
  },
  'text.update-height': {
    apply(ctx: HistoryContext, payload: TextUpdateHeightPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, height: payload.nextHeight }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateHeightPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, height: payload.prevHeight }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateHeightPayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change height for text ${label}`
    }
  },
  'text.update-width': {
    apply(ctx: HistoryContext, payload: TextUpdateWidthPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      if (!entry?.items?.[payload.itemIndex]) return
      const item = entry.items[payload.itemIndex] as { width?: string }
      item.width = payload.nextWidth
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateWidthPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      if (!entry?.items?.[payload.itemIndex]) return
      const item = entry.items[payload.itemIndex] as { width?: string }
      item.width = payload.prevWidth
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateWidthPayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change width for text ${label}`
    }
  },
  'text.update-rotation': {
    apply(ctx: HistoryContext, payload: TextUpdateRotationPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, rotation: payload.nextRotation }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateRotationPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, rotation: payload.prevRotation }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateRotationPayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change rotation for text ${label}`
    }
  },
  'text.update-placement': {
    apply(ctx: HistoryContext, payload: TextUpdatePlacementPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, placement: payload.nextPlacement }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdatePlacementPayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, placement: payload.prevPlacement }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdatePlacementPayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change placement for text ${label}`
    }
  },
  'text.update-scale': {
    apply(ctx: HistoryContext, payload: TextUpdateScalePayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, scaleX: payload.nextScaleX, scaleY: payload.nextScaleY }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextUpdateScalePayload) {
      const result = findTextEntryById(ctx, payload.key, payload.textId)
      if (!result) return
      const entry = result.array[result.index]
      const item = entry?.items?.[payload.itemIndex]
      if (!item) return
      // Create new object references to trigger reactivity
      const updatedItem = { ...item, scaleX: payload.prevScaleX, scaleY: payload.prevScaleY }
      const updatedItems = [...(entry.items || [])]
      updatedItems[payload.itemIndex] = updatedItem
      result.array[result.index] = { ...entry, items: updatedItems }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: TextUpdateScalePayload) {
      const label = describeTextById(ctx, payload.key, payload.textId)
      return `Change scale for text ${label}`
    }
  },
  'logo.add': {
    apply(ctx: HistoryContext, payload: LogoAddPayload) {
      const customizationStore = ctx.customizationStore
      const root = customizationStore.customization as ActiveProductCustomization | null
      const customLogosMap = root?.custom_logos
      if (!customLogosMap) return
      const arr = customLogosMap[payload.key] || (customLogosMap[payload.key] = [])
      const at = payload.index ?? arr.length
      arr.splice(at, 0, payload.logo)
      customizationStore.appendLogoColors(payload.logo.logo_colors)
      customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoAddPayload) {
      const customizationStore = ctx.customizationStore
      const root = customizationStore.customization as ActiveProductCustomization | null
      const customLogosMap = root?.custom_logos
      if (!customLogosMap) return
      const arr = customLogosMap[payload.key]
      if (!arr) return
      const at = payload.index ?? arr.length - 1
      arr.splice(at, 1)
      customizationStore.saveToLocalStorage()
    },
    describe() {
      return `Add logo`
    }
  },
  'logo.remove': {
    apply(ctx: HistoryContext, payload: LogoRemovePayload) {
      const customizationStore = ctx.customizationStore
      const root = customizationStore.customization as ActiveProductCustomization | null
      const map = root?.custom_logos
      if (!map) return
      const arr = map[payload.key]
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      payload.logo = arr[payload.index]
      arr.splice(payload.index, 1)
      customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoRemovePayload) {
      const customizationStore = ctx.customizationStore
      const root = customizationStore.customization as ActiveProductCustomization | null
      const map = root?.custom_logos
      if (!map) return
      const arr = map[payload.key] || (map[payload.key] = [])
      if (!payload.logo) return
      arr.splice(payload.index, 0, payload.logo)
      customizationStore.saveToLocalStorage()
    },
    describe() {
      return `Remove logo`
    }
  },
  'logo.move': {
    apply(ctx: HistoryContext, payload: LogoMovePayload) {
      const customizationStore = ctx.customizationStore
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = map[payload.key]
      if (!arr) return
      const item = arr[payload.from]
      arr.splice(payload.from, 1)
      // TypeScript can't infer tuple element type here; use spread to avoid direct any assignment
      arr.splice(payload.to, 0, item as unknown as (typeof arr)[number])
      customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoMovePayload) {
      const customizationStore = ctx.customizationStore
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = map[payload.key]
      if (!arr) return
      const item = arr[payload.to]
      arr.splice(payload.to, 1)
      arr.splice(payload.from, 0, item as unknown as (typeof arr)[number])
      customizationStore.saveToLocalStorage()
    },
    describe() {
      return `Move logo`
    }
  },
  'logo.remove-background': {
    apply(ctx: HistoryContext, payload: LogoUpdateUrlPayload) {
      const customizationStore = ctx.customizationStore
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = map[payload.key]
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      // Replace the entire logo object to capture all field changes
      arr[payload.index] = { ...arr[payload.index], ...payload.nextLogo }
      customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoUpdateUrlPayload) {
      const customizationStore = ctx.customizationStore
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = map[payload.key]
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      // Restore the entire logo object to revert all field changes
      arr[payload.index] = { ...arr[payload.index], ...payload.prevLogo }
      customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, p: LogoUpdateUrlPayload) {
      const nextUrl = p.nextLogo.url
      const mode = nextUrl.includes('transparent')
        ? nextUrl.includes('smart')
          ? 'smart transparency'
          : 'simple transparency'
        : 'original'
      return `Change logo background to ${mode}`
    }
  },
  'logo.update-placement': {
    apply(ctx: HistoryContext, payload: LogoUpdatePlacementPayload) {
      const arr = getLogoArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const current = arr[payload.index]
      if (!current) return
      arr[payload.index] = withLogoPatch(current, {
        placement: payload.nextPlacementKey ?? current?.placement,
        name_of_placement: payload.nextPlacementLabel ?? current?.name_of_placement,
        x_axis: payload.nextX ?? current.x_axis,
        y_axis: payload.nextY ?? current.y_axis,
        side: payload.nextSide ?? current.side,
        width: payload.nextWidth ?? current.width,
        height: payload.nextHeight ?? current.height,
        // Reset 3D position when placement changes
        x_axis_3d: 0,
        y_axis_3d: 0
      })
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoUpdatePlacementPayload) {
      const arr = getLogoArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const current = arr[payload.index]
      if (!current) return
      arr[payload.index] = withLogoPatch(current, {
        placement: payload.prevPlacementKey ?? current?.placement,
        name_of_placement: payload.prevPlacementLabel ?? current?.name_of_placement,
        x_axis: payload.prevX ?? current.x_axis,
        y_axis: payload.prevY ?? current.y_axis,
        side: payload.prevSide ?? current.side,
        width: payload.prevWidth ?? current.width,
        height: payload.prevHeight ?? current.height,
        // Reset 3D position when reverting placement changes
        x_axis_3d: 0,
        y_axis_3d: 0
      })
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, _payload: LogoUpdatePlacementPayload) {
      return `Change logo placement`
    }
  },
  'logo.update-size': {
    apply(ctx: HistoryContext, payload: LogoUpdateSizePayload) {
      const arr = getLogoArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const logoInIndex = arr[payload.index]
      if (!logoInIndex) return
      arr[payload.index] = withLogoPatch(logoInIndex, {
        width: payload.nextWidth,
        height: payload.nextHeight
      })
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoUpdateSizePayload) {
      const arr = getLogoArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const logoInIndex = arr[payload.index]
      if (!logoInIndex) return
      arr[payload.index] = withLogoPatch(logoInIndex, {
        width: payload.prevWidth,
        height: payload.prevHeight
      })
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, _payload: LogoUpdateSizePayload) {
      return `Adjust logo size`
    }
  },
  'logo.update-rotation': {
    apply(ctx: HistoryContext, payload: LogoUpdateRotationPayload) {
      const arr = getLogoArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const logoInIndex = arr[payload.index]
      if (!logoInIndex) return
      arr[payload.index] = withLogoPatch(logoInIndex, {
        rotation: payload.nextRotation
      })
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoUpdateRotationPayload) {
      const arr = getLogoArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const logoInIndex = arr[payload.index]
      if (!logoInIndex) return
      arr[payload.index] = withLogoPatch(logoInIndex, {
        rotation: payload.prevRotation
      })
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, _payload: LogoUpdateRotationPayload) {
      return `Rotate logo`
    }
  },
  'logo.recolor': {
    apply(ctx: HistoryContext, payload: LogoRecolorPayload) {
      const arr = getLogoArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const logoInIndex = arr[payload.index]
      if (!logoInIndex) return
      arr[payload.index] = withLogoPatch(logoInIndex, {
        url: payload.nextImage
      })
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoRecolorPayload) {
      const arr = getLogoArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const logoInIndex = arr[payload.index]
      if (!logoInIndex) return
      arr[payload.index] = withLogoPatch(logoInIndex, {
        url: payload.prevImage
      })
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, _payload: LogoRecolorPayload) {
      return `Recolor logo`
    }
  },
  'pattern.set-group': {
    apply(ctx: HistoryContext, payload: PatternSetGroupPayload) {
      const customizationStore = ctx.customizationStore
      const map = customizationStore.customization?.group_patterns
      if (!map) return
      map[payload.groupName] = payload.next
      customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: PatternSetGroupPayload) {
      const customizationStore = ctx.customizationStore
      const map = customizationStore.customization?.group_patterns
      if (!map) return
      if (payload.prev === undefined) {
        delete map[payload.groupName]
      } else {
        map[payload.groupName] = payload.prev
      }
      customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, p: PatternSetGroupPayload) {
      return `Set pattern group ${p.groupName}`
    }
  },
  'addons.set': {
    apply(ctx: HistoryContext, payload: AddonsSetPayload) {
      const customizationStore = ctx.customizationStore
      const details = ctx.productsStore.activeProductDetails
      const uniq = (arr: number[]) => Array.from(new Set(arr))
      const nextIds = uniq(payload.nextIds)
      type MinimalAddon = { addon_id: number; title: string }
      const companyAddonsRaw: MinimalAddon[] = (details?.company_addons || []).map(
        (a: OutputCompanyAddon) => ({ addon_id: a.addon_id, title: a.addon_data?.title || '' })
      )
      const productAddonsRaw: MinimalAddon[] = (details?.product_addons || []).map(
        (a: OutputAddon) => ({ addon_id: a.addon_id, title: a.title || '' })
      )
      const idToAddon = new Map<number, MinimalAddon>()
      for (const a of companyAddonsRaw) idToAddon.set(a.addon_id, a)
      for (const a of productAddonsRaw) if (!idToAddon.has(a.addon_id)) idToAddon.set(a.addon_id, a)
      const allAddons: MinimalAddon[] = Array.from(idToAddon.values())
      const selected = allAddons
        .filter((a: MinimalAddon) => nextIds.includes(a.addon_id))
        .map((a: MinimalAddon) => ({
          addon_id: a.addon_id,
          title: a.title
        })) as unknown as OutputAddon[]
      customizationStore.setAddons(selected)
    },
    revert(ctx: HistoryContext, payload: AddonsSetPayload) {
      const customizationStore = ctx.customizationStore
      const details = ctx.productsStore.activeProductDetails
      const uniq = (arr: number[]) => Array.from(new Set(arr))
      const prevIds = uniq(payload.prevIds)
      type MinimalAddon = { addon_id: number; title: string }
      const companyAddonsRaw: MinimalAddon[] = (details?.company_addons || []).map(
        (a: OutputCompanyAddon) => ({ addon_id: a.addon_id, title: a.addon_data?.title || '' })
      )
      const productAddonsRaw: MinimalAddon[] = (details?.product_addons || []).map(
        (a: OutputAddon) => ({ addon_id: a.addon_id, title: a.title || '' })
      )
      const idToAddon = new Map<number, MinimalAddon>()
      for (const a of companyAddonsRaw) idToAddon.set(a.addon_id, a)
      for (const a of productAddonsRaw) if (!idToAddon.has(a.addon_id)) idToAddon.set(a.addon_id, a)
      const allAddons: MinimalAddon[] = Array.from(idToAddon.values())
      const selected = allAddons
        .filter((a: MinimalAddon) => prevIds.includes(a.addon_id))
        .map((a: MinimalAddon) => ({
          addon_id: a.addon_id,
          title: a.title
        })) as unknown as OutputAddon[]
      customizationStore.setAddons(selected)
    },
    describe(ctx: HistoryContext, p: AddonsSetPayload) {
      const details = ctx.productsStore.activeProductDetails
      const idToTitle = new Map<number, string>()
      if (details) {
        for (const a of details.company_addons || []) {
          idToTitle.set(a.addon_id, a.addon_data?.title || '')
        }
        for (const a of details.product_addons || []) {
          if (!idToTitle.has(a.addon_id)) idToTitle.set(a.addon_id, a.title || '')
        }
      }
      const uniq = (arr: number[]) => Array.from(new Set(arr))
      const prev = uniq(p.prevIds)
      const next = uniq(p.nextIds)
      const added = next.filter(id => !prev.includes(id))
      const removed = prev.filter(id => !next.includes(id))
      const addedLabels = added.map(id => idToTitle.get(id) || `#${id}`)
      const removedLabels = removed.map(id => idToTitle.get(id) || `#${id}`)
      const addedWord = added.length > 1 ? 'addons' : 'addon'
      const removedWord = removed.length > 1 ? 'addons' : 'addon'
      if (added.length && removed.length)
        return `Updated addons: added ${addedLabels.join(', ')}; removed ${removedLabels.join(', ')}`
      if (added.length) return `Added ${addedWord}: ${addedLabels.join(', ')}`
      if (removed.length) return `Removed ${removedWord}: ${removedLabels.join(', ')}`
      return `No addon changes`
    }
  },
  'roster.add-entry': {
    apply(ctx: HistoryContext, payload: RosterAddEntryPayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      // Insert a clone, as is done for text/logo
      const entryClone = cloneRosterEntry(payload.entry)
      arr.splice(payload.index ?? arr.length, 0, entryClone)
      // Also store the (cloned) entry for revert symmetry
      payload.entry = entryClone
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: RosterAddEntryPayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      // Find the index of the entry to remove, but default to payload.index if present
      const idx = payload.index ?? arr.length - 1
      arr.splice(idx, 1)
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, _payload: RosterAddEntryPayload) {
      return `Add roster entry`
    }
  },
  'roster.remove-entry': {
    apply(ctx: HistoryContext, payload: RosterRemoveEntryPayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      const entry = arr[payload.index]
      if (entry) {
        payload.entry = cloneRosterEntry(entry)
        arr.splice(payload.index, 1)
        ctx.customizationStore.saveToLocalStorage()
      }
    },
    revert(ctx: HistoryContext, payload: RosterRemoveEntryPayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr || payload.entry == null) return
      arr.splice(payload.index, 0, cloneRosterEntry(payload.entry))
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: RosterRemoveEntryPayload) {
      const entry = getRosterArray(ctx, payload.key)?.[payload.index]
      return `Remove roster entry ${entry?.text}`
    }
  },
  'roster.update-name': {
    apply(ctx: HistoryContext, payload: RosterUpdateNamePayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      const entry = arr[payload.index]
      if (!entry) return
      // Create new object reference to trigger reactivity, similar to text.update-value
      arr[payload.index] = { ...entry, text: payload.nextName }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: RosterUpdateNamePayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      const entry = arr[payload.index]
      if (!entry) return
      arr[payload.index] = { ...entry, text: payload.prevName }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: RosterUpdateNamePayload) {
      const entry = getRosterArray(ctx, payload.key)?.[payload.index]
      return `Update roster name ${entry?.text}`
    }
  },
  'roster.update-number': {
    apply(ctx: HistoryContext, payload: RosterUpdateNumberPayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      const entry = arr[payload.index]
      if (!entry) return
      arr[payload.index] = { ...entry, number: payload.nextNumber }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: RosterUpdateNumberPayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      const entry = arr[payload.index]
      if (!entry) return
      arr[payload.index] = { ...entry, number: payload.prevNumber }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: RosterUpdateNumberPayload) {
      const entry = getRosterArray(ctx, payload.key)?.[payload.index]
      return `Update roster number ${entry?.number}`
    }
  },
  'roster.update-size': {
    apply(ctx: HistoryContext, payload: RosterUpdateSizePayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      const entry = arr[payload.index]
      if (!entry) return
      arr[payload.index] = { ...entry, size: payload.nextSize }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: RosterUpdateSizePayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      const entry = arr[payload.index]
      if (!entry) return
      arr[payload.index] = { ...entry, size: payload.prevSize }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: RosterUpdateSizePayload) {
      const entry = getRosterArray(ctx, payload.key)?.[payload.index]
      return `Update roster size ${entry?.size}`
    }
  },
  'roster.update-quantity': {
    apply(ctx: HistoryContext, payload: RosterUpdateQuantityPayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      const entry = arr[payload.index]
      if (!entry) return
      arr[payload.index] = { ...entry, quantity: payload.nextQuantity }
      ctx.customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: RosterUpdateQuantityPayload) {
      const arr = getRosterArray(ctx, payload.key)
      if (!arr) return
      const entry = arr[payload.index]
      if (!entry) return
      arr[payload.index] = { ...entry, quantity: payload.prevQuantity }
      ctx.customizationStore.saveToLocalStorage()
    },
    describe(ctx: HistoryContext, payload: RosterUpdateQuantityPayload) {
      const entry = getRosterArray(ctx, payload.key)?.[payload.index]
      return `Update roster quantity ${entry?.quantity}`
    }
  },
  batch: {
    async apply(
      ctx: HistoryContext,
      payload: { entries: Array<{ type: HistoryActionType; payload: unknown }> }
    ) {
      for (const e of payload.entries) {
        await (registry[e.type] as Handler<unknown>).apply(ctx, e.payload)
      }
    },
    async revert(
      ctx: HistoryContext,
      payload: { entries: Array<{ type: HistoryActionType; payload: unknown }> }
    ) {
      for (const e of [...payload.entries].reverse()) {
        await (registry[e.type] as Handler<unknown>).revert(ctx, e.payload)
      }
    },
    describe(_: HistoryContext, payload: { entries: unknown[]; label?: string }) {
      return payload.label || `Apply ${payload.entries.length} changes`
    }
  }
}
