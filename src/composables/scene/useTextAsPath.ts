import { loadSVGFromString, util, type FabricObject } from 'fabric'
import type { CreateTextAsPathParams } from './useTexts'

const { groupSVGElements } = util

/** OpenType font instance (from opentype.js Font). */
export type OpentypeFont = {
  getPath: (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    options?: { features?: { liga?: boolean; rlig?: boolean } }
  ) => { toSVG: (decimalPlaces?: number) => string }
}

/** Map of font family name to font with opentype instance (e.g. products_fonts from store). */
export type ProductsFonts = Record<string, { url?: string; opentype_font?: OpentypeFont }>

/**
 * Opentype-based: turn text into path-based Fabric object (exact bounds, no font padding).
 * Same as old Scene: opentype font.getPath() → toSVG() then loadSVGFromString → groupSVGElements.
 * Pass productsFonts with opentype_font pre-loaded (e.g. from useProductsFontsStore).
 */
export function createTextAsPathFromFonts(
  productsFonts: ProductsFonts
): (params: CreateTextAsPathParams) => Promise<FabricObject | null> {
  return async (params: CreateTextAsPathParams): Promise<FabricObject | null> => {
    const { value, fontFamily, fill = '#000000', stroke, strokeWidth = 0 } = params
    if (!value?.trim()) return null

    const keys = Object.keys(productsFonts)
    let font = productsFonts[fontFamily]?.opentype_font
    if (!font && keys.length > 0) {
      const firstKey = keys[0]
      if (firstKey !== undefined) {
        font = productsFonts[firstKey]?.opentype_font
      }
    }
    if (!font) return null

    try {
      const path = font.getPath(value, 0, 0, 72, {
        features: { liga: true, rlig: true }
      })
      const pathSvg = path.toSVG(2)
      const textSvg =
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" xml:space="preserve">\n' +
        pathSvg +
        '\n</svg>'

      const parsed = await loadSVGFromString(textSvg)
      const objects = (parsed.objects ?? []).filter((o): o is FabricObject => o != null)
      if (objects.length === 0) return null

      const group = groupSVGElements(objects)
      group.set({
        fill,
        stroke: stroke ?? undefined,
        strokeWidth: strokeWidth ?? 0,
        paintFirst: 'stroke',
        originX: 'center',
        originY: 'center'
      })
      group.setCoords()
      return group
    } catch {
      return null
    }
  }
}
