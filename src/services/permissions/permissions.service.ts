import http from '../api'
import type { PermissionResponse } from './types'
import type { AxiosResponse } from 'axios'

/**
 * Get customer permissions (GET /api/v2/customer/permissions)
 */
async function getPermissions(): Promise<AxiosResponse<PermissionResponse>> {
  return await http.get<PermissionResponse>('customer/permissions')
}

export default {
  getPermissions
}
