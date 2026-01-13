import { ref } from 'vue'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { useCartStore } from '@/stores/cart/cart.store'
import type {
  ActiveProductCustomization,
  APCustomizationDefaultColor,
  APCustomizationGroupColor,
  APCustomizationLogosMap,
  OutputProductText
} from '@/services/products/types'
import type { FactoryProduct } from '@/services/cart/types'
import type { CustomLogo, LogoColor } from '@/services/logos/types'
import type { APCustomizationRosterEntry } from '@/services/products/types/customization'
import type { OutputProductLogoTechnology } from '@/services/products/types'

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

    if (color && name) {
      out[key] = {
        color,
        name,
        gradient_colors: gradient || []
      }
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

function normalizeCustomLogos(
  value: unknown,
  productId: number
): { map: APCustomizationLogosMap; list: CustomLogo[] } | null {
  const parsed = parseMaybeJson<unknown>(value)
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(value) ? value : null
  if (!arr || arr.length === 0) return null

  const productKey = String(productId)
  const list: CustomLogo[] = []
  const map: APCustomizationLogosMap = { [productKey]: [] }

  for (const item of arr) {
    if (!isRecord(item)) continue
    const logo: CustomLogo = {
      id: typeof item.id === 'number' ? item.id : 0,
      url: typeof item.url === 'string' ? item.url : '',
      side: typeof item.side === 'string' ? (item.side as 'front' | 'back') : 'front',
      width: typeof item.width === 'number' ? item.width : 0,
      height: typeof item.height === 'number' ? item.height : 0,
      x_axis: typeof item.x_axis === 'number' ? item.x_axis : 0,
      y_axis: typeof item.y_axis === 'number' ? item.y_axis : 0,
      rotation: typeof item.rotation === 'number' ? item.rotation : 0,
      is_locked: typeof item.is_locked === 'number' ? (item.is_locked === 1 ? 1 : 0) : 0,
      is_vector: typeof item.is_vector === 'boolean' ? item.is_vector : false,
      logo_name: typeof item.logo_name === 'string' ? item.logo_name : '',
      x_axis_3d: typeof item.x_axis_3d === 'number' ? item.x_axis_3d : 0,
      y_axis_3d: typeof item.y_axis_3d === 'number' ? item.y_axis_3d : 0,
      created_at: typeof item.created_at === 'string' ? item.created_at : '',
      logo_index: typeof item.logo_index === 'number' ? item.logo_index : 0,
      product_id: productId,
      updated_at: typeof item.updated_at === 'string' ? item.updated_at : '',
      logo_colors: Array.isArray(item.logo_colors) ? (item.logo_colors as LogoColor[]) : [],
      haveControls: typeof item.haveControls === 'boolean' ? item.haveControls : true,
      originalWidth: typeof item.originalWidth === 'number' ? item.originalWidth : 0,
      original_logo: typeof item.original_logo === 'string' ? item.original_logo : undefined,
      originalHeight: typeof item.originalHeight === 'number' ? item.originalHeight : 0,
      product_style_id: typeof item.product_style_id === 'number' ? item.product_style_id : 0,
      transparent_logo_url:
        typeof item.transparent_logo_url === 'string' ? item.transparent_logo_url : undefined,
      logo_technologies: Array.isArray(item.logo_technologies) ? item.logo_technologies : undefined,
      name_of_placement: typeof item.name_of_placement === 'string' ? item.name_of_placement : '',
      original_logo_url:
        typeof item.original_logo_url === 'string' ? item.original_logo_url : undefined,
      is_replace_success:
        typeof item.is_replace_success === 'boolean' ? item.is_replace_success : false,
      is_smart_transparent:
        typeof item.is_smart_transparent === 'boolean' ? item.is_smart_transparent : null,
      following_product_ids: Array.isArray(item.following_product_ids)
        ? item.following_product_ids
        : null,
      logos_follows_product:
        typeof item.logos_follows_product === 'number'
          ? item.logos_follows_product === 1
            ? 1
            : 0
          : 0,
      smart_transparent_logo_url:
        typeof item.smart_transparent_logo_url === 'string'
          ? item.smart_transparent_logo_url
          : undefined,
      logo_technology:
        item.logo_technology &&
        typeof item.logo_technology === 'object' &&
        typeof (item.logo_technology as OutputProductLogoTechnology).sku_id === 'number'
          ? (item.logo_technology as OutputProductLogoTechnology)
          : null
    }
    list.push(logo)
    if (map[productKey]) {
      map[productKey].push(logo)
    }
  }

  return { map, list }
}

function normalizeTexts(value: unknown): OutputProductText[] | null {
  const parsed = parseMaybeJson<unknown>(value)
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(value) ? value : null
  if (!arr || arr.length === 0) return null

  return arr
    .map(item => {
      if (!isRecord(item)) return null
      return item as OutputProductText
    })
    .filter((x): x is OutputProductText => x != null)
}

function normalizeRosterEntries(value: unknown): APCustomizationRosterEntry[] {
  const parsed = parseMaybeJson<unknown>(value)
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(value) ? value : null
  if (!arr) return []

  return arr
    .map(item => {
      if (!isRecord(item)) return null
      return item as APCustomizationRosterEntry
    })
    .filter((x): x is APCustomizationRosterEntry => x != null)
}

function buildCustomizationFromCartProduct(
  factoryProduct: FactoryProduct,
  base: ActiveProductCustomization,
  designName: string
): ActiveProductCustomization {
  const productKey = String(factoryProduct.product_id)

  // Extract data from factory product
  const factoryProductRecord = factoryProduct as unknown as Record<string, unknown>
  const defaultColors = normalizeDefaultColors(factoryProductRecord['defaultcolors'])
  const groupColors = normalizeGroupColors(factoryProductRecord['groupcolors'])
  const logos = normalizeCustomLogos(
    factoryProductRecord['custom_logos'],
    factoryProduct.product_id
  )
  const texts = normalizeTexts(factoryProductRecord['product_custom_texts'])
  const rosterEntries = normalizeRosterEntries(factoryProductRecord['product_roster_detail'])
  const fixedLogoIndexRaw = factoryProductRecord['fixed_logo_index']
  const shuffleColorNumberRaw = factoryProductRecord['shuffle_color_number']
  const groupPatternsRaw = factoryProductRecord['group_patterns']

  const next: ActiveProductCustomization = {
    ...base,
    product_id: factoryProduct.product_id,
    style_id: factoryProduct.style_id,
    design_id: factoryProduct.design_id,
    design_name: designName
  }

  if (typeof fixedLogoIndexRaw === 'number') next.fixed_logo_index = fixedLogoIndexRaw
  if (typeof shuffleColorNumberRaw === 'number') next.shuffle_color_number = shuffleColorNumberRaw
  if (isRecord(groupPatternsRaw)) next.group_patterns = groupPatternsRaw

  if (defaultColors?.length) next.default_colors = defaultColors
  if (groupColors && Object.keys(groupColors).length) next.group_colors = groupColors
  if (logos?.map && Object.keys(logos.map).length) next.custom_logos = logos.map

  if (texts && texts.length > 0) {
    next.product_custom_texts = {
      [productKey]: texts
    }
  }

  if (rosterEntries.length)
    next.products_rosters = { ...next.products_rosters, [productKey]: rosterEntries }

  return next
}

// ===== MAIN COMPOSABLE =====

export function useLoadCartProductIntoCustomizer() {
  const isLoading = ref(false)

  async function loadCartProductIntoCustomizer(
    factoryProductId: string,
    fallbackFactoryProduct?: FactoryProduct
  ): Promise<boolean> {
    const productsStore = useProductsStore()
    const customizationStore = useCustomizationStore()
    const cartStore = useCartStore()

    isLoading.value = true
    productsStore.suspendCustomizationAutoSync()
    try {
      // Find the factory product from cart
      let factoryProduct: FactoryProduct | null = null

      if (cartStore.cart?.items) {
        for (const item of cartStore.cart.items) {
          const found = item.factory_products.find(fp => fp.id === factoryProductId)
          if (found) {
            factoryProduct = found
            // Set editing state
            cartStore.setEditingCartProduct(item.id, factoryProductId)
            break
          }
        }
      }

      if (!factoryProduct && fallbackFactoryProduct) {
        factoryProduct = fallbackFactoryProduct
      }

      if (!factoryProduct) {
        return false
      }

      const productId = factoryProduct.product_id
      const styleId = factoryProduct.style_id
      const designId = factoryProduct.design_id

      if (!productId) {
        return false
      }

      // Load the base product/style/design via existing products flow
      const productResp = await productsStore.fetchActiveProductDetails(productId)

      if (!productResp?.success) {
        return false
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

      // Replace customization with a cart-hydrated snapshot
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
      const nextCustomization = buildCustomizationFromCartProduct(
        factoryProduct,
        baseCustomization,
        designName
      )

      customizationStore.setCustomization(nextCustomization)

      // Update preset texts in productsStore
      const cartTexts = nextCustomization.product_custom_texts[String(productId)]
      const presetTexts = productsStore.activeProductDetails?.product_texts

      if (cartTexts && presetTexts && presetTexts.length > 0) {
        const updatedPresetTexts = presetTexts.map((presetText, idx) => {
          const cartText = cartTexts[idx]
          return cartText || presetText
        })

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

  return { isLoading, loadCartProductIntoCustomizer }
}
