export type OutputStylePreview = {
  front_models: {
    composition: 'multiply' | 'screen'
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }[]
  id: number
  logo: unknown[]
  name: string
  product_id: number
  style_icon_url?: string
}

type CustomizedAddons = {
  grouped_addons: Record<string, import('./addons').OutputAddon[]>
  ungrouped_addons: import('./addons').OutputAddon[]
}

export type OutputStyleDetails = OutputStylePreview & {
  _3d_alpha_map: unknown
  _3d_ao_map: unknown
  _3d_metalness_map: unknown
  _3d_model: {
    composition: 'multiply' | 'screen' | null
    file_url: string
    id: number
    thumb_sm_url: string | null
    type: string
  }
  _3d_roughness_map: unknown
  _3d_texture: {
    composition: 'multiply' | 'screen' | null
    file_url: string
    id: number
    thumb_sm_url: string | null
    type: string
  }
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
  front_models: {
    composition: 'multiply' | 'screen'
    file_url: string
    id: number
    thumb_sm_url: string
    type: string
  }[]
  id: number
  is_default: 1 | 0
  is_fixed_logos_all: boolean
  logo: unknown[]
  logo_technologies: unknown[]
  metalness: number | null
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
