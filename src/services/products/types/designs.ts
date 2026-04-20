export type OutputDesignAsset = {
  color_group: string | null
  design_categories_pivot: {
    design_category_id: number
    design_file_id: number
  }[]
  design_name: string
  design_position: string
  file_base_url: string
  file_extension: string
  file_thumbnail_url: string
  file_url: string
  id: number
}

export type OutputDesignPreviewBase = {
  id: number
  is_default: 1 | 0
  svg_parts: string[]
  design_name: string
  design_show: number
  is_active: number
  /** Set when the design was uploaded by the customer (custom design). */
  customer_id?: number | null
}
export type OutputDesignPreviewFront = OutputDesignPreviewBase & {
  front_design: OutputDesignAsset
  frontsafezone_design: OutputDesignAsset
  frontboundary_design: OutputDesignAsset
}

export type OutputDesignPreviewBack = OutputDesignPreviewBase & {
  back_design: OutputDesignAsset
  backboundary_design: OutputDesignAsset
  backsafezone_design: OutputDesignAsset
}

export type OutputDesignDetails = OutputDesignPreviewFront &
  OutputDesignPreviewBack & {
    container_file_id: number
    created_at: string
    deleted_at: string | null
    design_show_on_scroll: number
    front_design_id: number
    back_design_id?: number
    frontsafezone_design_id?: number
    frontboundary_design_id?: number
    backsafezone_design_id?: number
    backboundary_design_id?: number
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
