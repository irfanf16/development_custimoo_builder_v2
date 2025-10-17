import type { AxiosError, AxiosResponse } from 'axios'
import type { APIResponse } from '@/services/types'

export async function tryCatchApi<T>(promise: Promise<AxiosResponse<T>>): Promise<APIResponse<T>> {
  try {
    const { status, data } = await promise
    if (status === 200 || status === 201) {
      return { success: true, content: data, status: 200, axiosError: null }
    }
  } catch (error) {
    const _error = error as AxiosError<T>
    return {
      success: false,
      content: null,
      status: _error.response?.status || 0,
      axiosError: _error
    }
  }
  return { success: false, content: null, status: 400, axiosError: null }
}
