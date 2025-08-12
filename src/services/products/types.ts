export type Category = {
  id: number
  parent_id: number | null
  category_name: string
  factory_id: number | null
  company_id: number
  image_url: string | null
  searchable: number
  sort_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  subcategories: Category[]
}

export type OutputProductCategories = {
  no_product_found: boolean
  no_search_product_found: boolean
  product_category_id: number | null
  product_sub_category_id: number | null
  data: Category[]
  customized_count: number
  personalized_count: number
  private_product_count: number
  customized: boolean
  personalized: boolean
  private_product: boolean
}

export type GetProductCategoriesParams = {
  product_id?: number
  customized?: boolean
  personalized?: boolean
  private?: boolean
  title?: string
  sync_id?: number
  share_url?: string
}
