export interface CancelOrderResponse {
  success: boolean
  message?: string
}
export interface FactoryProduct {
  id: string
  product_name?: string
  is_custom_product?: boolean
  front_image?: string
  back_image?: string
  custom_product_placeholder?: string
  prices?: { total_quantity?: number }
  roster_quantity?: number
}
export interface OrdersResponse {
  data: Order[]
  current_page: number
  per_page: number
  total: number
  next_page_url?: string | null
}
export interface Item {
  id?: number | string
  status?: string
  factory_products?: FactoryProduct[]
  status_activities: StatusActivity[]
}

export interface StatusActivity {
  id: number
  order_item_id: number
  message: string
  activity_items: any[]
  status: string
  action_log?: ActionLog
  action_by_id: number
  action_by: string
  created_at: string
  updated_at: string
  deleted_at: any
  add_comment: boolean
  user: User
  comments: Comment[]
  quality_control_reports: any[]
  quality_control_status: string
  timezone?: string
}

export interface ActionLog {
  reason: string
  manual_action: boolean
}

export interface Company {
  id: number
  company_name: string
  user_id: number
  pricelist_id: any
  provider_id: string
  vat_no: string
  company_domains: string[]
  subpage_url: any
  admin_domains: any
  login_code: string
  customizer_page_url: any
  address: string
  city: any
  phone: any
  post_code: any
  country_id: any
  contact_person_name: any
  contact_person_email: any
  platform: string
  inactive_message: any
  status: number
  pending_payment: number
  override_due_payment: number
  enable_accessibe: number
  customers: any[]
  products: any[]
}

export interface Pivot {
  model_id: number
  role_id: number
  model_type: string
  product_id: number
  file_id: number
  created_at: string
  updated_at: string
  sku_id: number
  currency_id: number
  price: any
  net_price: any
}

export interface Role {
  id: number
  name: string
  label: string
  scope: string
  app_type: string
  guard_name: string
  pivot: Pivot
}

export interface User {
  id: number
  company_id: any
  name: string
  first_name: string
  last_name: string
  email: string
  email_verified_at: any
  roles: Role[]
  userroles: Role[]
  company: Company
  is_default: number
}

export interface Order {
  id: number | string
  order_no?: string
  customer_reference_no?: string
  created_at?: string
  items?: Item[]
  general_comments?: string | null
  additional_fields: {
    is_manual_order: boolean
  }
}

export interface Currency {
  code: string
  name: string
  price: any
  symbol: string
}

export interface Report {
  status: 'Rejected' | 'Approved'
  pdf_url: string
  pdf_name: string
  created_at: string
}

export interface QcReport {
  reports: Report[]
  qa_status: 'Approved' | 'Rejected'
}

export interface NetPrice {
  is_fixed: boolean
  fixed_price: number
  discounted_price: number
  net_price: number
  code: string
  symbol: string
}

export interface Addon {
  note?: string
  title: string
  addon_id: number
  selected: boolean
  published: boolean
  currencies: Currency[]
  description: string
  addon_ecommerce_product_id: any
  addon_ecommerce_variant_id: any
  id: number
  net_price: NetPrice
}

export interface OrderDetailResponse {
  success: boolean
  result: Order
  message?: string
}
export type ContentGroup = {
  images: {
    url: string
    alt: string
    ext: string
  }[]
  design_id: string | null
  nickName: string | null
  addons: any[]
  skipReason: string | null
  message: string | null
  status: string | null
  reorder_message: string | null
  third_party_approval_obj: any
  quality_control: any
}

export type GetActivityContentReturn = {
  content_group: ContentGroup[]
  activity_status: string
  general_comments: string | null
}

export type ActivityItem = {
  activity_files: any[]
  factory_product_id: string
  skip_customer_approval: any
  message: string
  status: string
  third_party_approval_obj: any
  quality_control: any
}

export interface Comment {
  id: number
  order_item_activity_id: number
  parent_message_id: any
  parent_message: any
  message: string
  files: any[]
  comment_by_id: number
  comment_by: string
  created_at: string
  updated_at: string
  deleted_at: any
  show_popper: boolean
  show_actions?: boolean
  edit_comment: boolean
  reply_comment: boolean
  user: User
  children?: Comment[]
  timezone?: string
}

export interface CommentFormData {
  message?: string
  files?: File[]
  parent_message_id?: number
  parent_message?: string
  removed_files?: string[]
}

export interface CommentResponse {
  success: true
  message: string
  result: {
    item_activity_comment: Comment
  }
  errors: []
  status_code: number
}

export interface CommentFile {
  id?: number
  name: string
  url: string
  extension: string
  size?: number
}
