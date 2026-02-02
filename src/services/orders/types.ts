import type { Customer } from '../authentication/types'
import type { APCustomizationRosterEntry } from '../products/types/customization'

export interface CancelOrderResponse {
  success: boolean
  message?: string
}
export interface FactoryProduct {
  id: string
  product_id?: string | number
  product_name?: string
  is_custom_product?: boolean
  front_image?: string
  back_image?: string
  custom_product_placeholder?: string
  product_roster_detail?: APCustomizationRosterEntry[]
  prices?: { total_quantity?: number }
  roster_quantity?: number
  can_reorder?: boolean
  design_id?: string
  style_id?: string | number
  reorder_data?: Record<string, unknown>
  is_possible_reorder?: boolean
  design_nick_name?: string
  addons?: Addon[]
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
  tracking_no?: string
  tracking_link?: string
}

export interface StatusActivity {
  id: number
  order_item_id: number
  message: string
  activity_items: ActivityItem[]
  status: string
  action_log?: ActionLog
  action_by_id: number
  action_by: string
  created_at: string
  updated_at: string
  deleted_at: string
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
  pricelist_id: number
  provider_id: string
  vat_no: string
  company_domains: string[]
  subpage_url: string
  admin_domains: string[]
  login_code: string
  customizer_page_url: string
  address: string
  city: string
  phone: string
  post_code: string
  country_id: number
  contact_person_name: string
  contact_person_email: string
  platform: string
  inactive_message: string
  status: number
  pending_payment: number
  override_due_payment: number
  enable_accessibe: number
  customers: Customer[]
  products: FactoryProduct[]
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
  price: number
  net_price: number
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
  company_id: number
  name: string
  first_name: string
  last_name: string
  email: string
  email_verified_at: string
  roles: Role[]
  userroles: Role[]
  company: Company
  is_default: number
}

export interface Order {
  id: number | string
  company_id: number
  company_name: string
  order_no?: string
  customer: User
  customer_reference_no?: string
  created_at?: string
  items?: Item[]
  general_comments?: string | null
  quote_text?: string | null
  design_file?: string | null
  is_quote_order?: boolean
  additional_fields: {
    is_manual_order: boolean
    po_number?: string
  }
}

export interface Currency {
  code: string
  name: string
  price: number
  symbol: string
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
  addon_ecommerce_product_id: number
  addon_ecommerce_variant_id: number
  id: number
  net_price: NetPrice
}

export interface ThirdPartyApprovalObj {
  factory_product_id: string
  approval_status: string
  feedback?: string
}

export interface OrderDetailResponse {
  success: boolean
  result: Order
  message?: string
}

export interface QualityControl {
  reports: QCReport[]
  qa_status: boolean
}

export interface QCReport {
  status: 'Rejected' | 'Approved'
  pdf_url: string
  pdf_name: string
  created_at: string
}

export type ContentGroup = {
  images: {
    url: string
    alt: string
    ext: string
  }[]
  design_id: string | null
  nickName: string | null
  addons: Addon[]
  skipReason: string | null
  skip_customer_approval?: SkipCustomerApproval | null
  message: string | null
  status: string | null
  reorder_message: string | null
  third_party_approval_obj: ThirdPartyApprovalObj | null
  quality_control: QualityControl
}

export type GetActivityContentReturn = {
  content_group: ContentGroup[]
  activity_status: string
  general_comments: string | null
}

export interface ActivityFile {
  url: string
  name: string
  extension: string
}

export type ActivityItem = {
  activity_files: ActivityFile[]
  factory_product_id: string
  skip_customer_approval: SkipCustomerApproval
  message: string
  status: string
  third_party_approval_obj: ThirdPartyApprovalObj | null
  quality_control: QualityControl
}

export interface Comment {
  id: number
  order_item_activity_id: number
  parent_message_id: number
  parent_message: string
  message: string
  files: CommentFile[]
  comment_by_id: number
  comment_by: string
  created_at: string
  updated_at: string
  deleted_at: string
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

export interface SkipCustomerApproval {
  design_customer_approval: boolean | string | number | null
  reason?: string
  show_reason_modal: boolean
  username: string
  user_id: number
  role_name: string
}
