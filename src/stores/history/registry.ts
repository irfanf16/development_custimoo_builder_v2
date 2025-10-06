import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { ActiveProductCustomization } from '@/services/products/types/customization'
import type {
  HistoryContext,
  HistoryActionType,
  ColorSetGroupPayload,
  TextSetValuePayload,
  LogoAddPayload,
  LogoRemovePayload,
  LogoMovePayload,
  PatternSetGroupPayload
} from './types'

type Handler<T> = {
  apply(ctx: HistoryContext, payload: T): void | Promise<void>
  revert(ctx: HistoryContext, payload: T): void | Promise<void>
  describe(ctx: HistoryContext, payload: T): string
}

type Registry = Record<
  HistoryActionType,
  | Handler<ColorSetGroupPayload>
  | Handler<TextSetValuePayload>
  | Handler<LogoAddPayload>
  | Handler<LogoRemovePayload>
  | Handler<LogoMovePayload>
  | Handler<PatternSetGroupPayload>
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

export const registry: Registry = {
  'color.set-group': {
    apply(ctx: HistoryContext, payload: ColorSetGroupPayload) {
      const customizationStore = ctx.customizationStore
      customizationStore.setGroupColor(payload.groupId, payload.nextColor)
    },
    revert(ctx: HistoryContext, payload: ColorSetGroupPayload) {
      const customizationStore = ctx.customizationStore
      if (payload.prevColor) {
        customizationStore.setGroupColor(payload.groupId, payload.prevColor)
      } else {
        const c =
          customizationStore.customization as ActiveProductCustomization | null
        const colors = c?.group_colors
        if (colors && colors[payload.groupId]) {
          delete colors[payload.groupId]
          customizationStore.saveToLocalStorage()
        }
      }
    },
    describe(_: HistoryContext, p: ColorSetGroupPayload) {
      const label = p.nextColor?.name || p.nextColor?.value || '—'
      return `Set color for ${p.groupId} to ${label}`
    }
  },
  'text.set-value': {
    apply(ctx: HistoryContext, payload: TextSetValuePayload) {
      const customizationStore = ctx.customizationStore
      const root =
        customizationStore.customization as ActiveProductCustomization | null
      if (!root) return
      const map = root.product_custom_texts
      const key = payload.key
      if (!map[key]) map[key] = []
      const arr = map[key]
      let item = arr[payload.index]
      if (!item) {
        item = {
          id: 0,
          product_id: 0,
          type: 'text',
          label: '',
          value: payload.prevValue ?? '',
          following_products: [],
          items: [],
          created_at: null,
          updated_at: null,
          deleted_at: null,
          manually_added: false,
          font_family: '',
          following_product_ids: [],
          active_item_index: 0
        }
        arr[payload.index] = item
      }
      item.value = payload.nextValue
      customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: TextSetValuePayload) {
      const customizationStore = ctx.customizationStore
      const root =
        customizationStore.customization as ActiveProductCustomization | null
      if (!root) return
      const map = root.product_custom_texts
      const key = payload.key
      if (!map[key]) map[key] = []
      const arr = map[key]
      let item = arr[payload.index]
      if (!item) {
        item = {
          id: 0,
          product_id: 0,
          type: 'text',
          label: '',
          value: payload.nextValue ?? '',
          following_products: [],
          items: [],
          created_at: null,
          updated_at: null,
          deleted_at: null,
          manually_added: false,
          font_family: '',
          following_product_ids: [],
          active_item_index: 0
        }
        arr[payload.index] = item
      }
      item.value = payload.prevValue
      customizationStore.saveToLocalStorage()
    },
    describe(_: HistoryContext, p: TextSetValuePayload) {
      return `Change text #${p.index + 1}`
    }
  },
  'logo.add': {
    apply(ctx: HistoryContext, payload: LogoAddPayload) {
      const customizationStore = ctx.customizationStore
      const root =
        customizationStore.customization as ActiveProductCustomization | null
      const map = root?.custom_logos
      if (!map) return
      const arr = map[payload.key] || (map[payload.key] = [])
      const at = payload.index ?? arr.length
      arr.splice(at, 0, payload.logo)
      customizationStore.appendLogoColors(payload.logo.logo_colors)
      customizationStore.saveToLocalStorage()
    },
    revert(ctx: HistoryContext, payload: LogoAddPayload) {
      const customizationStore = ctx.customizationStore
      const root =
        customizationStore.customization as ActiveProductCustomization | null
      const map = root?.custom_logos
      if (!map) return
      const arr = map[payload.key]
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
      const root =
        customizationStore.customization as ActiveProductCustomization | null
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
      const root =
        customizationStore.customization as ActiveProductCustomization | null
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
    describe(
      _: HistoryContext,
      payload: { entries: unknown[]; label?: string }
    ) {
      return payload.label || `Apply ${payload.entries.length} changes`
    }
  }
}
