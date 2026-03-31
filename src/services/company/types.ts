export type Platform = 'self' | 'shopify' | 'wordpress' | 'cdnExceptLogin'

export type LoginCode = {
  type: 'url' | 'code'
  action: string
  logout_type: 'url' | 'code'
  logout_action: string
}

export type Company = {
  id: number
  platform: Platform
  login_code: LoginCode | null
  customizer_page_url: string | null
  status: number
  pending_payment: number
  inactive_message: string | null
  enable_accessibe: number
  ecom_with_ordertab: number
  company_domain: string
  translations: {
    [key: string]: {
      minimum_order_roster_message: string
      minimum_order_cart_message: string
      minimum_order_moq_message: string
    }
  }
}

export type OutputCompany = {
  company: Company
}

export type FactorySetting = {
  key_name: string
  sourceable_id: number
  value: boolean
}

export type OutputSettingsResponse = {
  success: true
  message: string
  result: OutputSettings
  errors: []
  status_code: number
}

/** Single item from collection_image_admin (hero images). API may return as JSON string. */
export type CollectionImageAdminItem = {
  index: number
  img_url: string
  full_width: boolean
  dimension: { width: number | null; height: number | null }
}

export type OutputSettings = {
  factory_settings: FactorySetting[]
  settings: {
    allow_shuffle_colors: boolean
    /** Hero images for collection view. Backend may send stringified JSON; parse before use. */
    collection_image_admin: string | CollectionImageAdminItem[]
    collection_image_merchant: {
      collection: {
        index: number
        img_url: string
        full_width: boolean
        dimension: {
          width: number | null
          height: number | null
        }
      }
      is_custom_collection: boolean
      selection_index: number
    }
    color_type: 'pantone_coated' | 'pantone_tcx'
    currencies: {
      visible: boolean
      /** Backend field name (typo). Ordered list; first entry is treated as default display currency. */
      currenncies?: Array<'USD' | 'EUR' | 'GBP' | 'DKK' | 'SEK' | 'CAD'>
      /** Some API responses use the correct spelling instead of `currenncies`. */
      currencies?: Array<'USD' | 'EUR' | 'GBP' | 'DKK' | 'SEK' | 'CAD'>
    }
    get_quote: {
      cart_with_quote: boolean
      enable: boolean
      receipients: string[]
    }
    logo_color_type: 'pantone_coated' | 'pantone_tcx'
    measurement_unit: {
      unit: 'cm' | 'in'
      conversion_value: number
      conversion_operator: 'multiply' | 'divide'
    }
    moq: number
    msrp_label: {
      msrp_label: string | null
      is_custom_msrp_label: boolean
    }
    msrp_label_admin: string
    requires_order_permission: boolean
    ship_only_to_store: boolean
    store_address: {
      address1: string | null
      address2: string | null
      city: string | null
      company_name: string | null
      country: number
      email: string | null
      first_name: string | null
      last_name: string | null
      phone_number: string | null
      state: string | null
      zip_code: string | null
    }
  }
  ui_branding: UIBranding
}

export type UIBranding = {
  allow_color_mode_switch: boolean
  border_radius: number
  brand_font_family?: string
  brand_font_file?: string
  brand_font_is_custom?: string
  default_font_family?: string
  default_font_file?: string
  default_font_is_custom?: string
  theme: 'light' | 'dark'
  theme_color: string
}
