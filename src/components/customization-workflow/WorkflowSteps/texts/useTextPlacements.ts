import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductsStore } from '@/stores/products/products.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import type { OutputProductText, OutputProductTextItem } from '@/services/products/types'
import { clone } from './useTextUtils'
import { useProfileStore } from '@/stores/profile/profile.store'
import type { ParaglideLocale } from '@/services/preferences/types'
import { texts_fixed_text_label } from '@/paraglide/messages'

// ===== TYPES =====

/**
 * Extended text item with optional width and placement tracking
 * Used internally for type-safe property access
 */
type ExtendedTextItem = OutputProductTextItem & {
  width?: string
  placement_id?: number
}

/**
 * Placement object that wraps OutputProductTextItem with additional metadata
 * Used for displaying and selecting text placements in the UI
 *
 * Key features:
 * - Contains both string and numeric versions of coordinates (for calculations)
 * - Includes metadata (text_id, item_index) to track source
 * - Provides helper properties (name_of_placement, side) for UI display
 */
export type TextItemPlacement = Omit<
  OutputProductTextItem,
  'height' | 'width' | 'x_axis' | 'y_axis' | 'rotation'
> & {
  // Unique identifier: negative number to avoid conflicts with product IDs
  // Format: -(textId * 10000 + itemIndex)
  id: number
  // Source tracking
  text_id: number // ID of the source OutputProductText
  item_index: number // Index of the item within the source text
  // UI helper properties
  name_of_placement: string // Display name (alias for label)
  side: string // Side placement ('front' | 'back')
  width: number | null // Numeric width for overlay calculations
  // Numeric versions for calculations (overrides string versions)
  height: number
  x_axis: number
  y_axis: number
  rotation: number
  // Original string versions (preserved for OutputProductTextItem compatibility)
  heightString: string
  x_axisString: string
  y_axisString: string
  rotationString: string
}

// ===== SHARED STATE =====

/**
 * Currently selected placement ID (shared across components)
 * Used to track which placement is active in the placement selection UI
 */
export const selectedPlacementId = ref<number | null>(null)

export function useTextPlacements() {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()

  // ===== STATE =====
  const { activeProductDetails } = storeToRefs(productsStore)

  // ===== UTILITIES =====

  /**
   * Converts a product text item to a placement object with metadata
   *
   * This function extracts placement information from product_texts items
   * and creates a unified placement object that can be used for:
   * - Displaying placement options in the UI
   * - Calculating overlay positions
   * - Creating new text entries with placement coordinates
   *
   * @param item - The source text item from product_texts
   * @param textId - ID of the parent OutputProductText
   * @param itemIndex - Index of the item within the parent text's items array
   * @returns A TextItemPlacement object with all necessary metadata
   */
  function createPlacementFromItem(
    item: OutputProductTextItem,
    textId: number | string,
    itemIndex: number
  ): TextItemPlacement {
    const extendedItem = item as ExtendedTextItem
    // Calculate width: use explicit width if available, otherwise use height
    const width = extendedItem.width ? Number(extendedItem.width) : Number(item.height)

    // Generate unique negative ID to avoid conflicts with product IDs
    // Formula ensures uniqueness: each text/item combination gets a unique ID
    const uniqueId = -(Number(textId) * 10000 + itemIndex)

    // Normalize placement side to lowercase for consistency
    const side: string = item.placement === 'Front' ? 'front' : 'back'

    return {
      ...item,
      id: uniqueId,
      text_id: Number(textId),
      item_index: itemIndex,
      // UI display helpers
      name_of_placement: item.label || '',
      side,
      width: width || null,
      // Numeric versions for calculations (overlay positioning, etc.)
      height: Number(item.height) || 0,
      x_axis: Number(item.x_axis) || 0,
      y_axis: Number(item.y_axis) || 0,
      rotation: Number(item.rotation) || 0,
      // Preserve original string versions for OutputProductTextItem compatibility
      heightString: item.height,
      x_axisString: item.x_axis,
      y_axisString: item.y_axis,
      rotationString: item.rotation
    }
  }

  // ===== COMPUTED =====

  /**
   * Map of all available placements indexed by their unique ID
   * Used for quick lookup of placements by ID
   */
  const placementMap = computed<Record<number, TextItemPlacement>>(() => {
    const map: Record<number, TextItemPlacement> = {}
    const productTexts = activeProductDetails.value?.product_texts ?? []

    // Extract all items from all product_texts and create placement objects
    for (const text of productTexts) {
      if (text.items?.length) {
        text.items.forEach((item, index) => {
          const placement = createPlacementFromItem(item, text.id, index)
          map[placement.id] = placement
        })
      }
    }

    return map
  })

  /**
   * Currently selected placement based on selectedPlacementId
   * Returns null if no placement is selected
   */
  const currentPlacement = computed<TextItemPlacement | null>(() => {
    if (!selectedPlacementId.value) return null
    return placementMap.value[selectedPlacementId.value] ?? null
  })

  /**
   * Array of all available text placements extracted from product_texts
   *
   * This is the main source of placement options displayed in TextPlacement.vue
   * Each placement represents a position where text can be placed on the product
   */
  const availableTextPlacements = computed<TextItemPlacement[]>(() => {
    const placements: TextItemPlacement[] = []
    const productTexts = activeProductDetails.value?.product_texts ?? []

    // Extract all items from all product_texts to create placement options
    for (const text of productTexts) {
      if (text.items?.length) {
        text.items.forEach((item, index) => {
          const placement = createPlacementFromItem(item, text.id, index)
          placements.push(placement)
        })
      }
    }

    return placements
  })

  // ===== UTILITIES =====

  /**
   * Gets the active item from a text entry
   * Returns the item at active_item_index, or the first item if index is invalid
   */
  function getActiveItem(text: OutputProductText | null): OutputProductTextItem | null {
    if (!text) return null
    const idx = text.active_item_index ?? 0
    return text.items?.[idx] ?? text.items?.[0] ?? null
  }

  /**
   * Builds a new OutputProductTextItem from a placement and optional template
   *
   * This function creates a text item with coordinates and properties from the placement.
   * The template item (if provided) is used as a base for properties not specified by the placement.
   *
   * Key behavior:
   * - Placement coordinates always take priority
   * - Template provides fallback values for styling properties
   * - Width defaults to height if not specified
   * - placement_id is set to track which placement was used
   *
   * @param placement - The selected placement with coordinates and properties
   * @param templateItem - Optional template item to inherit properties from
   * @returns A new OutputProductTextItem ready to be added to a text entry
   */
  function buildItemFromPlacement(
    placement: TextItemPlacement,
    templateItem?: OutputProductTextItem | null
  ): OutputProductTextItem {
    // Start with template item if available, otherwise create empty item
    const base = templateItem ? clone(templateItem) : ({} as OutputProductTextItem)

    // Apply placement coordinates (always use placement values)
    base.label = placement.label || placement.name_of_placement
    base.height = placement.heightString
    base.x_axis = placement.x_axisString
    base.y_axis = placement.y_axisString
    base.rotation = placement.rotationString
    base.placement = placement.placement

    // Handle width: use placement width if available, otherwise use height
    const extendedBase = base as ExtendedTextItem
    if (placement.width != null) {
      extendedBase.width = String(placement.width)
    } else if (!extendedBase.width) {
      extendedBase.width = placement.heightString
    }

    // Apply placement properties with fallbacks to template/base values
    // This ensures we get the best of both: placement coordinates + template styling
    base.is_locked = placement.is_locked ?? base.is_locked ?? false
    base.arc_text_allowed = placement.arc_text_allowed ?? base.arc_text_allowed ?? false
    base.outline_enabled = placement.outline_enabled ?? base.outline_enabled ?? true
    base.outline_width = placement.outline_width ?? base.outline_width ?? 0
    base.outline_width_converted =
      placement.outline_width_converted ?? base.outline_width_converted ?? 0
    base.color = placement.color || base.color || '#000000'
    base.color_pantone = placement.color_pantone || base.color_pantone || ''
    base.outline_color = placement.outline_color || base.outline_color || '#FFFFFF'
    base.outline_color_pantone = placement.outline_color_pantone || base.outline_color_pantone || ''
    base.color_tab_index = placement.color_tab_index ?? base.color_tab_index ?? 0
    base.font_family = placement.font_family || base.font_family || ''
    base.selected = true
    base.scaleX = placement.scaleX ?? base.scaleX ?? 1
    base.scaleY = placement.scaleY ?? base.scaleY ?? 1

    // Track which placement was used to create this item
    ;(base as Record<string, unknown>).placement_id = placement.id

    return base
  }

  const locale = computed<ParaglideLocale>(() => profileStore.currentLocale ?? 'en')
  const translateFixedText = texts_fixed_text_label as (
    inputs?: Record<string, never>,
    options?: { locale?: ParaglideLocale }
  ) => string

  function fixedTextLabel(): string {
    return translateFixedText({}, { locale: locale.value })
  }

  /**
   * Creates a new text entry from a template and placement
   *
   * This function is used when adding a new text entry (not updating an existing one).
   * It creates a completely new entry with:
   * - A new temporary negative ID (never reuses template ID to avoid overriding presets)
   * - Type set to 'name' (all new entries are name type)
   * - Label set to 'fixed text'
   * - Placement coordinates from the selected placement
   * - Styling properties from template if available
   *
   * @param template - Optional template text to inherit properties from
   * @param placement - The selected placement with coordinates
   * @param productIdValue - The product ID this entry belongs to
   * @returns A new OutputProductText entry ready to be added to customization
   */
  function buildEntryFromTemplate(
    template: OutputProductText | undefined,
    placement: TextItemPlacement,
    productIdValue: number
  ): OutputProductText {
    // Generate new temporary ID - never reuse template ID to prevent overriding preset texts
    const entry: OutputProductText = {
      id: customizationStore.generateTemporaryTextId(productIdValue),
      product_id: productIdValue,
      type: 'name', // All new entries are type 'name'
      label: fixedTextLabel(),
      placeholder: template?.placeholder ?? null,
      following_products: template?.following_products ?? [],
      items: [],
      created_at: null,
      updated_at: null,
      deleted_at: null,
      value: template?.value ?? '',
      manually_added: true, // Mark as manually added to distinguish from presets
      font_family: template?.font_family ?? placement.font_family ?? '',
      following_product_ids: template?.following_product_ids ?? [],
      active_item_index: 0,
      is_first_name: template?.is_first_name,
      is_first_number: template?.is_first_number,
      is_default: template?.is_default
    }

    // Build the item from placement (using template item as base if available)
    const templateItem = template?.items?.[template.active_item_index ?? 0]
    const item = buildItemFromPlacement(placement, templateItem)
    entry.items = [item]

    return entry
  }

  /**
   * Creates a new text entry to replace an existing one with new placement coordinates
   *
   * This function is used when updating an existing manually-added entry with a new placement.
   * It creates a completely new entry (doesn't clone the current one) to ensure clean state.
   *
   * Note: This should only be called for manually-added entries, not preset texts.
   * Preset texts should never be updated - new entries should be created instead.
   *
   * @param current - The current entry being updated
   * @param placement - The new placement with coordinates
   * @param template - Optional template to inherit properties from
   * @returns A new OutputProductText entry with new placement coordinates
   */
  function updateEntryWithPlacement(
    current: OutputProductText,
    placement: TextItemPlacement,
    template?: OutputProductText
  ): OutputProductText {
    // Create new entry (don't clone current to ensure clean state)
    const next: OutputProductText = {
      id: customizationStore.generateTemporaryTextId(current.product_id),
      product_id: current.product_id,
      type: 'name',
      label: fixedTextLabel(),
      placeholder: template?.placeholder ?? null,
      following_products: template?.following_products ?? [],
      items: [],
      created_at: null,
      updated_at: null,
      deleted_at: null,
      value: '',
      manually_added: true,
      font_family: template?.font_family ?? placement.font_family ?? '',
      following_product_ids: template?.following_product_ids ?? [],
      active_item_index: 0,
      is_first_name: false,
      is_first_number: false,
      is_default: false
    }

    // Build item from placement (prefer template item, fallback to current's active item)
    const templateItem =
      template?.items?.[template.active_item_index ?? 0] ?? getActiveItem(current)
    const item = buildItemFromPlacement(placement, templateItem)
    next.items = [item]

    return next
  }

  /**
   * Finds a text item that was created from a specific placement
   *
   * @param entry - The text entry to search in
   * @param placementId - The placement ID to find
   * @returns The matching item, or null if not found
   */
  function getPlacementItem(
    entry: OutputProductText | null,
    placementId: number
  ): ExtendedTextItem | null {
    if (!entry?.items) return null
    return (
      (entry.items.find(item => (item as ExtendedTextItem).placement_id === placementId) as
        | ExtendedTextItem
        | undefined) ?? null
    )
  }

  /**
   * Checks if a text entry has an item for a specific placement
   *
   * @param entry - The text entry to check
   * @param placementId - The placement ID to check for
   * @returns True if the entry has an item for this placement
   */
  function isPlacementEnabled(entry: OutputProductText | null, placementId: number): boolean {
    return getPlacementItem(entry, placementId) !== null
  }

  // ===== RETURN =====
  return {
    // State
    selectedPlacementId,
    // Computed
    placementMap,
    currentPlacement,
    availableTextPlacements,
    // Utilities
    getActiveItem,
    buildItemFromPlacement,
    buildEntryFromTemplate,
    updateEntryWithPlacement,
    getPlacementItem,
    isPlacementEnabled
  }
}
