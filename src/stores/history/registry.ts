import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProductsStore } from '@/stores/products/products.store'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { ActiveProductCustomization } from '@/services/products/types/customization'
import type { CustomLogo } from '@/services/logos/types'
import type {
  HistoryContext,
  HistoryActionType,
  ColorSetGroupPayload,
  TextSetValuePayload,
  LogoAddPayload,
  LogoRemovePayload,
  LogoMovePayload,
  LogoUpdateUrlPayload,
  PatternSetGroupPayload,
  LogoUpdatePlacementPayload,
  LogoUpdateSizePayload,
  LogoUpdateRotationPayload
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
  | Handler<LogoUpdateUrlPayload>
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

function getLogoArray(ctx: HistoryContext, key: string) {
  const map = ctx.customizationStore.customization?.custom_logos
  if (!map) return null
  return map[key] ?? null
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
    url: base.url,
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
    x_axis_3d: base.x_axis_3d,
    y_axis_3d: base.y_axis_3d,
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
      customizationStore.setGroupColor(payload.groupId, payload.nextColor)
    },
    revert(ctx: HistoryContext, payload: ColorSetGroupPayload) {
      const customizationStore = ctx.customizationStore
      if (payload.prevColor) {
        customizationStore.setGroupColor(payload.groupId, payload.prevColor)
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
      return `Set color for ${p.groupId} to ${label}`
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
      const root = customizationStore.customization as ActiveProductCustomization | null
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
        side: payload.nextSide ?? current.side
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
        side: payload.prevSide ?? current.side
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
      let logoInIndex = arr[payload.index]
      if (!logoInIndex) return
      logoInIndex = withLogoPatch(logoInIndex, {
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
    describe(_: HistoryContext, payload: { entries: unknown[]; label?: string }) {
      return payload.label || `Apply ${payload.entries.length} changes`
    }
  }
}
