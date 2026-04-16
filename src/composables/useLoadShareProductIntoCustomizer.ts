import { ref, computed } from 'vue'
import { useTryCatchApi } from '@/composables/useTryCatchApi'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useAppStore } from '@/stores/app/app.store'
import { API } from '@/services'
import { msg_share_product_not_found_show_default } from '@/paraglide/messages'
import type {
  ActiveProductCustomization,
  APCustomizationDefaultColor,
  APCustomizationGroupColor,
  APCustomizationLogosMap,
  OutputProductText,
  OutputProductTextItem,
  ProductRosterDetail
} from '@/services/products/types'
import type { FactoryProduct as CartFactoryProduct } from '@/services/cart/types'
import type { CustomLogo } from '@/services/logos/types'
import type {
  APCustomizationRosterEntry,
  CustomSvgGroupDisplay
} from '@/services/products/types/customization'

export type ShareProductDetails = {
  factoryProducts: CartFactoryProduct[]
  factoryProductActiveIndex: number
  lockerProductId: number | null
  activityId: number | null
  activityItems: unknown
  cartId: number | null
  factoryId: number | null
  id: number | null
  orderId: number | null
}

// ===== UTILITY FUNCTIONS =====

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

/** First non-empty string from record (supports camelCase + snake_case from API). */
function pickFirstString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) continue
    const v = record[key]
    if (v == null) continue
    const s = asSafeString(v)
    if (s !== '') return s
  }
  return ''
}

function normalizeNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value.map(n => Number(n)).filter(n => !Number.isNaN(n))
}

// ===== NORMALIZATION FUNCTIONS =====

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

  // Track temporary ID generation for texts with id: 0
  let tempIdCounter = -1

  const mapped: Array<OutputProductText | null> = arr.map(raw => {
    if (!isRecord(raw)) return null

    const itemsRaw = raw.items
    const items: OutputProductTextItem[] = Array.isArray(itemsRaw)
      ? itemsRaw
          .map((it): OutputProductTextItem | null => {
            if (!isRecord(it)) return null
            const height = asSafeString(it.height)
            const placementWidth = pickFirstString(it, 'width', 'Width') || height
            const originalWidthStored = pickFirstString(it, 'originalWidth', 'original_width')
            const originalHeightStored = pickFirstString(it, 'originalHeight', 'original_height')
            const x_axis = asSafeString(it.x_axis)
            const y_axis = asSafeString(it.y_axis)
            const rotation = asSafeString(it.rotation)

            const item: OutputProductTextItem = {
              label: asSafeString(it.label),
              height,
              width: placementWidth,
              originalWidth: originalWidthStored || placementWidth || height,
              originalHeight: originalHeightStored || height,
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
              scaleY: asSafeNumber(it.scaleY, 1),
              pinned: Boolean(it.pinned)
            }
            return item
          })
          .filter((x): x is OutputProductTextItem => x !== null)
      : []

    let id = asSafeNumber(raw.id, 0)
    const type = (asSafeString(raw.type) as OutputProductText['type']) || 'name'

    // If id is 0 or missing, assign a temporary negative ID and mark as manually added
    const needsTempId = id === 0
    if (needsTempId) {
      id = tempIdCounter--
    }

    return {
      id,
      product_id: asSafeNumber(raw.product_id, productId),
      type,
      label: asSafeString(raw.label),
      placeholder: raw.placeholder == null ? undefined : asSafeString(raw.placeholder),
      following_products: normalizeNumberArray(raw.following_products),
      items,
      created_at: raw.created_at == null ? null : asSafeString(raw.created_at),
      updated_at: raw.updated_at == null ? null : asSafeString(raw.updated_at),
      deleted_at: raw.deleted_at == null ? null : asSafeString(raw.deleted_at),
      value: asSafeString(raw.value),
      manually_added: needsTempId || Boolean(raw.manually_added),
      font_family: asSafeString(raw.font_family),
      following_product_ids: normalizeNumberArray(raw.following_product_ids),
      active_item_index: asSafeNumber(raw.active_item_index, 0),
      is_first_name: raw.is_first_name == null ? undefined : Boolean(raw.is_first_name),
      is_first_number: raw.is_first_number == null ? undefined : Boolean(raw.is_first_number),
      is_default: raw.is_default == null ? undefined : Boolean(raw.is_default)
    } satisfies OutputProductText
  })

  return mapped.filter((x): x is OutputProductText => x != null)
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

// ===== SHARE PRODUCT RESOLUTION =====

export function resolveShareProduct(shareResult: ShareProductDetails): CartFactoryProduct | null {
  if (!Array.isArray(shareResult.factoryProducts)) {
    return null
  }

  const factoryProducts = shareResult.factoryProducts
  if (factoryProducts.length === 0) {
    return null
  }

  const idx = shareResult.factoryProductActiveIndex ?? 0
  const resolvedItem = factoryProducts[idx] ?? factoryProducts[0]

  if (isRecord(resolvedItem)) {
    return resolvedItem as unknown as CartFactoryProduct
  }

  return null
}

export function extractShareProductIds(factoryProduct: Record<string, unknown>): {
  productId: number
  styleId: number
  designId: number
} {
  const rawProductId = factoryProduct['product_id'] ?? factoryProduct['productId']
  const rawStyleId = factoryProduct['style_id'] ?? factoryProduct['styleId']
  const rawDesignId = factoryProduct['design_id'] ?? factoryProduct['designId']

  return {
    productId: asSafeNumber(rawProductId, 0) || 0,
    styleId: asSafeNumber(rawStyleId, 0) || 0,
    designId: asSafeNumber(rawDesignId, 0) || 0
  }
}

// ===== PRODUCT ID MAPPING =====

function findActiveProductIdFromPreviews(
  baseProductId: number,
  previews: Array<{ productPreview?: { id?: number; product_id?: number } }> | null | undefined
): number | null {
  if (!baseProductId || !previews || !Array.isArray(previews)) return null
  const hit = previews.find(p => p?.productPreview?.product_id === baseProductId)
  const mapped = hit?.productPreview?.id
  return typeof mapped === 'number' && mapped > 0 ? mapped : null
}

export async function resolveActiveProductId(
  shareBaseProductId: number,
  styleId: number,
  productsStore: ReturnType<typeof useProductsStore>,
  customizationStore: ReturnType<typeof useCustomizationStore>
): Promise<number | null> {
  // First try: derive active product id from style details (style_id tends to be stable)
  if (styleId) {
    await productsStore.fetchActiveStyleDetails(styleId)
    const derivedProductId = productsStore.activeStyleDetails?.product_id
    if (typeof derivedProductId === 'number' && derivedProductId > 0) {
      const retryFromStyle = await productsStore.fetchActiveProductDetails(derivedProductId)
      if (retryFromStyle?.success) {
        return derivedProductId
      }
    }
  }

  // Try existing previews first (no extra requests)
  let mappedId = findActiveProductIdFromPreviews(shareBaseProductId, productsStore.productPreviews)
  if (mappedId) return mappedId

  // Try fetching previews in current category context
  const catId = customizationStore.activeCategoryId ?? null
  const subId = customizationStore.activeSubCategoryId ?? undefined
  await productsStore.fetchProductPreviews(catId, subId || undefined)
  mappedId = findActiveProductIdFromPreviews(shareBaseProductId, productsStore.productPreviews)
  if (mappedId) return mappedId

  // Last resort: try fetching previews with no category constraint
  await productsStore.fetchProductPreviews(null)
  mappedId = findActiveProductIdFromPreviews(shareBaseProductId, productsStore.productPreviews)
  if (mappedId) return mappedId

  return null
}

// ===== CUSTOMIZATION BUILDING =====

function extractShareCustomTexts(
  productCustomTextsRaw: unknown,
  productKey: string,
  productId: number
): OutputProductText[] | null {
  if (isRecord(productCustomTextsRaw)) {
    // If it's a Record, extract texts for the product key or normalize all entries
    const textsForProduct = Array.isArray(productCustomTextsRaw[productKey])
      ? (productCustomTextsRaw[productKey] as unknown[])
      : null

    if (textsForProduct) {
      return normalizeTexts(textsForProduct, productId)
    }

    // If it's a Record but not keyed by productKey, try to normalize all values
    const allTexts: OutputProductText[] = []
    for (const key in productCustomTextsRaw) {
      const value = productCustomTextsRaw[key]
      if (Array.isArray(value)) {
        const normalized = normalizeTexts(value, productId)
        if (normalized) {
          allTexts.push(...normalized)
        }
      }
    }
    return allTexts.length > 0 ? allTexts : null
  }

  if (Array.isArray(productCustomTextsRaw)) {
    // Handle case where product_custom_texts is an array (like the `text` field format)
    return normalizeTexts(productCustomTextsRaw, productId)
  }

  return null
}

export function buildCustomizationFromShareProduct(
  factoryProduct: CartFactoryProduct,
  base: ActiveProductCustomization,
  designName: string
): ActiveProductCustomization {
  const productKey = String(factoryProduct.product_id)
  const factoryProductRecord = factoryProduct as unknown as Record<string, unknown>

  // Access color fields via record to handle cases where they might not be in the type definition
  const defaultColors = normalizeDefaultColors(factoryProductRecord['defaultcolors'])
  const groupColors = normalizeGroupColors(factoryProductRecord['groupcolors'])
  const logos = normalizeCustomLogos(factoryProduct.custom_logos, factoryProduct.product_id)
  const texts = normalizeTexts(factoryProduct.product_custom_texts, factoryProduct.product_id)
  const rosterEntries = normalizeRosterEntries(factoryProduct.product_roster_detail ?? undefined)
  const productCustomTextsRaw = factoryProductRecord['product_custom_texts']
  const fixedLogoIndexRaw = factoryProductRecord['fixed_logo_index']
  const shuffleColorNumberRaw = factoryProductRecord['shuffle_color_number']
  const groupPatternsRaw = factoryProductRecord['group_patterns']

  // Extract category_id and sub_category_id from share product
  const categoryId = factoryProductRecord['category_id']
  const subCategoryId = factoryProductRecord['sub_category_id']

  const next: ActiveProductCustomization = {
    ...base,
    product_id: factoryProduct.product_id,
    style_id: factoryProduct.style_id,
    design_id: factoryProduct.design_id,
    design_name: designName
  }

  // Set category_id only if it's a number
  if (typeof categoryId === 'number') {
    next.category_id = categoryId
  }

  // Set sub_category_id if it's a number or null
  if (typeof subCategoryId === 'number') {
    next.sub_category_id = subCategoryId
  } else if (subCategoryId === null) {
    next.sub_category_id = null
  }

  if (typeof fixedLogoIndexRaw === 'number') next.fixed_logo_index = fixedLogoIndexRaw
  if (typeof shuffleColorNumberRaw === 'number') next.shuffle_color_number = shuffleColorNumberRaw
  if (isRecord(groupPatternsRaw)) next.group_patterns = groupPatternsRaw

  if (defaultColors?.length) next.default_colors = defaultColors
  if (groupColors && Object.keys(groupColors).length) next.group_colors = groupColors
  if (logos?.map && Object.keys(logos.map).length) next.custom_logos = logos.map

  // Replace the entire product_custom_texts object with share texts (preserving IDs from share)
  const finalShareTexts =
    extractShareCustomTexts(productCustomTextsRaw, productKey, factoryProduct.product_id) ?? texts

  // Replace the entire product_custom_texts object (not merge) with share texts
  if (finalShareTexts && finalShareTexts.length > 0) {
    next.product_custom_texts = {
      [productKey]: finalShareTexts
    }
  }

  if (rosterEntries.length)
    next.products_rosters = { ...next.products_rosters, [productKey]: rosterEntries }

  // Extract custom svg groups (is_custom: true) for readonly display in color step
  const rawSvgGroups = factoryProductRecord['svg_groups']
  if (Array.isArray(rawSvgGroups) && rawSvgGroups.length > 0) {
    const customGroups: CustomSvgGroupDisplay[] = rawSvgGroups
      .filter((g: unknown) => isRecord(g) && (g as { is_custom?: boolean }).is_custom === true)
      .map((g: unknown) => {
        const r = g as Record<string, unknown>
        return {
          id: asSafeString(r.id),
          name: asSafeString(r.name),
          color: asSafeString(r.color),
          pantone: asSafeString(r.pantone) || undefined
        } satisfies CustomSvgGroupDisplay
      })
    if (customGroups.length > 0) {
      next.custom_svg_groups = customGroups
    }
  }

  return next
}

// ===== PRODUCT ID REMAPPING =====

export function remapProductIdKeys(
  customization: ActiveProductCustomization,
  fromProductId: number,
  toProductId: number
): void {
  if (fromProductId === toProductId) return

  const fromKey = String(fromProductId)
  const toKey = String(toProductId)

  // Remap product_custom_texts
  if (customization.product_custom_texts[fromKey] && !customization.product_custom_texts[toKey]) {
    customization.product_custom_texts[toKey] = customization.product_custom_texts[fromKey]!
  }

  // Remap custom_logos
  if (customization.custom_logos[fromKey] && !customization.custom_logos[toKey]) {
    customization.custom_logos[toKey] = customization.custom_logos[fromKey]!
  }

  // Remap products_rosters
  if (customization.products_rosters[fromKey] && !customization.products_rosters[toKey]) {
    customization.products_rosters[toKey] = customization.products_rosters[fromKey]!
  }
}

// ===== PRESET TEXT UPDATES =====

export function updatePresetTextsWithShareFlags(
  presetTexts: OutputProductText[],
  shareTexts: OutputProductText[]
): OutputProductText[] {
  const shareFirstNameText = shareTexts.find(t => t.type === 'name' && t.is_first_name === true)
  const shareFirstNumberText = shareTexts.find(
    t => t.type === 'number' && t.is_first_number === true
  )

  return presetTexts.map(presetText => {
    if (shareFirstNameText && presetText.type === 'name' && presetText.is_first_name === true) {
      return shareFirstNameText
    }
    if (
      shareFirstNumberText &&
      presetText.type === 'number' &&
      presetText.is_first_number === true
    ) {
      return shareFirstNumberText
    }
    return presetText
  })
}

// ===== MAIN COMPOSABLE =====

export function useLoadShareProductIntoCustomizer() {
  const isLoading = ref(false)
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const { tryCatchApi } = useTryCatchApi({
    defaultProperties: { composable: 'useLoadShareProductIntoCustomizer' }
  })

  function showShareNotFoundToast() {
    // Toast runs during app init before Toaster is mounted; store message for WidgetApp to show after mount
    const message = msg_share_product_not_found_show_default({}, { locale: locale.value })
    useAppStore().setPendingShareNotFoundToast(message)
  }

  async function loadShareProductIntoCustomizer(
    shareUrl: string,
    fallbackShareProduct?: ShareProductDetails
  ): Promise<boolean> {
    const productsStore = useProductsStore()
    const customizationStore = useCustomizationStore()

    isLoading.value = true
    productsStore.suspendCustomizationAutoSync()
    try {
      // Fetch share product details from API
      const resp = await tryCatchApi(API.products.getProductsByShareUrl(shareUrl), {
        operation: 'loadShareProductIntoCustomizer',
        share_url: shareUrl
      })

      const shareResult: ShareProductDetails | null =
        resp.success && resp.content ? resp.content.result : (fallbackShareProduct ?? null)

      if (!shareResult) {
        showShareNotFoundToast()
        return false
      }

      const factoryProduct = resolveShareProduct(shareResult)
      if (!factoryProduct) {
        showShareNotFoundToast()
        return false
      }

      const {
        productId: shareBaseProductId,
        styleId,
        designId
      } = extractShareProductIds(factoryProduct as unknown as Record<string, unknown>)

      if (!shareBaseProductId) {
        showShareNotFoundToast()
        return false
      }

      // Load the base product/style/design via existing products flow
      let productId = shareBaseProductId
      const productResp = await productsStore.fetchActiveProductDetails(productId)

      if (!productResp?.success) {
        // If the share payload uses a *base* product_id that isn't valid for GET product/{id},
        // try mapping it to the active product id via previews
        if (productResp?.status === 404 && shareBaseProductId) {
          const resolvedId = await resolveActiveProductId(
            shareBaseProductId,
            styleId,
            productsStore,
            customizationStore
          )

          if (!resolvedId) return false
          productId = resolvedId

          const retry = await productsStore.fetchActiveProductDetails(productId)
          if (!retry?.success) return false
        } else {
          return false
        }
      }

      await Promise.all([
        productsStore.fetchStylePreviews(productId),
        productsStore.fetchDesignPreviewsByStyleId(styleId)
      ])

      if (styleId && productsStore.activeStyleDetails?.id !== styleId) {
        const activeStyleResp = await productsStore.fetchActiveStyleDetails(styleId)
        if (!activeStyleResp?.success) return false
      }

      if (designId && productsStore.activeDesignDetails?.id !== designId) {
        const designResp = await productsStore.fetchDesignDetailsById(designId)
        if (designResp?.success && productsStore.activeDesignDetails) {
          customizationStore.setDesign(productsStore.activeDesignDetails)
        }
      }

      // Extract category_id and sub_category_id from share product
      const shareProductRecord = factoryProduct as unknown as Record<string, unknown>
      const shareCategoryId = shareProductRecord['category_id']
      const shareSubCategoryId = shareProductRecord['sub_category_id']

      // Use category from share product if available, otherwise preserve current
      const preservedCategoryId =
        typeof shareCategoryId === 'number'
          ? shareCategoryId
          : (customizationStore.activeCategoryId ?? 0)
      const preservedSubCategoryId =
        typeof shareSubCategoryId === 'number'
          ? shareSubCategoryId
          : shareSubCategoryId === null
            ? null
            : (customizationStore.activeSubCategoryId ?? null)

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
      const factoryProductForCustomizer = {
        ...(factoryProduct as unknown as Record<string, unknown>),
        product_id: productId
      } as unknown as CartFactoryProduct

      const nextCustomization = buildCustomizationFromShareProduct(
        factoryProductForCustomizer,
        baseCustomization,
        designName
      )

      // If share payload maps were keyed by base product id, copy them to the resolved active product id
      remapProductIdKeys(nextCustomization, shareBaseProductId, productId)

      customizationStore.setCustomization(nextCustomization)

      // Update preset texts in productsStore based on is_first_name and is_first_number flags
      const shareTexts = nextCustomization.product_custom_texts[String(productId)]
      const presetTexts = productsStore.activeProductDetails?.product_texts

      if (shareTexts && presetTexts && presetTexts.length > 0) {
        const updatedPresetTexts = updatePresetTextsWithShareFlags(presetTexts, shareTexts)

        if (productsStore.activeProductDetails) {
          productsStore.setActiveProductDetailsState({
            ...productsStore.activeProductDetails,
            product_texts: updatedPresetTexts
          })
        }
      }

      return true
    } finally {
      productsStore.resumeCustomizationAutoSync()
      isLoading.value = false
    }
  }

  return { isLoading, loadShareProductIntoCustomizer }
}
