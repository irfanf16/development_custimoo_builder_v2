export type Category = {
  category_name: string
  company_id: number
  created_at: string
  deleted_at: string | null
  factory_id: number | null
  id: number
  image_url: string | null
  parent_id: number | null
  searchable: number
  sort_order: number
  subcategories: Category[]
  updated_at: string
}

export type OutputProductCategories = {
  customized: boolean
  customized_count: number
  data: Category[]
  no_product_found: boolean
  no_search_product_found: boolean
  personalized: boolean
  personalized_count: number
  private_product: boolean
  private_product_count: number
  product_category_id: number | null
  product_sub_category_id: number | null
}

export type GetProductCategoriesParams = {
  customized?: boolean
  private?: boolean
  personalized?: boolean
  product_id?: number
  share_url?: string
  sync_id?: number
  title?: string
}

export type getProductByCategoryIdParams = {
  category_id: number
  customized: boolean
  personalized: boolean
  private: boolean
}
