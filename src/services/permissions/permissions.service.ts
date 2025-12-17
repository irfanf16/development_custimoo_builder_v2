import http from '../api'
import type { PermissionResponse } from './types'
import type { AxiosResponse } from 'axios'

async function getPermissions(): Promise<AxiosResponse<PermissionResponse>> {
  return await http.get<PermissionResponse>(`permissions`)
}

export default {
  getPermissions
}
