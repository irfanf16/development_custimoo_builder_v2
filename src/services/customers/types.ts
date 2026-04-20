import type { Customer } from '../authentication/types'

export interface Country {
  id: number
  name: string
}

export interface Address {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone_number?: string
  company_name?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip_code?: string
  country: Country
  default: boolean | number
}

export interface AddressResponse {
  success: boolean
  result: Address[]
  message?: string
}

export interface CustomerResponse {
  success: boolean
  result: Customer
  message?: string
}

/** Request presigned S3 upload URL for custom design SVG */
export interface CustomDesignPresignedUploadRequest {
  name: string
  extension: string
  content_type: string
  expiration_minutes: string
}

/** Register custom design after S3 upload */
export interface RegisterCustomDesignRequest {
  product_id: number
  product_style_id: number
  svg_parts: string[]
  design_name: string
  /** Storage path returned from presigned step (e.g. company_1/files/custom_design/267/production.svg) */
  file_url: string
  /** From current active design (`OutputDesignDetails.productionsafezone_design_id`) */
  productionsafezone_design_id: number | null
}

export interface AddressPayload {
  id?: number | string
  first_name: string
  last_name: string
  email?: string
  phone_number?: string
  company_name?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip_code?: string
  country: number
  default?: boolean
}
