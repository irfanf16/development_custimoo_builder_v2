import type { FactoryProduct } from '@/services/orders/types'
import type { Style3DMap, StyleLogoEntry, StyleLogoTechnology } from '@/services/types'

export type OutputStylePreviewBase = {
  id: number
  name: string
  product_id: number
  style_icon_url?: string
  logo: StyleLogoEntry[]
}

export type OutputStylePreviewFront = OutputStylePreviewBase & {
  front_models: {
    composition: 'multiply' | 'screen'
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }[]
}

export type OutputStylePreviewBack = OutputStylePreviewBase & {
  back_models: {
    composition: 'multiply' | 'screen'
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }[]
}

type CustomizedAddons = {
  grouped_addons: Record<string, import('./addons').OutputAddon[]>
  ungrouped_addons: import('./addons').OutputAddon[]
}

export type OutputStyleDetails = OutputStylePreviewFront & {
  _3d_alpha_map: Style3DMap
  _3d_ao_map: Style3DMap
  _3d_metalness_map: Style3DMap
  _3d_model: Style3DMap
  _3d_roughness_map: Style3DMap
  _3d_texture: Style3DMap
  back_enabled: boolean
  back_models: {
    composition: 'multiply' | 'screen'
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }[]
  composition: 'multiply' | 'screen'
  container_id: number
  created_at: string
  customized_addons: CustomizedAddons
  default_style: number
  deleted_at: string | null
  id: number
  is_default: 1 | 0
  is_fixed_logos_all: boolean
  logo: StyleLogoEntry[]
  logo_technologies: StyleLogoTechnology[]
  metalness: number | null
  three_d_properties?: {
    normalScaleX?: number | null
    normalScaleY?: number | null
    roughness?: number | null
    metalness?: number | null
    sheen?: number | null
    sheenColor?: string | null
    sheenRoughness?: number | null
    reflectivity?: number | null
    /** When true (or 1), tileX / tileY apply to loaded maps */
    textureTiling?: boolean | number | null
    insideMaterialColor?: string | null
    tileX?: number | null
    tileY?: number | null
  } | null
  _3d_inside_material_color: string | null
  _3d_normal_scaleX: number | null
  _3d_normal_scaleY: number | null
  _3d_reflectivity: number | null
  _3d_sheen: number | null
  _3d_sheen_color: string | null
  _3d_sheen_roughness: number | null
  _3d_texture_tiling: number | null
  name: string
  product_id: number
  roughness: number | null
  style_icon: number
  style_icon_id: number | null
  style_icon_url: string
  updated_at: string
}

export type ActiveProductDetails = {
  productDetails: import('./products').OutputProductDetails
  styleDetails: OutputStyleDetails
  designDetails: import('./designs').OutputDesignDetails
}

export type ActiveStyleDetails = {
  styleDetails: OutputStyleDetails
  designDetails: import('./designs').OutputDesignDetails
}

export type ActiveDesignDetails = {
  designDetails: import('./designs').OutputDesignDetails
}

export type ShareProductDetails = {
  factoryProducts: FactoryProduct[]
  factoryProductActiveIndex: number
  lockerProductId: number | null
  activityId: number | null
  activityItems: unknown
  cartId: number | null
  factoryId: number | null
  id: number | null
  orderId: number | null
}
