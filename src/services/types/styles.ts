export type Style3DMap = {
  composition: 'multiply' | 'screen' | null
  file_url: string
  id: number
  thumb_sm_url: string | null
  type: string
}

export type StyleLogoTechnology = string

/**
 * Single logo item (drawn on canvas).
 * Backend now nests these under groups (`StyleLogoEntry.logos`), but we keep
 * optional overlap fields so old flat payloads continue to work.
 */
export type StyleLogoAsset = {
  id?: number
  product_id?: number
  company_id?: number
  style_id?: number
  color_id?: number
  file_id?: number
  placement_title?: string
  x_axis?: number
  y_axis?: number
  rotation?: number
  width?: number
  height?: number
  side?: string
  is_default?: boolean | 0 | 1
  is_customizable?: boolean | 0 | 1
  url?: string
  group?: string | null
  color?: string | null
}

/**
 * Fixed logo group (old customizer-compatible response shape):
 * { id, is_default, placement_title, logos: StyleLogoAsset[] }.
 * Also allows flat fields for backward compatibility.
 */
export type StyleLogoEntry = StyleLogoAsset & {
  name?: string
  logos?: StyleLogoAsset[]
}
