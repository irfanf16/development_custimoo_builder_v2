import { type ShallowRef, type Ref, unref } from 'vue'
import {
  FabricText,
  Object as FabricObjectClass,
  Control,
  type Canvas,
  type FabricObject
} from 'fabric'
import { useDebounceFn } from '@vueuse/core'
import { FABRIC_CONTROL_VISIBILITY } from './useFabricControls'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import type { OutputProductText, OutputProductTextItem } from '@/services/products/types'
import { createTextAsPathFromFonts, type ProductsFonts } from './useTextAsPath'

/**
 * Custom text structure (from customization store):
 * - Each entry (OutputProductText) has multiple items (OutputProductTextItem[]).
 * - Each item = one placement on canvas (Front or Back) with its own position, size, and visibility.
 * - item.selected controls show/hide on canvas (legacy: visible = custom_text_item.selected).
 * - item.placement is 'Front' | 'Back' and determines which canvas/side the text is on.
 * - Identification: (custom_text_index, custom_text_item_index) = which entry + which item.
 */

/** Unique key for a text object on canvas (custom_text_index + item_index). */
export function getTextObjectKey(customTextIndex: number, itemIndex: number): string {
  return `${customTextIndex}_${itemIndex}`
}

/** Parameters for creating text as path (SVG) for exact bounds without font padding. */
export type CreateTextAsPathParams = {
  value: string
  fontFamily: string
  fontSize: number
  fill?: string
  stroke?: string
  strokeWidth?: number
}

/**
 * Options for adding text to canvas (mirrors AddLogoOptions pattern).
 */
export type AddTextOptions = {
  /** Text entry from product_custom_texts */
  entry: OutputProductText
  /** Index in product_custom_texts array */
  customTextIndex: number
  /** Index in entry.items */
  itemIndex: number
  /** Canvas instance */
  canvas: Canvas | null
  /** Text objects storage – key = getTextObjectKey(customTextIndex, itemIndex) */
  textObjects: ShallowRef<Map<string, FabricObject>>
  /** Position calculator (2D or 3D) – same signature as logo: (item) => { x, y } */
  calculatePosition: (item: OutputProductTextItem) => { x: number; y: number }
  /** Rotation calculator (degrees) */
  calculateRotation: (rotation: number) => number
  /** Scale factor for height → fontSize (e.g. canvasHeight / mainCanvasHeight) */
  heightScale: number
  /** Render canvas after adding */
  renderCanvas: () => void
  /** Clip path (safe zone) */
  applyClipPath: (obj: FabricObject) => void | Promise<void>
  /** Control visibility */
  controlVisibility: typeof FABRIC_CONTROL_VISIBILITY
  /** Whether object is selectable */
  canvasSelection: boolean
  /** When true, attach modified handler and initial store update (same as logo mainPreview) */
  mainPreview: boolean
  /** Current product ID (for store update) */
  productId: number
  /** Suppress customTexts watcher while updating store */
  suppressWatchRef: Ref<boolean>
  /** Scale ratios to convert canvas left/top back to x_axis/y_axis */
  getScaleRatios: () => { widthRatio: number; heightRatio: number }
  /** Whether this is 3D scene */
  is_3d: boolean
  /** Whether to flip text horizontally (for 3D, same as logo) */
  flipX?: boolean
  /** When mainPreview is true, pass opentype fonts to render text as path (exact bounds). Can be a ref. */
  productsFonts?: ProductsFonts | Ref<ProductsFonts>
  /** Map 3D interaction back to 2D screen coords (required; pass no-op for 2D) */
  findPositionOn2D?: (
    x: number,
    y: number,
    fabricObject: FabricObject & { side?: string; type?: string }
  ) => { vector: { x: number; y: number; z?: number }; sideChanged: boolean }
  /** Converts px to measurement units (cm/in) for originalWidth/originalHeight */
  convertSize: (px: number) => number
}

/**
 * Entry with only the items for the current side (2D) or all items (3D).
 * Use when building customTexts so sync only iterates over relevant items.
 */
export type TextEntryWithItemsForSide = {
  entry: OutputProductText
  itemsForSide: { itemIndex: number; item: OutputProductTextItem }[]
}

/**
 * Options for syncing texts to canvas (mirrors SyncLogosOptions).
 * Called from a watch on customTexts.
 */
export type SyncTextsOptions = {
  /** New texts map: key = index in product_custom_texts, value = entry + items for this side */
  newTexts: Map<number, TextEntryWithItemsForSide>
  /** Canvas instance */
  canvas: Canvas | null
  /** Text objects storage – key = getTextObjectKey(customTextIndex, itemIndex) */
  textObjects: ShallowRef<Map<string, FabricObject>>
  /** Function used to add a text when no match exists */
  addText: (entry: OutputProductText, customTextIndex: number, itemIndex: number) => Promise<void>
  /** Position calculator – same signature as logo: (item) => { x, y } */
  calculatePosition: (item: OutputProductTextItem) => { x: number; y: number }
  /** Rotation calculator (degrees) */
  calculateRotation: (rotation: number) => number
  /** Scale factor for height → fontSize */
  heightScale: number
  /** Scale ratios for position/scale (canvas vs main canvas) */
  getScaleRatios: () => { widthRatio: number; heightRatio: number }
  /** Optional callback after sync */
  onAfterSync?: () => void
}

/** FabricObject with text sync metadata */
type TextFabricObject = FabricObject & {
  signature?: string
  signatureValuePlacement?: string
  custom_text_index?: number
  custom_text_item_index?: number
}

/**
 * Full signature for a text item (value + all placement attributes).
 * 100% match = same text object when syncing to canvas.
 */
export function getTextSignature(entry: OutputProductText, itemIndex: number): string {
  const item: OutputProductTextItem | undefined = entry.items?.[itemIndex]
  if (!item) return ''
  return JSON.stringify({
    value: entry.value,
    side: item.placement,
    x: item.x_axis,
    y: item.y_axis,
    rot: item.rotation,
    height: item.height,
    selected: item.selected,
    sx: item.scaleX,
    sy: item.scaleY,
    font: entry.font_family ?? item.font_family,
    color: item.color,
    outline_enabled: item.outline_enabled,
    outline_color: item.outline_color,
    outline_width: item.outline_width
  })
}

/**
 * Value + placement signature (used for fallback matching).
 * Same value and side = same text when full signature does not match.
 */
export function getTextSignatureValuePlacement(
  entry: OutputProductText,
  item: OutputProductTextItem
): string {
  return `${entry.value}|${item.placement}|${entry.font_family}`
}

/**
 * Whether a text item should be shown on canvas (legacy: visible = item.selected).
 */
export function isTextItemVisible(item: OutputProductTextItem): boolean {
  return !!item.selected
}

function isTextEntryEmpty(entry: OutputProductText | null | undefined): boolean {
  if (!entry || typeof entry !== 'object') return true
  return entry.value == null || String(entry.value).trim() === ''
}

/**
 * Options for updating text position in store after user modifies on canvas (exact same shape as updateLogoPositionInStore).
 */
export type UpdateTextPositionOptions = {
  fabricText: FabricObject & {
    left?: number
    top?: number
    angle?: number
    scaleX?: number
    scaleY?: number
    fontSize?: number
    width?: number
    height?: number
  }
  customTextIndex: number
  itemIndex: number
  productId: number
  getScaleRatios: () => { widthRatio: number; heightRatio: number }
  heightScale: number
  calculateRotation: (rotation: number) => number
  is_3d: boolean
  findPositionOn2D?: (
    x: number,
    y: number,
    fabricObject: FabricObject & { side?: string; type?: string }
  ) => { vector: { x: number; y: number; z?: number }; sideChanged: boolean }
  event?: unknown
  suppressWatchRef: Ref<boolean>
  /** Optional: converts px to measurement units (cm/in). When provided, originalWidth/originalHeight are set. */
  convertSize?: (px: number) => number
}

/**
 * Update the store when user moves/scales/rotates a text on canvas (exact same logic as updateLogoPositionInStore).
 */
export function updateTextPositionInStore(options: UpdateTextPositionOptions): void {
  const {
    fabricText,
    customTextIndex,
    itemIndex,
    productId,
    getScaleRatios,
    heightScale,
    calculateRotation,
    is_3d,
    findPositionOn2D,
    event,
    suppressWatchRef,
    convertSize
  } = options
  const { widthRatio, heightRatio } = getScaleRatios()
  const customizationStore = useCustomizationStore() as {
    updateProductTextItem(
      productId: number,
      entryIndex: number,
      itemIndex: number,
      payload: Partial<OutputProductTextItem> & Record<string, unknown>
    ): void
  }

  let left = fabricText.left ?? 0
  let top = fabricText.top ?? 0
  let x_axis_3d = 0
  let y_axis_3d = 0

  if (is_3d && findPositionOn2D && event) {
    const pointer = (
      event as { e?: { clientX?: number; clientY?: number; x?: number; y?: number } }
    ).e
    const px = pointer?.clientX ?? pointer?.x
    const py = pointer?.clientY ?? pointer?.y
    if (typeof px === 'number' && typeof py === 'number') {
      const mapped = findPositionOn2D(
        px,
        py,
        fabricText as FabricObject & { side?: string; type?: string }
      )
      if (mapped?.vector) {
        left = mapped.vector.x ?? left
        top = mapped.vector.y ?? top
      }
    }
    x_axis_3d = fabricText.left ?? 0
    y_axis_3d = fabricText.top ?? 0
  }

  const angle = fabricText.angle ?? 0
  const rotation = calculateRotation(angle)
  const fontSize = (fabricText as unknown as { fontSize?: number }).fontSize
  const height = fontSize != null ? fontSize / heightScale : 0
  const scaleX = fabricText.scaleX ?? 1
  const scaleY = fabricText.scaleY ?? 1

  suppressWatchRef.value = true
  const data: Partial<OutputProductTextItem> & Record<string, unknown> = {
    x_axis: String(left / widthRatio),
    y_axis: String(top / heightRatio),
    rotation: String(rotation),
    height: String(height),
    scaleX: scaleX / widthRatio,
    scaleY: scaleY / heightRatio,
    actualWidth: fabricText.width ?? 0,
    actualHeight: fabricText.height ?? 0
  }
  if (is_3d) {
    data.x_axis_3d = x_axis_3d
    data.y_axis_3d = y_axis_3d
  }
  if (convertSize != null && fabricText.width != null && fabricText.height != null) {
    const strokeW = (fabricText as unknown as { strokeWidth?: number }).strokeWidth ?? 0
    const totalWidthPx = fabricText.width * scaleX + strokeW * scaleX
    const totalHeightPx = fabricText.height * scaleY + strokeW * scaleY
    data.originalWidth = convertSize(totalWidthPx)
    data.originalHeight = convertSize(totalHeightPx)
  }
  customizationStore.updateProductTextItem(productId, customTextIndex, itemIndex, data)
}

const debouncedTextStoreUpdate = useDebounceFn(
  (payload: {
    productId: number
    customTextIndex: number
    itemIndex: number
    data: Partial<OutputProductTextItem> & Record<string, unknown>
    suppressWatchRef: Ref<boolean>
  }) => {
    payload.suppressWatchRef.value = true
    const customizationStore = useCustomizationStore() as {
      updateProductTextItem(
        productId: number,
        entryIndex: number,
        itemIndex: number,
        payload: Partial<OutputProductTextItem> & Record<string, unknown>
      ): void
    }
    customizationStore.updateProductTextItem(
      payload.productId,
      payload.customTextIndex,
      payload.itemIndex,
      payload.data
    )
  },
  500
)

/**
 * Add a single custom text item to the canvas (same pattern as addLogoToCanvas).
 */
export async function addTextToCanvas(options: AddTextOptions): Promise<void> {
  const {
    entry,
    customTextIndex,
    itemIndex,
    canvas,
    textObjects,
    calculatePosition,
    calculateRotation,
    heightScale,
    renderCanvas,
    applyClipPath,
    controlVisibility,
    canvasSelection
  } = options

  const item: OutputProductTextItem | undefined = entry.items?.[itemIndex]
  if (!canvas || !item || isTextEntryEmpty(entry)) {
    return Promise.resolve()
  }

  const position = calculatePosition(item)
  const rotation = calculateRotation(Number(item.rotation) || 0)
  const fontSize = heightScale * Number(item.height) || 16
  const fontFamily = entry.font_family?.trim() || 'Ubuntu'

  const { flipX = false, productsFonts } = options
  const { widthRatio, heightRatio } = options.getScaleRatios()
  const usePath = options.mainPreview && productsFonts
  let textObj: FabricObject
  if (usePath) {
    const fonts = unref(productsFonts)
    const createTextAsPathFn = createTextAsPathFromFonts(fonts)
    const pathObject = await createTextAsPathFn({
      value: entry.value,
      fontFamily,
      fontSize,
      fill: item.color || '#000000',
      stroke: item.outline_enabled ? item.outline_color : undefined,
      strokeWidth: item.outline_enabled ? (item.outline_width ?? 0) : 0
    })
    if (pathObject) {
      textObj = pathObject
      textObj.set({
        left: position.x,
        top: position.y,
        angle: rotation < 0 ? 360 + rotation : rotation,
        originX: 'center',
        originY: 'center',
        selectable: canvasSelection,
        hasControls: true,
        hasBorders: false,
        evented: true,
        globalCompositeOperation: 'source-atop',
        lockScalingFlip: true,
        padding: 15,
        cornerSize: 30,
        centeredScaling: true,
        visible: item.selected,
        flipX
      })
      if (item.scaleX && item.scaleY) {
        textObj.set({ scaleX: item.scaleX * widthRatio, scaleY: item.scaleY * heightRatio })
      }
      textObj.setCoords()
    } else {
      textObj = createFabricText(item, widthRatio, heightRatio)
    }
  } else {
    textObj = createFabricText(item, widthRatio, heightRatio)
  }

  function createFabricText(
    it: OutputProductTextItem,
    scaleW: number,
    scaleH: number
  ): FabricObject {
    const fabricText = new FabricText(entry.value, {
      left: position.x,
      top: position.y,
      angle: rotation < 0 ? 360 + rotation : rotation,
      originX: 'center',
      originY: 'center',
      fontFamily,
      fontSize,
      fill: it.color || '#000000',
      stroke: it.outline_enabled ? it.outline_color : undefined,
      strokeWidth: it.outline_enabled ? (it.outline_width ?? 0) : 0,
      paintFirst: 'stroke',
      selectable: canvasSelection,
      hasControls: true,
      hasBorders: false,
      evented: true,
      globalCompositeOperation: 'source-atop',
      lockScalingFlip: true,
      padding: 15,
      cornerSize: 30,
      centeredScaling: true,
      visible: it.selected,
      flipX
    })
    if (it.scaleX && it.scaleY) {
      fabricText.scaleX = it.scaleX * scaleW
      fabricText.scaleY = it.scaleY * scaleH
    }
    return fabricText as FabricObject
  }

  // Metadata for matching and delete control (required by useFabricControls delete handler)
  const textObjMeta = textObj as FabricObject & {
    custom_text_index?: number
    custom_text_item_index?: number
    side?: string
    signature?: string
    signatureValuePlacement?: string
    type?: string
    manually_added?: boolean
  }
  textObjMeta.custom_text_index = customTextIndex
  textObjMeta.custom_text_item_index = itemIndex
  textObjMeta.side = item.placement
  textObjMeta.signature = getTextSignature(entry, itemIndex)
  textObjMeta.signatureValuePlacement = getTextSignatureValuePlacement(entry, item)
  textObjMeta.manually_added = entry.manually_added ?? false

  // Ensure controls exist on the instance (clone from prototype for safety), same as logos
  const protoControls = (
    FabricObjectClass.prototype as unknown as { controls?: Record<string, Control> }
  ).controls
  if (protoControls) {
    textObj.controls = { ...(textObj.controls ?? {}), ...protoControls }
  }

  textObj.setControlsVisibility(controlVisibility)
  textObj.setCoords()

  if (applyClipPath) {
    await Promise.resolve(applyClipPath(textObj))
  }

  canvas.add(textObj)

  const key = getTextObjectKey(customTextIndex, itemIndex)
  textObjects.value.set(key, textObj)

  // Initial store update (exact same pattern as logo) when mainPreview
  const {
    mainPreview = false,
    productId,
    suppressWatchRef,
    getScaleRatios,
    is_3d = false,
    findPositionOn2D,
    convertSize
  } = options

  // Update store on modified (debounced 500ms, same pattern as logo)
  if (mainPreview) {
    const { widthRatio, heightRatio } = getScaleRatios()
    const scaleX = textObj.scaleX ?? 1
    const scaleY = textObj.scaleY ?? 1
    const data: Partial<OutputProductTextItem> & Record<string, unknown> = {
      scaleX: scaleX / widthRatio,
      scaleY: scaleY / heightRatio,
      ...(is_3d ? { x_axis_3d: position.x, y_axis_3d: position.y } : {}),
      actualWidth: textObj.width ?? 0,
      actualHeight: textObj.height ?? 0
    }
    if (convertSize != null && textObj.width != null && textObj.height != null) {
      const strokeW = (textObj as unknown as { strokeWidth?: number }).strokeWidth ?? 0
      const totalWidthPx = textObj.width * scaleX + strokeW * scaleX
      const totalHeightPx = textObj.height * scaleY + strokeW * scaleY
      data.originalWidth = convertSize(totalWidthPx)
      data.originalHeight = convertSize(totalHeightPx)
    }
    void debouncedTextStoreUpdate({
      productId,
      customTextIndex,
      itemIndex,
      data,
      suppressWatchRef
    })

    textObj.on('modified', (event: unknown) => {
      updateTextPositionInStore({
        fabricText: textObj,
        customTextIndex,
        itemIndex,
        productId: productId ?? null,
        getScaleRatios,
        heightScale,
        calculateRotation,
        is_3d,
        findPositionOn2D,
        event,
        suppressWatchRef,
        convertSize
      })
    })
  }

  renderCanvas()
}

/**
 * Sync custom texts to canvas (same pattern as syncLogosOnCanvas).
 * Match by full signature first, then by value+placement with mutation; remove stale; add new.
 */
export async function syncTextsOnCanvas(options: SyncTextsOptions): Promise<void> {
  const {
    newTexts,
    canvas,
    textObjects,
    addText,
    calculatePosition,
    calculateRotation,
    heightScale,
    getScaleRatios,
    onAfterSync
  } = options

  if (!canvas) return

  const { widthRatio, heightRatio } = getScaleRatios()

  const available: {
    key: string
    obj: TextFabricObject
    signature: string | undefined
    signatureValuePlacement: string | undefined
  }[] = Array.from(textObjects.value.entries()).map(([key, obj]) => {
    const t = obj as TextFabricObject
    return {
      key,
      obj: t,
      signature: t.signature,
      signatureValuePlacement: t.signatureValuePlacement
    }
  })

  const desired: {
    customTextIndex: number
    itemIndex: number
    entry: OutputProductText
    item: OutputProductTextItem
    signature: string
    signatureValuePlacement: string
  }[] = []
  for (const [customTextIndex, { entry, itemsForSide }] of newTexts.entries()) {
    if (!entry || isTextEntryEmpty(entry) || !itemsForSide?.length) continue
    for (const { itemIndex, item } of itemsForSide) {
      if (!isTextItemVisible(item)) continue
      desired.push({
        customTextIndex,
        itemIndex,
        entry,
        item,
        signature: getTextSignature(entry, itemIndex),
        signatureValuePlacement: getTextSignatureValuePlacement(entry, item)
      })
    }
  }

  const nextMap = new Map<string, FabricObject>()
  const matchedKeys = new Set<string>()

  for (const d of desired) {
    const key = getTextObjectKey(d.customTextIndex, d.itemIndex)

    let matchIdx = available.findIndex(a => a.signature === d.signature)
    if (matchIdx >= 0) {
      const match = available.splice(matchIdx, 1)[0]
      if (match) {
        nextMap.set(key, match.obj)
        matchedKeys.add(key)
      }
      continue
    }

    matchIdx = available.findIndex(a => a.signatureValuePlacement === d.signatureValuePlacement)
    if (matchIdx >= 0) {
      const match = available.splice(matchIdx, 1)[0]
      if (match) {
        const obj = match.obj
        const position = calculatePosition(d.item)
        const rotation = calculateRotation(Number(d.item.rotation) || 0)
        const angle = rotation < 0 ? 360 + rotation : rotation
        const fontSize = heightScale * Number(d.item.height) || 16

        const fontFamily = d.entry.font_family?.trim() || d.item.font_family?.trim() || 'Ubuntu'
        obj.set({
          left: position.x,
          top: position.y,
          angle,
          fontSize,
          fontFamily,
          fill: d.item.color || '#000000',
          stroke: d.item.outline_enabled ? d.item.outline_color : undefined,
          strokeWidth: d.item.outline_enabled ? (d.item.outline_width ?? 0) : 0,
          visible: d.item.selected
        } as unknown as Record<string, unknown>)
        if (d.item.scaleX && d.item.scaleY) {
          obj.scaleX = d.item.scaleX * widthRatio
          obj.scaleY = d.item.scaleY * heightRatio
        }
        obj.custom_text_index = d.customTextIndex
        obj.custom_text_item_index = d.itemIndex
        obj.signature = d.signature
        obj.signatureValuePlacement = d.signatureValuePlacement
        obj.setCoords()
        nextMap.set(key, obj)
        matchedKeys.add(key)
      }
      continue
    }
  }

  // Remove leftover unmatched objects from textObjects and from canvas
  available.forEach(entry => {
    textObjects.value.delete(entry.key)
    canvas.remove(entry.obj)
  })

  textObjects.value = nextMap

  for (const d of desired) {
    const key = getTextObjectKey(d.customTextIndex, d.itemIndex)
    if (matchedKeys.has(key)) continue
    await addText(d.entry, d.customTextIndex, d.itemIndex)
  }

  if (onAfterSync) {
    onAfterSync()
  }
}

export function useTexts() {
  return {
    getTextObjectKey,
    getTextSignature,
    getTextSignatureValuePlacement,
    isTextItemVisible,
    addTextToCanvas,
    syncTextsOnCanvas
  }
}
