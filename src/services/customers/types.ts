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
