export type Permissions = {
  permissions: string[]
}

export type PermissionResponse = {
  success: true
  message: string
  result: Permissions
  errors: []
  status_code: number
}
