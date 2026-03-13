export type Customer = {
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
  company: {
    address: string
    phone: string
    post_code: string
    city: string
  }
}

export type OutputForgotPassword = {
  message: string
}

export type InputForgotPassword = {
  email_address: string
}

export type OutputLogin =
  | {
      user: Customer
      access_token: string
      refresh_token?: string
      errors?: undefined
    }
  | {
      errors: Partial<Record<keyof InputLogin, string[]>>
      user?: undefined
      access_token?: undefined
      refresh_token?: undefined
    }

export type InputLogin = {
  email: string
  password: string
}

export type InputSignup = {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  company_name: string
  country: { id: number; label: string }
  admin_salesrep_id?: number
}

export type OutputSignup =
  | {
      message: string
      errors: Partial<Record<keyof InputSignup, string[]>>
      user?: undefined
      access_token?: undefined
    }
  | {
      message: string
      user: Customer
      access_token: string
      errors?: undefined
    }

export type SalesReps = {
  id: number
  email: string
  name: string
}
export type InputResetPassword = {
  email_address: string
  password: string
  confirm_password: string
  token: string
}

export type OutputResetPassword = {
  message: string
  result: any[]
  errors: any[]
}
