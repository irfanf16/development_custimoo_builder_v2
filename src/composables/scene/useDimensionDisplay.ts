import { computed, type ComputedRef, type Ref } from 'vue'
import type { FabricImage, FabricObject } from 'fabric'

/**
 * Minimal shape for customization; accepts store state (e.g. APCustomization) that has these keys.
 * Uses permissive item types so OutputProductTextItem / logo entries are accepted.
 */
export type DimensionDisplayCustomization = {
  product_custom_texts?: Record<string, Array<{ items?: Array<Record<string, unknown>> }>>
  custom_logos?: Record<string, Array<Record<string, unknown>>>
} | null

export type GetDimensionDisplayOptions = {
  productId: number | null
  customization: DimensionDisplayCustomization
  getUnit: () => string
  convertSizeToMeasurement: (px: number) => number
}

/**
 * Returns display strings for width and height to show in the dimension overlay.
 * Uses stored originalWidth/originalHeight from the customization store when available (text or logo),
 * otherwise falls back to calculating from the fabric object (width/height * scale + stroke for text).
 * Shared by TwoDScene and ThreeDScene so both show the same values as the edit panels.
 */
export function getDimensionDisplayStrings(
  target: FabricObject | FabricImage,
  options: GetDimensionDisplayOptions
): { displayW: string; displayH: string; unit: string } {
  const { productId, customization, getUnit, convertSizeToMeasurement } = options
  const key = productId != null ? String(productId) : ''
  const unit = getUnit()
  let originalWidth: number | string | undefined
  let originalHeight: number | string | undefined

  const customTextItemIndex = (target as unknown as { custom_text_item_index?: number })
    .custom_text_item_index
  if (customTextItemIndex != null && key && customization?.product_custom_texts) {
    const customTextIndex = (target as unknown as { custom_text_index?: number }).custom_text_index
    if (customTextIndex != null) {
      const texts = customization.product_custom_texts[key]
      const entry = texts?.[customTextIndex]
      const item = entry?.items?.[customTextItemIndex]
      if (item) {
        originalWidth = item.originalWidth as number | string | undefined
        originalHeight = item.originalHeight as number | string | undefined
      }
    }
  }

  const logoIndex = (target as unknown as { logo_index?: number }).logo_index
  if (
    originalWidth === undefined &&
    originalHeight === undefined &&
    logoIndex != null &&
    key &&
    customization?.custom_logos
  ) {
    const logos = customization.custom_logos[key]
    const logo = logos?.[logoIndex]
    if (logo) {
      originalWidth = logo.originalWidth as number | string | undefined
      originalHeight = logo.originalHeight as number | string | undefined
    }
  }

  let displayW: string
  let displayH: string
  if (
    originalWidth !== undefined &&
    originalHeight !== undefined &&
    originalWidth !== '' &&
    originalHeight !== ''
  ) {
    const w = Number(originalWidth)
    const h = Number(originalHeight)
    displayW = Number.isFinite(w) ? w.toFixed(1) : String(originalWidth)
    displayH = Number.isFinite(h) ? h.toFixed(1) : String(originalHeight)
  } else {
    const width = (target.width ?? 0) * (target.scaleX ?? 1)
    const height = (target.height ?? 0) * (target.scaleY ?? 1)
    let displayWidthPx = width
    let displayHeightPx = height
    if (customTextItemIndex != null) {
      const strokeWidth = (target as unknown as { strokeWidth?: number }).strokeWidth ?? 0
      displayWidthPx += strokeWidth * (target.scaleX ?? 1)
      displayHeightPx += strokeWidth * (target.scaleY ?? 1)
    }
    displayW = convertSizeToMeasurement(displayWidthPx).toFixed(1)
    displayH = convertSizeToMeasurement(displayHeightPx).toFixed(1)
  }

  return { displayW, displayH, unit }
}

export type UseDimensionDisplayComputedOptions = {
  getProductId: () => number | null
  getCustomization: () => DimensionDisplayCustomization
  getUnit: () => string
  convertSizeToMeasurement: (px: number) => number
}

/**
 * Reactive dimension display for the current target. Use this so the overlay
 * updates when originalWidth/originalHeight change in the store (e.g. from edit fields).
 * Pass a ref for the object we're showing dimensions for; pass getters so reactivity is tracked.
 */
export function useDimensionDisplayComputed(
  dimensionTargetRef: Ref<FabricObject | FabricImage | null>,
  options: UseDimensionDisplayComputedOptions
): ComputedRef<{ displayW: string; displayH: string; unit: string } | null> {
  return computed(() => {
    const target = dimensionTargetRef.value
    if (!target) return null
    return getDimensionDisplayStrings(target, {
      productId: options.getProductId(),
      customization: options.getCustomization(),
      getUnit: options.getUnit,
      convertSizeToMeasurement: options.convertSizeToMeasurement
    })
  })
}
