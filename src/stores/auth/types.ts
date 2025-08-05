export interface User {
  id: number
  ecommerce_customer_id: number
  first_name: string
  last_name: string
  company_id: number
  email: string
  team_company_name: string
  browser_key: string
  country_id: number
  password_updated: number
  jwt_token: string
  role_id: number
  admin_salesrep_id: number
  created_at: string
  updated_at: string
  deleted_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
}
