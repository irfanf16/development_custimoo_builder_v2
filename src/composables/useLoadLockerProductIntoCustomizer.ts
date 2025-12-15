import { ref } from 'vue'
import { tryCatchApi } from '@/stores/utils'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import lockersService from '@/services/lockers/lockers.service'
import type {
  ActiveProductCustomization,
  APCustomizationDefaultColor,
  APCustomizationGroupColor,
  APCustomizationLogosMap,
  OutputProductText,
  OutputProductTextItem
} from '@/services/products/types'
import type { LockerProduct, ProductRosterDetail } from '@/services/lockers/types'
import type { CustomLogo } from '@/services/logos/types'
import type { APCustomizationRosterEntry } from '@/services/products/types/customization'

function parseMaybeJson<T>(value: unknown): T | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      return JSON.parse(trimmed) as T
    } catch {
      return null
    }
  }
  if (typeof value === 'object') {
    return value as T
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asSafeString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return ''
}

function asSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isNaN(n) ? fallback : n
  }
  return fallback
}

function normalizeDefaultColors(value: unknown): APCustomizationDefaultColor[] | null {
  const parsed = parseMaybeJson<unknown>(value)
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(value) ? value : null
  if (!arr) return null
  return arr
    .map(item => {
      if (!isRecord(item)) return null
      const color = typeof item.color === 'string' ? item.color : null
      const pantone = typeof item.pantone === 'string' ? item.pantone : null
      const name = typeof item.name === 'string' ? item.name : null
      return { color, pantone, name } satisfies APCustomizationDefaultColor
    })
    .filter((x): x is APCustomizationDefaultColor => x != null)
}

function normalizeGroupColors(value: unknown): Record<string, APCustomizationGroupColor> | null {
  const parsed = parseMaybeJson<unknown>(value) ?? value
  if (!isRecord(parsed)) return null
  const out: Record<string, APCustomizationGroupColor> = {}
  for (const [key, raw] of Object.entries(parsed)) {
    if (!isRecord(raw)) continue
    const color = typeof raw.color === 'string' ? raw.color : null
    const name = typeof raw.name === 'string' ? raw.name : null
    const gradientRaw = raw.gradient_colors
    const gradient =
      Array.isArray(gradientRaw) &&
      gradientRaw
        .map(gc => {
          if (!isRecord(gc)) return null
          const c = typeof gc.color === 'string' ? gc.color : null
          const p = typeof gc.pantone === 'string' ? gc.pantone : null
          const n = typeof gc.name === 'string' ? gc.name : null
          if (!c || !p || !n) return null
          return { color: c, pantone: p, name: n }
        })
        .filter((x): x is { color: string; pantone: string; name: string } => x != null)

    out[key] = {
      color,
      name,
      ...(gradient && gradient.length ? { gradient_colors: gradient } : {})
    }
  }
  return out
}

function normalizeCustomLogos(
  value: unknown,
  productId: number
): { map: APCustomizationLogosMap } | null {
  const parsed = parseMaybeJson<unknown>(value) ?? value
  if (!parsed) return null

  // Map format: Record<string, CustomLogo[]>
  if (isRecord(parsed)) {
    const out: APCustomizationLogosMap = {}
    for (const [key, rawArr] of Object.entries(parsed)) {
      if (!Array.isArray(rawArr)) continue
      out[key] = rawArr as CustomLogo[]
    }
    return { map: out }
  }

  // Array format: CustomLogo[] (assume for active product)
  if (Array.isArray(parsed)) {
    const out: APCustomizationLogosMap = {}
    out[String(productId)] = parsed as CustomLogo[]
    return { map: out }
  }

  return null
}

function normalizeTexts(value: unknown, productId: number): OutputProductText[] | null {
  const parsed = parseMaybeJson<unknown>(value) ?? value
  const arr = Array.isArray(parsed) ? parsed : null
  if (!arr) return null

  const mapped: Array<OutputProductText | null> = arr.map(raw => {
    if (!isRecord(raw)) return null

    const itemsRaw = raw.items
    const items: OutputProductTextItem[] = Array.isArray(itemsRaw)
      ? itemsRaw
          .map(it => {
            if (!isRecord(it)) return null
            // Locker payload sometimes uses numbers; product types are strings for positioning.
            const height = asSafeString(it.height)
            const x_axis = asSafeString(it.x_axis)
            const y_axis = asSafeString(it.y_axis)
            const rotation = asSafeString(it.rotation)

            return {
              label: asSafeString(it.label),
              height,
              x_axis,
              y_axis,
              rotation,
              is_locked: Boolean(it.is_locked),
              placement: (asSafeString(it.placement) as 'Front' | 'Back') || 'Front',
              outline_enabled: Boolean(it.outline_enabled),
              arc_text_allowed: Boolean(it.arc_text_allowed),
              font_family: asSafeString(it.font_family),
              color: asSafeString(it.color),
              color_pantone: asSafeString(it.color_pantone),
              outline_width: asSafeNumber(it.outline_width, 0),
              outline_width_converted: asSafeNumber(it.outline_width_converted, 0),
              color_tab_index: asSafeNumber(it.color_tab_index, 0),
              outline_color: asSafeString(it.outline_color),
              outline_color_pantone: asSafeString(it.outline_color_pantone),
              selected: Boolean(it.selected),
              scaleX: asSafeNumber(it.scaleX, 1),
              scaleY: asSafeNumber(it.scaleY, 1)
            } satisfies OutputProductTextItem
          })
          .filter((x): x is OutputProductTextItem => x != null)
      : []

    const id = asSafeNumber(raw.id, 0)
    const type = (asSafeString(raw.type) as OutputProductText['type']) || 'name'

    return {
      id,
      product_id: asSafeNumber(raw.product_id, productId),
      type,
      label: asSafeString(raw.label),
      placeholder: raw.placeholder == null ? undefined : asSafeString(raw.placeholder),
      following_products: Array.isArray(raw.following_products)
        ? raw.following_products.map(n => Number(n)).filter(n => !Number.isNaN(n))
        : [],
      items,
      created_at: raw.created_at == null ? null : asSafeString(raw.created_at),
      updated_at: raw.updated_at == null ? null : asSafeString(raw.updated_at),
      deleted_at: raw.deleted_at == null ? null : asSafeString(raw.deleted_at),
      value: asSafeString(raw.value),
      manually_added: Boolean(raw.manually_added),
      font_family: asSafeString(raw.font_family),
      following_product_ids: Array.isArray(raw.following_product_ids)
        ? raw.following_product_ids.map(n => Number(n)).filter(n => !Number.isNaN(n))
        : [],
      active_item_index: asSafeNumber(raw.active_item_index, 0),
      is_first_name: raw.is_first_name == null ? undefined : Boolean(raw.is_first_name),
      is_first_number: raw.is_first_number == null ? undefined : Boolean(raw.is_first_number),
      is_default: raw.is_default == null ? undefined : Boolean(raw.is_default)
    } satisfies OutputProductText
  })

  return mapped.filter((x): x is OutputProductText => x != null && x.id !== 0)
}

function normalizeRosterEntries(
  roster: ProductRosterDetail[] | undefined
): APCustomizationRosterEntry[] {
  if (!roster || !Array.isArray(roster)) return []
  return roster.map(entry => ({
    text: entry.text ?? '',
    number: entry.number ?? '',
    size: entry.size ?? '',
    quantity: Number(entry.quantity ?? 0),
    information: entry.information ?? ''
  }))
}

function buildCustomizationFromLocker(
  locker: LockerProduct,
  base: ActiveProductCustomization,
  designName: string
): ActiveProductCustomization {
  const productKey = String(locker.product_id)

  const defaultColors = normalizeDefaultColors(locker.defaultcolors)
  const groupColors = normalizeGroupColors(locker.groupcolors)
  const logos = normalizeCustomLogos(locker.custom_logos, locker.product_id)
  const texts = normalizeTexts(locker.text, locker.product_id)
  const rosterEntries = normalizeRosterEntries(locker.product_roster_detail)
  const lockerRecord = locker as unknown as Record<string, unknown>
  const productCustomTextsRaw = lockerRecord['product_custom_texts']
  const fixedLogoIndexRaw = lockerRecord['fixed_logo_index']
  const shuffleColorNumberRaw = lockerRecord['shuffle_color_number']
  const groupPatternsRaw = lockerRecord['group_patterns']

  const next: ActiveProductCustomization = {
    ...base,
    product_id: locker.product_id,
    style_id: locker.style_id,
    design_id: locker.design_id,
    design_name: designName
  }

  if (typeof fixedLogoIndexRaw === 'number') next.fixed_logo_index = fixedLogoIndexRaw
  if (typeof shuffleColorNumberRaw === 'number') next.shuffle_color_number = shuffleColorNumberRaw
  if (isRecord(groupPatternsRaw)) next.group_patterns = groupPatternsRaw

  if (defaultColors?.length) next.default_colors = defaultColors
  if (groupColors && Object.keys(groupColors).length) next.group_colors = groupColors
  if (logos?.map && Object.keys(logos.map).length) next.custom_logos = logos.map

  // Some locker payloads provide the full texts map directly as `product_custom_texts`.
  // Prefer that over `text` when present so we don't lose user edits.
  if (isRecord(productCustomTextsRaw)) {
    next.product_custom_texts =
      productCustomTextsRaw as unknown as ActiveProductCustomization['product_custom_texts']
  } else if (texts?.length) {
    next.product_custom_texts = { ...next.product_custom_texts, [productKey]: texts }
  }

  if (rosterEntries.length)
    next.products_rosters = { ...next.products_rosters, [productKey]: rosterEntries }

  return next
}

export function useLoadLockerProductIntoCustomizer() {
  const isLoading = ref(false)

  const findActiveProductIdFromPreviews = (
    baseProductId: number,
    previews: Array<{ productPreview?: { id?: number; product_id?: number } }> | null | undefined
  ): number | null => {
    if (!baseProductId || !previews || !Array.isArray(previews)) return null
    const hit = previews.find(p => p?.productPreview?.product_id === baseProductId)
    const mapped = hit?.productPreview?.id
    return typeof mapped === 'number' && mapped > 0 ? mapped : null
  }

  async function loadLockerProductIntoCustomizer(
    lockerProductId: number,
    fallbackLockerProduct?: LockerProduct
  ): Promise<boolean> {
    const productsStore = useProductsStore()
    const customizationStore = useCustomizationStore()

    isLoading.value = true
    productsStore.suspendCustomizationAutoSync()
    try {
      const resp = await tryCatchApi(lockersService.getLockerProductDetails(lockerProductId))

      const lockerResult: unknown =
        resp.success && resp.content?.result
          ? resp.content.result
          : fallbackLockerProduct
            ? { factoryProducts: [fallbackLockerProduct], factoryProductActiveIndex: 0 }
            : null

      if (!lockerResult) {
        return false
      }

      if (!resp.success || !resp.content?.result) {
        // Using fallback locker product snapshot due to API failure/missing result
      }

      // If the API returns a container object with factoryProducts, probe the active entry.
      if (isRecord(lockerResult) && Array.isArray(lockerResult.factoryProducts)) {
        // Probe logic removed - was only used for debug logging
      }

      // Resolve the actual locker product payload.
      // Evidence shows `result` can be a container with `factoryProducts` instead of the product itself.
      let lockerProductResolved: unknown = lockerResult
      if (isRecord(lockerResult) && Array.isArray(lockerResult.factoryProducts)) {
        const idxRaw = lockerResult.factoryProductActiveIndex
        const idx =
          typeof idxRaw === 'number' ? idxRaw : typeof idxRaw === 'string' ? Number(idxRaw) : 0
        lockerProductResolved =
          (lockerResult.factoryProducts[idx] as unknown) ??
          (lockerResult.factoryProducts[0] as unknown)
      }

      if (!isRecord(lockerProductResolved)) {
        return false
      }

      const lockerProduct = lockerProductResolved as unknown as LockerProduct
      const rawProductId = lockerProductResolved['product_id'] ?? lockerProductResolved['productId']
      const rawStyleId = lockerProductResolved['style_id'] ?? lockerProductResolved['styleId']
      const rawDesignId = lockerProductResolved['design_id'] ?? lockerProductResolved['designId']

      const lockerBaseProductId = asSafeNumber(rawProductId, 0) || 0
      let productId = lockerBaseProductId
      const styleId = asSafeNumber(rawStyleId, 0) || 0
      const designId = asSafeNumber(rawDesignId, 0) || 0

      if (!productId) {
        return false
      }

      // Load the base product/style/design via existing products flow
      const productResp = await productsStore.fetchActiveProductDetails(productId)
      if (!productResp?.success) {
        // If the locker payload uses a *base* product_id that isn't valid for GET product/{id},
        // try mapping it to the active product id via previews (OutputProductPreview.id).
        if (productResp?.status === 404 && lockerBaseProductId) {
          // First try: derive active product id from style details (style_id tends to be stable).
          if (styleId) {
            await productsStore.fetchActiveStyleDetails(styleId)

            const derivedProductId = productsStore.activeStyleDetails?.product_id
            if (typeof derivedProductId === 'number' && derivedProductId > 0) {
              productId = derivedProductId
              const retryFromStyle = await productsStore.fetchActiveProductDetails(productId)

              if (retryFromStyle?.success) {
                // continue pipeline with resolved productId
              } else {
                // fall through to preview mapping
                productId = lockerBaseProductId
              }
            }
          }

          // Try existing previews first (no extra requests)
          let mappedId = findActiveProductIdFromPreviews(
            lockerBaseProductId,
            productsStore.productPreviews
          )

          // Try fetching previews in current category context if not found
          if (!mappedId) {
            const catId = customizationStore.activeCategoryId ?? null
            const subId = customizationStore.activeSubCategoryId ?? undefined
            await productsStore.fetchProductPreviews(catId, subId || undefined)
            mappedId = findActiveProductIdFromPreviews(
              lockerBaseProductId,
              productsStore.productPreviews
            )
          }

          // Last resort: try fetching previews with no category constraint
          if (!mappedId) {
            await productsStore.fetchProductPreviews(null)
            mappedId = findActiveProductIdFromPreviews(
              lockerBaseProductId,
              productsStore.productPreviews
            )
          }

          if (!mappedId) return false
          productId = mappedId

          const retry = await productsStore.fetchActiveProductDetails(productId)
          if (!retry?.success) return false
        } else {
          return false
        }
      }

      await productsStore.fetchStylePreviews(productId)

      if (styleId && productsStore.activeStyleDetails?.id !== styleId) {
        const activeStyleResp = await productsStore.fetchActiveStyleDetails(styleId)
        if (!activeStyleResp?.success) return false
      }
      if (designId && productsStore.activeDesignDetails?.id !== designId) {
        const designResp = await productsStore.fetchDesignDetailsById(designId)
        if (!designResp?.success) {
          // Locker design_id can refer to a locker-specific artifact and not exist in product/style/design endpoint.
          // Fallback to whatever design was loaded via active product/style.
        } else if (productsStore.activeDesignDetails) {
          customizationStore.setDesign(productsStore.activeDesignDetails)
        }
      }

      // Replace customization with a locker-hydrated snapshot
      const preservedCategoryId = customizationStore.activeCategoryId ?? 0
      const preservedSubCategoryId = customizationStore.activeSubCategoryId ?? null
      const effectiveStyleId = productsStore.activeStyleDetails?.id ?? styleId
      const effectiveDesignId = productsStore.activeDesignDetails?.id ?? designId
      const baseCustomization = customizationStore.createDefaultCustomization({
        productId,
        styleId: effectiveStyleId,
        designId: effectiveDesignId,
        categoryId: preservedCategoryId,
        subCategoryId: preservedSubCategoryId
      })

      const designName = productsStore.activeDesignDetails?.design_name ?? ''
      const lockerProductForCustomizer = {
        ...(lockerProduct as unknown as Record<string, unknown>),
        product_id: productId
      } as unknown as LockerProduct
      const nextCustomization = buildCustomizationFromLocker(
        lockerProductForCustomizer,
        baseCustomization,
        designName
      )

      // If locker payload maps were keyed by base product id, copy them to the resolved active product id.
      if (lockerBaseProductId && lockerBaseProductId !== productId) {
        const fromKey = String(lockerBaseProductId)
        const toKey = String(productId)

        if (
          nextCustomization.product_custom_texts[fromKey] &&
          !nextCustomization.product_custom_texts[toKey]
        ) {
          nextCustomization.product_custom_texts[toKey] =
            nextCustomization.product_custom_texts[fromKey]!
        }
        if (nextCustomization.custom_logos[fromKey] && !nextCustomization.custom_logos[toKey]) {
          nextCustomization.custom_logos[toKey] = nextCustomization.custom_logos[fromKey]!
        }
        if (
          nextCustomization.products_rosters[fromKey] &&
          !nextCustomization.products_rosters[toKey]
        ) {
          nextCustomization.products_rosters[toKey] = nextCustomization.products_rosters[fromKey]!
        }
      }

      customizationStore.setCustomization(nextCustomization)

      return true
    } finally {
      productsStore.resumeCustomizationAutoSync()
      isLoading.value = false
    }
  }

  return { isLoading, loadLockerProductIntoCustomizer }
}
