export type OutputCompanyAddon = {
  id: number
  addon_data: {
    currencies: {
      code: string
      name: string
      price: number
      symbol: string
    }[]
    description: string
    note: string | null
    title: string
  }
  addon_ecommerce_modifier_id: number | null
  addon_ecommerce_product_id: number | null
  addon_ecommerce_variant_id: number | null
  addon_id: number
  addon_sync_id: number | null
  company_id: number
  created_at: string
  deleted_at: string | null
  updated_at: string
}

export type OutputAddon = {
  addon_ecommerce_modifier_id: number | null
  addon_ecommerce_product_id: number | null
  addon_ecommerce_variant_id: number | null
  addon_group_id: number | null
  addon_id: number
  currencies: {
    code: string
    name: string
    price: number
    symbol: string
  }[]
  customized_sku_info: number | null
  data_container_id: number | null
  description: string
  note: string | null
  published: boolean
  selected: boolean
  title: string
}
