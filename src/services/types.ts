import type { AxiosError } from 'axios'

export type APIResponseSuccess<T> = {
  success: true
  content: T
  status: number
  axiosError: null
  message?: string
}

export type APIResponseError<T = unknown> = {
  success: false
  content: null
  status: number
  axiosError: AxiosError<T> | null
  message?: string
}

export type APIResponse<T> = APIResponseSuccess<T> | APIResponseError<T>

export * from './types/logo-placement'
export * from './types/styles'
