export type APIResponse<T> = {
  success: boolean
  content: T | null
  status?: number
}
