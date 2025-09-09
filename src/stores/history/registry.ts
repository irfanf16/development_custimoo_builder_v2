import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
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

type Registry = Record<HistoryActionType, Handler<any>>

export function createHistoryContext(): HistoryContext {
  return {
    customizationStore: useCustomizationStore(),
    productsStore: useProductsStore(),
    workflowStore: useWorkflowStore()
  }
}

export const registry: Registry = {
  'color.set-group': {
    apply({ customizationStore }, payload: ColorSetGroupPayload) {
      customizationStore.setGroupColor(payload.groupId, payload.nextColor)
    },
    revert({ customizationStore }, payload: ColorSetGroupPayload) {
      if (payload.prevColor) {
        customizationStore.setGroupColor(payload.groupId, payload.prevColor)
      } else {
        const c = customizationStore.customization
        if (c && c.group_colors && c.group_colors[payload.groupId]) {
          delete c.group_colors[payload.groupId]
          customizationStore.saveToLocalStorage()
        }
      }
    },
    describe(_, p: ColorSetGroupPayload) {
      const label = p.nextColor?.name || p.nextColor?.value || '—'
      return `Set color for ${p.groupId} to ${label}`
    }
  },
  'text.set-value': {
    apply({ customizationStore }, payload: TextSetValuePayload) {
      const root = customizationStore.customization
      if (!root) return
      const map = root.product_custom_texts as any
      const key = payload.key
      if (!map[key]) map[key] = []
      const arr = map[key]
      if (!arr[payload.index])
        arr[payload.index] = { value: payload.prevValue ?? '' }
      arr[payload.index].value = payload.nextValue
      customizationStore.saveToLocalStorage()
    },
    revert({ customizationStore }, payload: TextSetValuePayload) {
      const root = customizationStore.customization
      if (!root) return
      const map = root.product_custom_texts as any
      const key = payload.key
      if (!map[key]) map[key] = []
      const arr = map[key]
      if (!arr[payload.index])
        arr[payload.index] = { value: payload.nextValue ?? '' }
      arr[payload.index].value = payload.prevValue
      customizationStore.saveToLocalStorage()
    },
    describe(_, p) {
      return `Change text #${p.index + 1}`
    }
  },
  'logo.add': {
    apply({ customizationStore }, payload: LogoAddPayload) {
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = (map as any)[payload.key] || ((map as any)[payload.key] = [])
      const at = payload.index ?? arr.length
      arr.splice(at, 0, payload.logo)
      customizationStore.saveToLocalStorage()
    },
    revert({ customizationStore }, payload: LogoAddPayload) {
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = (map as any)[payload.key]
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
    apply({ customizationStore }, payload: LogoRemovePayload) {
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = (map as any)[payload.key]
      if (!arr || payload.index < 0 || payload.index >= arr.length) return
      payload.logo = arr[payload.index]
      arr.splice(payload.index, 1)
      customizationStore.saveToLocalStorage()
    },
    revert({ customizationStore }, payload: LogoRemovePayload) {
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = (map as any)[payload.key] || ((map as any)[payload.key] = [])
      if (!payload.logo) return
      arr.splice(payload.index, 0, payload.logo)
      customizationStore.saveToLocalStorage()
    },
    describe() {
      return `Remove logo`
    }
  },
  'logo.move': {
    apply({ customizationStore }, payload: LogoMovePayload) {
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = (map as any)[payload.key]
      if (!arr) return
      const [item] = arr.splice(payload.from, 1)
      arr.splice(payload.to, 0, item)
      customizationStore.saveToLocalStorage()
    },
    revert({ customizationStore }, payload: LogoMovePayload) {
      const map = customizationStore.customization?.custom_logos
      if (!map) return
      const arr = (map as any)[payload.key]
      if (!arr) return
      const [item] = arr.splice(payload.to, 1)
      arr.splice(payload.from, 0, item)
      customizationStore.saveToLocalStorage()
    },
    describe() {
      return `Move logo`
    }
  },
  'pattern.set-group': {
    apply({ customizationStore }, payload: PatternSetGroupPayload) {
      const map = customizationStore.customization?.group_patterns
      if (!map) return
      ;(map as any)[payload.groupName] = payload.next
      customizationStore.saveToLocalStorage()
    },
    revert({ customizationStore }, payload: PatternSetGroupPayload) {
      const map = customizationStore.customization?.group_patterns
      if (!map) return
      if (payload.prev === undefined) {
        delete (map as any)[payload.groupName]
      } else {
        ;(map as any)[payload.groupName] = payload.prev
      }
      customizationStore.saveToLocalStorage()
    },
    describe(_, p) {
      return `Set pattern group ${p.groupName}`
    }
  },
  batch: {
    apply(
      ctx,
      payload: { entries: Array<{ type: HistoryActionType; payload: any }> }
    ) {
      for (const e of payload.entries) registry[e.type].apply(ctx, e.payload)
    },
    revert(
      ctx,
      payload: { entries: Array<{ type: HistoryActionType; payload: any }> }
    ) {
      for (const e of [...payload.entries].reverse())
        registry[e.type].revert(ctx, e.payload)
    },
    describe(_, payload: { entries: any[]; label?: string }) {
      return payload.label || `Apply ${payload.entries.length} changes`
    }
  }
}
