/**
 * Extract customizable SVG part ids from an SVG string using Fabric.js,
 * matching the rules in useSvgGroups.extractSvgGroups (ThreeDScene / TwoDScene).
 */
import { loadSVGFromString, util, type FabricObject, Group } from 'fabric'
import type { GradientColor } from '@/services/products/types'

function rgbToHex(rgb: string | undefined): string {
  if (!rgb) return '#000000'
  const match = rgb.match(/\d+/g)
  if (!match || match.length < 3) return rgb
  const r = parseInt(match[0] || '0', 10)
  const g = parseInt(match[1] || '0', 10)
  const b = parseInt(match[2] || '0', 10)
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const h = x.toString(16)
        return h.length === 1 ? '0' + h : h
      })
      .join('')
  )
}

type PartEntry = { id: string; count: number }

/**
 * Collect colorable part ids from a Fabric group (same filters as useSvgGroups.extractSvgGroups).
 */
function collectPartEntriesFromDesignObject(designObject: FabricObject | Group): PartEntry[] {
  const entries: PartEntry[] = []
  const seenIds = new Set<string>()

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

    const itemId = idValue.split('_')[0]?.toLowerCase() || idValue.toLowerCase()
    if (!itemId) return

    if (
      itemId.includes('noncustomizable') ||
      itemId.includes('inside') ||
      itemId.includes('anchor') ||
      seenIds.has(itemId)
    ) {
      return
    }

    let count = 1
    if (itemId === 'base') {
      count = 100000
    }

    const fill = itemWithId.fill

    if (
      fill &&
      typeof fill === 'object' &&
      'gradientUnits' in fill &&
      (fill as { gradientUnits?: string }).gradientUnits
    ) {
      const gradient_colors: GradientColor[] = []
      const gFill = fill as { colorStops?: Array<{ color: string; offset?: number }> }
      if (gFill.colorStops) {
        const totalStops = gFill.colorStops.length
        gFill.colorStops.forEach((color_stop, index) => {
          const offset = color_stop.offset ?? (totalStops > 1 ? index / (totalStops - 1) : 0)
          const percentage = offset * 100
          let color = color_stop.color
          if (color.includes('rgb')) {
            color = rgbToHex(color)
            if (!color.startsWith('#')) color = '#' + color
          }
          gradient_colors.push({
            color,
            pantone: '',
            name: '',
            percentage
          })
        })
      }
      gradient_colors.sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0))
      seenIds.add(itemId)
      entries.push({ id: itemId, count })
    } else if (fill && typeof fill === 'string') {
      seenIds.add(itemId)
      entries.push({ id: itemId, count })
    }
  })

  entries.sort((a, b) => (a.count < b.count ? 1 : -1))
  return entries
}

/**
 * Parse SVG text and return ordered part ids (e.g. base, sides, chevrons, belt).
 */
export async function extractSvgPartIdsFromSvgText(svgText: string): Promise<string[]> {
  const { objects } = (await loadSVGFromString(svgText)) as unknown as {
    objects: unknown[]
  }
  const safeObjects = (objects || []).filter(Boolean) as FabricObject[]
  const group = util.groupSVGElements(safeObjects) as Group
  const entries = collectPartEntriesFromDesignObject(group as FabricObject)
  return entries.map(e => e.id)
}
