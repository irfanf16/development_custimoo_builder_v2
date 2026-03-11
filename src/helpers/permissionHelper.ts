import { useCompanyStore } from '@/stores/company/company.store'

const PERMISSION_COMPANY_MAPPING: Record<string, number[]> = {
  show_admin_salerep: [1, 31]
}

export function hasCompanyPermission(permission: string): boolean {
  const companyStore = useCompanyStore()
  const company = companyStore.company

  if (!company || typeof company.id === 'undefined') {
    return false
  }

  const allowedIds = PERMISSION_COMPANY_MAPPING[permission]

  if (!allowedIds) {
    return false
  }

  return allowedIds.includes(company.id)
}
