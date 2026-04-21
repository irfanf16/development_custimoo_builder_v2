import type { OutputProductText, OutputProductTextItem } from '@/services/products/types'

const TEXT_TYPES = new Set(['name', 'number', 'team_name'])

function str(value: unknown, fallback: string): string {
  if (value == null) return fallback
  if (typeof value === 'string') return value || fallback
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function coerceId(raw: unknown): number | string | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim() !== '') return raw
  return undefined
}

/** API may hide text when selected is 0 / "0" / false only. */
function coerceItemSelected(raw: unknown): boolean {
  if (raw === false || raw === 0 || raw === '0') return false
  return true
}

function cloneItem(item: OutputProductTextItem): OutputProductTextItem {
  return {
    ...item,
    selected: coerceItemSelected(item.selected)
  }
}

/**
 * JSON string, array, or object map (e.g. keyed rows) → array of row objects.
 */
export function coerceCustomTextToArray(input: unknown): unknown[] {
  if (input == null) return []
  let v: unknown = input
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t) return []
    try {
      v = JSON.parse(t) as unknown
    } catch {
      return []
    }
  }
  if (Array.isArray(v)) return v
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data as unknown[]
    const vals = Object.values(o)
    if (
      vals.length > 0 &&
      vals.every(x => x != null && typeof x === 'object' && !Array.isArray(x))
    ) {
      return vals
    }
  }
  return []
}

function buildSyntheticItem(
  rec: Record<string, unknown>,
  entryLabel: string,
  entryFont: string
): OutputProductTextItem {
  const placementRaw = str(rec.placement, 'Front')
  const placement: 'Front' | 'Back' = placementRaw.toLowerCase() === 'back' ? 'Back' : 'Front'
  return {
    label: str(rec.label, entryLabel),
    height: str(rec.height, '80'),
    x_axis: str(rec.x_axis, '50'),
    y_axis: str(rec.y_axis, '50'),
    rotation: str(rec.rotation, '0'),
    is_locked: !!rec.is_locked,
    placement,
    outline_enabled: !!rec.outline_enabled,
    arc_text_allowed: !!rec.arc_text_allowed,
    font_family: str(rec.font_family, entryFont),
    color: str(rec.color, '#000000'),
    color_pantone: str(rec.color_pantone, ''),
    outline_width: Number(rec.outline_width ?? 0),
    outline_width_converted: Number(rec.outline_width_converted ?? 0),
    color_tab_index: Number(rec.color_tab_index ?? 0),
    outline_color: str(rec.outline_color, '#ffffff'),
    outline_color_pantone: str(rec.outline_color_pantone, ''),
    selected: coerceItemSelected(rec.selected),
    scaleX: Number(rec.scaleX ?? 1),
    scaleY: Number(rec.scaleY ?? 1),
    pinned: !!rec.pinned
  }
}

function normalizeItemsArray(
  itemsRaw: unknown,
  rec: Record<string, unknown>,
  entryLabel: string,
  entryFont: string
): OutputProductTextItem[] {
  let v = itemsRaw
  if (typeof v === 'string' && v.trim()) {
    try {
      v = JSON.parse(v) as unknown
    } catch {
      v = null
    }
  }
  if (Array.isArray(v) && v.length > 0) {
    return v.map(raw => {
      if (!raw || typeof raw !== 'object') {
        return buildSyntheticItem(rec, entryLabel, entryFont)
      }
      const ir = raw as Record<string, unknown>
      return cloneItem(buildSyntheticItem({ ...rec, ...ir }, entryLabel, entryFont))
    })
  }
  return [buildSyntheticItem(rec, entryLabel, entryFont)]
}

function normalizeTextEntry(rec: Record<string, unknown>, id: number | string): OutputProductText {
  const rawType = str(rec.type, 'name')
  const type = TEXT_TYPES.has(rawType) ? (rawType as OutputProductText['type']) : 'name'
  const label = str(rec.label, 'Text')
  const font_family = str(rec.font_family, 'Ubuntu')

  let value = rec.value == null ? '' : str(rec.value, '')
  if (!value.trim()) {
    const ph = rec.placeholder
    if (ph != null && str(ph, '').trim()) value = str(ph, '')
    else value = 'Text'
  }

  const items = normalizeItemsArray(rec.items, rec, label, font_family)

  return {
    id,
    product_id: Number(rec.product_id) || 0,
    type,
    label,
    design_id: Number(rec.design_id) || null,
    placeholder: (rec.placeholder as string | null | undefined) ?? null,
    following_products: Array.isArray(rec.following_products)
      ? [...(rec.following_products as number[])]
      : [],
    items,
    created_at: (rec.created_at as string | null) ?? null,
    updated_at: (rec.updated_at as string | null) ?? null,
    deleted_at: (rec.deleted_at as string | null) ?? null,
    value,
    manually_added: !!rec.manually_added,
    font_family,
    following_product_ids: Array.isArray(rec.following_product_ids)
      ? [...(rec.following_product_ids as number[])]
      : [],
    active_item_index: Number(rec.active_item_index) || 0,
    is_first_name: rec.is_first_name as boolean | undefined,
    is_first_number: rec.is_first_number as boolean | undefined,
    is_default: rec.is_default as boolean | undefined
  }
}

/**
 * Normalizes API `custom_text` (array, JSON string, or object map) into rows with stable ids.
 */
export function normalizeDesignCustomText(
  input: unknown,
  options?: {
    productId?: number | null
    allocateTempId?: (productId: number) => number
  }
): OutputProductText[] {
  const raw = coerceCustomTextToArray(input)
  if (raw.length === 0) return []

  let localTemp = 0
  let batchTempFloor: number | null = null
  const nextFallbackId = (): number => {
    const pid = options?.productId
    if (pid != null && options?.allocateTempId) {
      if (batchTempFloor === null) {
        batchTempFloor = options.allocateTempId(pid)
      } else {
        batchTempFloor -= 1
      }
      return batchTempFloor
    }
    localTemp -= 1
    return localTemp
  }

  const candidates: OutputProductText[] = []
  for (const el of raw) {
    if (!el || typeof el !== 'object') continue
    const rec = el as Record<string, unknown>
    let id = coerceId(rec.id)
    if (id === undefined) id = nextFallbackId()
    candidates.push(normalizeTextEntry(rec, id))
  }

  const seen = new Set<number | string>()
  const out: OutputProductText[] = []
  for (const t of candidates) {
    if (seen.has(t.id)) continue
    seen.add(t.id)
    out.push(t)
  }
  return out
}

export function pickDesignCustomTextRaw(
  design:
    | {
        custom_text?: unknown
        customText?: unknown
        custom_texts?: unknown
        front_design?: {
          custom_text?: unknown
          customText?: unknown
          custom_texts?: unknown
        } | null
      }
    | null
    | undefined
): unknown {
  if (!design || typeof design !== 'object') return null
  const d = design as Record<string, unknown>
  const fromDesign = (): unknown[] => {
    for (const key of ['custom_text', 'customText', 'custom_texts'] as const) {
      const arr = coerceCustomTextToArray(d[key])
      if (arr.length > 0) return arr
    }
    return []
  }
  const row = fromDesign()
  if (row.length > 0) return row
  const fd = d.front_design
  if (fd && typeof fd === 'object') {
    const fr = fd as Record<string, unknown>
    for (const key of ['custom_text', 'customText', 'custom_texts'] as const) {
      const arr = coerceCustomTextToArray(fr[key])
      if (arr.length > 0) return arr
    }
  }
  return null
}

/** Normalize for design preview tiles (no store; fallback negative ids). */
export function resolveDesignPreviewCustomTexts(
  design:
    | {
        custom_text?: unknown
        front_design?: { custom_text?: unknown } | null
      }
    | null
    | undefined
): OutputProductText[] {
  const raw = pickDesignCustomTextRaw(design)
  return normalizeDesignCustomText(raw)
}
