export type OutputDesignPreview = {
  id: number
  is_default: 1 | 0
  front_design: {
    color_group: string | null
    design_name: string
    design_position: string
    file_base_url: string
    file_extension: string
    file_thumbnail_url: string
    file_url: string
    id: number
  }
  frontsafezone_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    id: number
  }
  frontboundary_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    id: number
  }
  svg_parts: string[]
}

export type OutputDesignDetails = OutputDesignPreview & {
  back_design: {
    color_group: string | null
    design_name: string
    design_position: string
    file_base_url: string
    file_extension: string
    file_thumbnail_url: string
    file_url: string
    id: number
  }
  backboundary_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    id: number
  }
  backsafezone_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    id: number
  }
  container_file_id: number
  created_at: string
  deleted_at: string | null
  design_name: string
  design_show: number
  design_show_on_scroll: number
  front_design_id: number
  back_design_id?: number
  frontsafezone_design_id?: number
  frontboundary_design_id?: number
  backsafezone_design_id?: number
  backboundary_design_id?: number
  is_active: number
  production_design: {
    design_position: string
    file_base_url?: string
    file_extension?: string
    file_thumbnail_url?: string
    file_url: string
    file_id?: number
    container_id?: number
    design_name?: string
    color_group?: string
    file_name?: string
    svg_parts?: string[]
    id: number
  }
  production_design_id: number
  productionsafezone_design: {
    design_position: string
    file_base_url: string
    file_extension: string
    file_thumbnail_url: string
    file_url: string
    id: number
  } | null
  productionsafezone_design_id: number | null
  product_id: number
  product_style_id: number
  updated_at: string
}
