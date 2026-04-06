import { ref, computed, watch, type Ref } from 'vue'
import { Group, type FabricObject } from 'fabric'
import { useProductsStore } from '@/stores/products/products.store'
import { getSelectedProductPantones, getClosestColor, getColorType } from '@/lib/utils'
import type { OutputSvgGroupColor, GradientColor } from '@/services/products/types'
import type { CanvasSide } from '@/stores/workflow/workflow.store.types'

/**
 * Convert RGB color string to hex
 * @param rgb - RGB color string (e.g., "rgb(255, 0, 0)" or "rgba(255, 0, 0, 0.5)")
 */
function rgbToHex(rgb: string | undefined): string {
  if (!rgb) return '#000000'
  // Extract RGB values using regex
  const match = rgb.match(/\d+/g)
  if (!match || match.length < 3) return rgb

  const r = parseInt(match[0] || '0', 10)
  const g = parseInt(match[1] || '0', 10)
  const b = parseInt(match[2] || '0', 10)

  // Convert to hex
  const hex =
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')

  return hex
}

/**
 * Composable for SVG groups extraction and management
 * Shared between TwoDScene and ThreeDScene
 */
export function useSvgGroups(
  productId: Ref<number | null> | (() => number | null),
  side: CanvasSide = 'front',
  mainPreview = false,
  svgParts?: Ref<string[] | string | null | undefined>
) {
  // ===== DEPENDENCIES =====
  const productsStore = useProductsStore()

  // ===== STATE =====
  const svgGroups = ref<OutputSvgGroupColor[]>([])
  const initialSvgGroups = ref<OutputSvgGroupColor[]>([])
  const parts = ref<string[]>([])

  // ===== SVG PARTS COMPUTED =====
  // Use svgParts prop if provided, otherwise get from activeDesignDetails
  const effectiveSvgParts = computed<string[] | string | undefined>(() => {
    // Get value from ref if provided
    const svgPartsValue = svgParts?.value

    if (svgPartsValue) {
      return svgPartsValue
    }
    // Fallback to activeDesignDetails production_design svg_parts
    return productsStore.activeDesignDetails?.svg_parts
  })

  // Initialize parts from effectiveSvgParts
  function initializeParts(svgPartsValue: string[] | string | undefined): void {
    if (!svgPartsValue) return

    if (typeof svgPartsValue === 'string') {
      try {
        parts.value = (JSON.parse(svgPartsValue) as string[]) || []
      } catch {
        parts.value = []
      }
    } else if (Array.isArray(svgPartsValue)) {
      parts.value = [...svgPartsValue]
    }
  }

  // Initialize parts from effectiveSvgParts initially
  initializeParts(effectiveSvgParts.value)

  // Watch for changes in effectiveSvgParts and update parts if needed
  watch(
    effectiveSvgParts,
    newSvgParts => {
      if (newSvgParts && parts.value.length === 0) {
        // If parts are not yet initialized and we have svgParts, initialize them
        initializeParts(newSvgParts)
      }
    },
    { immediate: false }
  )

  // ===== COMPUTED =====
  const effectiveProductId = computed(() => {
    if (typeof productId === 'function') {
      return productId()
    }
    return productId.value
  })

  // ===== UTILITIES =====
  /**
   * Check if an object with the given id already exists in svgGroups
   */
  function containsObject(obj: { id: string }): boolean {
    return svgGroups.value.some(group => group.id === obj.id)
  }

  /**
   * Extract SVG groups from a Fabric.js design object
   * @param designObject - Fabric.js design object - Fabric.js design object (Group or single object)
   */
  function extractSvgGroups(designObject: FabricObject | Group | null): void {
    if (!designObject) return

    svgGroups.value = []
    initialSvgGroups.value = []

    // Get design objects - handle both Group and single object
    const design = (designObject as Group & { _objects?: FabricObject[] })._objects
      ? (designObject as Group)._objects || []
      : [designObject]

    design.forEach(item => {
      const itemWithId = item as FabricObject & {
        id?: string
        fill?: string | { gradientUnits?: string; colorStops?: Array<{ color: string }> }
      }
      const idValue = itemWithId.id
      if (!idValue) return

      // Process id: split by underscore and take first part, convert to lowercase
      const itemId = idValue.split('_')[0]?.toLowerCase() || idValue.toLowerCase()
      if (!itemId) return

      itemWithId.set('id', itemId)

      // Skip non-customizable parts
      if (
        itemId.includes('noncustomizable') ||
        itemId.includes('inside') ||
        itemId.includes('anchor') ||
        containsObject({ id: itemId })
      ) {
        return
      }

      let count = 1
      if (itemId === 'base') {
        count = 100000 // Make base always at first color position
      }

      const effectiveId = effectiveProductId.value

      // Handle gradient fills
      if (
        itemWithId.fill &&
        typeof itemWithId.fill === 'object' &&
        'gradientUnits' in itemWithId.fill &&
        itemWithId.fill.gradientUnits
      ) {
        const gradient_colors: GradientColor[] = []

        if (itemWithId.fill.colorStops) {
          const totalStops = itemWithId.fill.colorStops.length
          itemWithId.fill.colorStops.forEach(
            (color_stop: { color: string; offset?: number }, index: number) => {
              // Get offset percentage: offset is 0-1, convert to 0-100%
              // If offset is not provided, calculate based on index position
              const offset = color_stop.offset ?? (totalStops > 1 ? index / (totalStops - 1) : 0)
              const percentage = offset * 100
              let color = color_stop.color

              // Convert RGB to hex if needed
              if (color.includes('rgb')) {
                color = rgbToHex(color)
                if (!color.startsWith('#')) {
                  color = '#' + color
                }
              }

              // Get pantone color match (only for main preview)
              const selectProductPantonesList = getSelectedProductPantones(effectiveId, itemId)
              const pantoneColor = mainPreview
                ? getClosestColor(
                    color,
                    selectProductPantonesList,
                    getColorType(itemId, effectiveId)
                  )
                : { pantone: '', name: '' }

              gradient_colors.push({
                color,
                pantone: pantoneColor.pantone,
                name: pantoneColor.name,
                percentage: percentage
              })
            }
          )
        }

        // Sort gradient_colors by percentage before pushing to svgGroups
        gradient_colors.sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0))

        svgGroups.value.push({
          id: itemId,
          color: gradient_colors[0]?.color || '#000000',
          count,
          gradient_colors,
          pantone: '',
          name: ''
        })
      }
      // Handle solid fills
      else if (itemWithId.fill && typeof itemWithId.fill === 'string') {
        let fillColor = itemWithId.fill

        // Convert RGB to hex if needed
        if (fillColor.includes('rgb')) {
          fillColor = rgbToHex(fillColor)
          if (!fillColor.startsWith('#')) {
            fillColor = '#' + fillColor
          }
        }

        // Get pantone color match (only for main preview)
        const selectProductPantonesList = getSelectedProductPantones(effectiveId, itemId)
        const pantoneColor = mainPreview
          ? getClosestColor(fillColor, selectProductPantonesList, getColorType(itemId, effectiveId))
          : { pantone: '', name: '' }

        svgGroups.value.push({
          id: itemId,
          color: fillColor,
          count,
          pantone: pantoneColor.pantone,
          name: pantoneColor.name
        })
      }
    })

    // Sort by count (descending)
    svgGroups.value = svgGroups.value.sort((a, b) => (a.count < b.count ? 1 : -1))

    // Store initial state locally (for this component instance)
    initialSvgGroups.value = JSON.parse(JSON.stringify(svgGroups.value)) as OutputSvgGroupColor[]

    // Dispatch to store if mainPreview is enabled
    if (mainPreview) {
      productsStore.setSvgGroups(svgGroups.value, side, true)
    }

    // Always rebuild parts from this design's svgGroups so shuffle/default colors stay in sync
    // after design switches (previously parts stuck when length > 0).
    // Optional explicit svg_parts from props/store still seeds initial order via initializeParts + watch;
    // after extract, permutation order follows extracted groups unless overridden below.
    const fromPropOrStore = svgParts?.value ?? productsStore.activeDesignDetails?.svg_parts
    if (fromPropOrStore) {
      let ordered: string[] = []
      if (typeof fromPropOrStore === 'string') {
        try {
          ordered = (JSON.parse(fromPropOrStore) as string[]) || []
        } catch {
          ordered = []
        }
      } else if (Array.isArray(fromPropOrStore)) {
        ordered = [...fromPropOrStore]
      }
      const ids = new Set(svgGroups.value.map(g => g.id))
      const filtered = ordered.filter(id => ids.has(id))
      const rest = svgGroups.value.map(g => g.id).filter(id => !filtered.includes(id))
      parts.value = [...filtered, ...rest]
    } else {
      parts.value = svgGroups.value.map(group => group.id)
    }
  }

  // ===== RETURN =====
  return {
    // State
    svgGroups,
    initialSvgGroups,
    parts,
    // Actions
    extractSvgGroups,
    containsObject
  }
}
