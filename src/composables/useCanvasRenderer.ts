import { ref, type Ref } from 'vue'
import type { CustomLogo } from '@/services/logos/types'
import type { OutputProductText, OutputProductTextItem } from '@/services/products/types'
import { clone } from '@/components/customization-workflow/WorkflowSteps/texts/useTextUtils'

/**
 * Result of comparing current and previous logo states
 */
export interface LogoDiffResult {
  added: CustomLogo[]
  updated: CustomLogo[]
  removed: string[]
}

/**
 * Parsed components of a render version string
 */
export interface ParsedRenderVersion {
  id: string
  logosMeta: string
  logosGeometry: string
  groups: string
}

/**
 * Options for applying incremental logo updates
 */
export interface ApplyLogoUpdatesOptions {
  previousLogoState: Ref<Map<string, CustomLogo>>
  logos: CustomLogo[]
  addLogoLayer: (logo: CustomLogo) => Promise<unknown>
  removeLogoLayer: (id: string) => void
  replaceLogoTexture: (id: string, url: string) => Promise<unknown>
  updateLogoLayerGeometry: (logo: CustomLogo) => void
}

/**
 * Utility: Parse a render version string into its components
 */
export function parseRenderVersion(version: string): ParsedRenderVersion {
  const [id = '', logosMeta = '', logosGeometry = '', groups = ''] = version.split('|')
  return {
    id,
    logosMeta,
    logosGeometry,
    groups
  }
}

/**
 * Utility: Filter logos by side (front or back)
 */
export function filterLogosBySide(logos: CustomLogo[], side: 'front' | 'back'): CustomLogo[] {
  return logos.filter(logo => logo.side === side)
}

/**
 * Utility: Filter logos by opposite side (for small preview)
 */
export function filterLogosByOppositeSide(
  logos: CustomLogo[],
  currentSide: 'front' | 'back'
): CustomLogo[] {
  const targetSide = currentSide === 'front' ? 'back' : 'front'
  return logos.filter(logo => logo.side === targetSide)
}

/**
 * Compare current and previous logo states to detect changes
 */
export function getLogoDiffs(
  previousLogoState: Ref<Map<string, CustomLogo>>,
  nextLogos: CustomLogo[]
): LogoDiffResult {
  const added: CustomLogo[] = []
  const updated: CustomLogo[] = []
  const removed: string[] = []

  const previous = previousLogoState.value
  const nextMap = new Map<string, CustomLogo>()

  for (const logo of nextLogos) {
    const key = String(logo.id)
    nextMap.set(key, logo)
    const prev = previous.get(key)

    if (!prev) {
      added.push(logo)
      continue
    }

    // Check if any logo properties changed
    if (
      prev.url !== logo.url ||
      prev.rotation !== logo.rotation ||
      prev.width !== logo.width ||
      prev.height !== logo.height ||
      prev.x_axis !== logo.x_axis ||
      prev.y_axis !== logo.y_axis ||
      prev.scaleX !== logo.scaleX ||
      prev.scaleY !== logo.scaleY ||
      prev.side !== logo.side ||
      prev.name_of_placement !== logo.name_of_placement
    ) {
      updated.push(logo)
    }
  }

  // Find removed logos
  for (const [id] of previous) {
    if (!nextMap.has(id)) {
      removed.push(id)
    }
  }

  // Update the state with the new logo map
  previousLogoState.value = nextMap
  return { added, updated, removed }
}

/**
 * Apply incremental logo updates to the canvas
 * Handles added, updated, and removed logos efficiently
 */
export async function applyIncrementalLogoUpdates(options: ApplyLogoUpdatesOptions): Promise<void> {
  const {
    previousLogoState,
    logos,
    addLogoLayer,
    removeLogoLayer,
    replaceLogoTexture,
    updateLogoLayerGeometry
  } = options

  // CRITICAL: Capture previous URLs BEFORE getLogoDiffs updates the state
  const previousUrls = new Map<string, string>()
  for (const logo of logos) {
    const prev = previousLogoState.value.get(String(logo.id))
    if (prev) {
      previousUrls.set(String(logo.id), prev.url)
    }
  }

  const { added, updated, removed } = getLogoDiffs(previousLogoState, logos)

  // Remove logos that no longer exist
  for (const id of removed) {
    removeLogoLayer(id)
  }

  // Add new logos
  for (const logo of added) {
    await addLogoLayer(logo).catch(err => console.warn('Failed to add logo:', err))
  }

  // Update existing logos (geometry and/or texture)
  for (const logo of updated) {
    const prevUrl = previousUrls.get(String(logo.id))

    // If URL changed, replace the texture
    if (prevUrl && prevUrl !== logo.url) {
      await replaceLogoTexture(String(logo.id), logo.url)
    }

    // Always update geometry for changed logos
    updateLogoLayerGeometry(logo)
  }
}

/**
 * Composable: Provides a render queue mechanism to prevent overlapping renders
 * Returns a wrapper function that ensures only one render happens at a time
 */
export function useRenderQueue() {
  let renderInFlight = false
  let renderQueued = false

  /**
   * Wraps a render function with queue management
   * @param renderFn - The async render function to execute
   * @param onError - Optional error handler
   */
  async function queuedRender(
    renderFn: () => Promise<void>,
    onError?: (error: unknown) => void
  ): Promise<void> {
    if (renderInFlight) {
      renderQueued = true
      return
    }

    renderInFlight = true

    try {
      await renderFn()
    } catch (error) {
      if (onError) {
        onError(error)
      } else {
        console.error('Render error:', error)
      }
    } finally {
      renderInFlight = false

      if (renderQueued) {
        renderQueued = false
        queueMicrotask(() => void queuedRender(renderFn, onError))
      }
    }
  }

  return {
    queuedRender
  }
}

/**
 * Composable: Manages previous logo state tracking
 */
export function usePreviousLogoState() {
  const previousLogoState = ref(new Map<string, CustomLogo>())

  function reset() {
    previousLogoState.value = new Map()
  }

  function setFromLogos(logos: CustomLogo[]) {
    previousLogoState.value = new Map(logos.map(logo => [String(logo.id), logo]))
  }

  return {
    previousLogoState,
    reset,
    setFromLogos
  }
}

/**
 * Text item identifier (entryId:itemIndex)
 */
export type TextItemId = string

/**
 * Text item data for comparison
 */
export interface TextItemData {
  entryId: number
  itemIndex: number
  entry: OutputProductText
  item: OutputProductTextItem
}

/**
 * Result of comparing current and previous text states
 */
export interface TextDiffResult {
  added: TextItemData[]
  updated: TextItemData[]
  removed: TextItemId[]
}

/**
 * Options for applying incremental text updates
 */
export interface ApplyTextUpdatesOptions {
  previousTextState: Ref<Map<TextItemId, TextItemData>>
  texts: OutputProductText[]
  side: 'front' | 'back'
  addTextLayer: (
    entry: OutputProductText,
    item: OutputProductTextItem,
    itemIndex: number
  ) => Promise<unknown>
  removeTextLayer: (entryId: number, itemIndex: number) => void
  replaceTextContent: (
    entry: OutputProductText,
    item: OutputProductTextItem,
    itemIndex: number
  ) => Promise<unknown>
  updateTextLayerGeometry: (
    entry: OutputProductText,
    item: OutputProductTextItem,
    itemIndex: number
  ) => void
}

/**
 * Get a unique key for a text item
 */
function getTextItemId(entryId: number, itemIndex: number): TextItemId {
  return `${entryId}:${itemIndex}`
}

/**
 * Filter texts by side (front or back)
 */
export function filterTextsBySide(
  texts: OutputProductText[],
  side: 'front' | 'back'
): TextItemData[] {
  const result: TextItemData[] = []
  const sideStr = side === 'front' ? 'Front' : 'Back'

  for (const entry of texts) {
    if (!entry.items || entry.items.length === 0) continue

    for (let i = 0; i < entry.items.length; i++) {
      const item = entry.items[i]
      // Check if item placement matches the side
      if (item && item.placement === sideStr) {
        result.push({
          entryId: entry.id,
          itemIndex: i,
          entry,
          item
        })
      }
    }
  }

  return result
}

/**
 * Filter texts by opposite side (for small preview)
 */
export function filterTextsByOppositeSide(
  texts: OutputProductText[],
  currentSide: 'front' | 'back'
): TextItemData[] {
  const targetSide = currentSide === 'front' ? 'back' : 'front'
  return filterTextsBySide(texts, targetSide)
}

/**
 * Compare current and previous text states to detect changes
 */
export function getTextDiffs(
  previousTextState: Ref<Map<TextItemId, TextItemData>>,
  nextTextItems: TextItemData[]
): TextDiffResult {
  const added: TextItemData[] = []
  const updated: TextItemData[] = []
  const removed: TextItemId[] = []

  const previous = previousTextState.value
  const nextMap = new Map<TextItemId, TextItemData>()

  for (const textItem of nextTextItems) {
    const id = getTextItemId(textItem.entryId, textItem.itemIndex)
    nextMap.set(id, textItem)
    const prev = previous.get(id)

    if (!prev) {
      added.push(textItem)
      continue
    }

    // Check if any text properties changed
    // IMPORTANT: Compare against the stored previous state, not the current entry/item
    // because the entry/item objects are references that may have been mutated
    const prevItem = prev.item
    const nextItem = textItem.item
    const prevEntry = prev.entry
    const nextEntry = textItem.entry

    // Compare entry-level properties (value, font_family)
    const entryChanged =
      prevEntry.value !== nextEntry.value || prevEntry.font_family !== nextEntry.font_family

    // Compare item-level properties (position, styling, etc.)
    const itemChanged =
      prevItem.x_axis !== nextItem.x_axis ||
      prevItem.y_axis !== nextItem.y_axis ||
      prevItem.rotation !== nextItem.rotation ||
      prevItem.height !== nextItem.height ||
      prevItem.color !== nextItem.color ||
      prevItem.outline_color !== nextItem.outline_color ||
      prevItem.outline_enabled !== nextItem.outline_enabled ||
      prevItem.outline_width !== nextItem.outline_width ||
      prevItem.outline_width_converted !== nextItem.outline_width_converted ||
      prevItem.scaleX !== nextItem.scaleX ||
      prevItem.scaleY !== nextItem.scaleY ||
      prevItem.placement !== nextItem.placement

    if (entryChanged || itemChanged) {
      updated.push(textItem)
    }
  }

  // Find removed texts
  for (const [id] of previous) {
    if (!nextMap.has(id)) {
      removed.push(id)
    }
  }

  // Update the state with the new text map
  previousTextState.value = nextMap
  return { added, updated, removed }
}

/**
 * Apply incremental text updates to the canvas
 * Handles added, updated, and removed texts efficiently
 */
export async function applyIncrementalTextUpdates(options: ApplyTextUpdatesOptions): Promise<void> {
  const {
    previousTextState,
    texts,
    side,
    addTextLayer,
    removeTextLayer,
    replaceTextContent,
    updateTextLayerGeometry
  } = options

  // Get text items for the current side
  const textItems = filterTextsBySide(texts, side)

  // CRITICAL: Capture previous values BEFORE getTextDiffs updates the state
  const previousValues = new Map<TextItemId, { value: string; fontFamily: string }>()
  for (const textItem of textItems) {
    const id = getTextItemId(textItem.entryId, textItem.itemIndex)
    const prev = previousTextState.value.get(id)
    if (prev) {
      previousValues.set(id, {
        value: prev.entry.value,
        fontFamily: prev.entry.font_family || prev.item.font_family || ''
      })
    }
  }

  const { added, updated, removed } = getTextDiffs(previousTextState, textItems)

  // Remove texts that no longer exist
  for (const id of removed) {
    const [entryIdStr, itemIndexStr] = id.split(':')
    const entryId = Number(entryIdStr)
    const itemIndex = Number(itemIndexStr)
    if (!Number.isNaN(entryId) && !Number.isNaN(itemIndex)) {
      removeTextLayer(entryId, itemIndex)
    }
  }

  // Add new texts
  for (const textItem of added) {
    await addTextLayer(textItem.entry, textItem.item, textItem.itemIndex).catch(err =>
      console.warn('Failed to add text:', err)
    )
  }

  // Update existing texts (content and/or geometry)
  for (const textItem of updated) {
    const id = getTextItemId(textItem.entryId, textItem.itemIndex)
    const prev = previousValues.get(id)
    const prevItem = previousTextState.value.get(id)?.item

    // If value, font, or color-related properties changed, replace the content
    const contentChanged =
      prev &&
      (prev.value !== textItem.entry.value ||
        prev.fontFamily !== (textItem.entry.font_family || textItem.item.font_family || '') ||
        (prevItem &&
          (prevItem.color !== textItem.item.color ||
            prevItem.outline_color !== textItem.item.outline_color ||
            prevItem.outline_enabled !== textItem.item.outline_enabled ||
            prevItem.outline_width !== textItem.item.outline_width ||
            prevItem.outline_width_converted !== textItem.item.outline_width_converted)))

    if (contentChanged) {
      await replaceTextContent(textItem.entry, textItem.item, textItem.itemIndex)
    }

    // Always update geometry for changed texts (position, rotation, scale, etc.)
    updateTextLayerGeometry(textItem.entry, textItem.item, textItem.itemIndex)
  }
}

/**
 * Composable: Manages previous text state tracking
 */
export function usePreviousTextState() {
  const previousTextState = ref(new Map<TextItemId, TextItemData>())

  function reset() {
    previousTextState.value = new Map()
  }

  function setFromTexts(texts: OutputProductText[], side: 'front' | 'back') {
    const textItems = filterTextsBySide(texts, side)
    // Clone entry and item objects to create snapshots for comparison
    // This ensures we can detect changes even when the original objects are mutated
    previousTextState.value = new Map(
      textItems.map(item => [
        getTextItemId(item.entryId, item.itemIndex),
        {
          entryId: item.entryId,
          itemIndex: item.itemIndex,
          entry: clone(item.entry),
          item: clone(item.item)
        }
      ])
    )
  }

  return {
    previousTextState,
    reset,
    setFromTexts
  }
}
