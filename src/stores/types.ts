import type { AxiosError } from 'axios'

export type APIResponseSuccess<T> = {
  success: true
  content: T
  status: number
  axiosError: null
}

export type APIResponseError<T = any> = {
  success: false
  content: null
  status: number
  axiosError: AxiosError<T> | null
}

export type APIResponse<T> = APIResponseSuccess<T> | APIResponseError<T>
