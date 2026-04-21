import type { CompanyLocalization } from '@/stores/company/company.store'
import type { OutputSettings } from '@/services/company/types'
import {
  applyCompanyUiBrandingTheme,
  clearCompanyUiBrandingTheme
} from '@/lib/companyUiBrandingTheme'
import { resolveWidgetBrandingRoot } from '@/lib/widgetUtils'
import type { useLocalStorage } from '@/composables/useLocalStorage'

/** Key for {@link useLocalStorage} (subpage suffix applied when configured). */
export const COMPANY_BRANDING_CACHE_KEY = 'company_branding_cache_v1'

export type CompanyBrandingSnapshot = {
  companyId: number | null
  settings: OutputSettings
  localization: CompanyLocalization
}

export function readCompanyBrandingSnapshot(
  storage: ReturnType<typeof useLocalStorage>
): CompanyBrandingSnapshot | null {
  try {
    return storage.getItem<CompanyBrandingSnapshot>(COMPANY_BRANDING_CACHE_KEY)
  } catch {
    return null
  }
}

export function writeCompanyBrandingSnapshot(
  storage: ReturnType<typeof useLocalStorage>,
  payload: CompanyBrandingSnapshot
): void {
  try {
    storage.setItem(COMPANY_BRANDING_CACHE_KEY, payload)
  } catch (e) {
    console.warn('[companyBrandingStorage] Failed to persist branding snapshot', e)
  }
}

export function removeCompanyBrandingSnapshot(
  storage: ReturnType<typeof useLocalStorage>
): void {
  try {
    storage.removeItem(COMPANY_BRANDING_CACHE_KEY)
  } catch {
    // ignore
  }
}

/** Drop cache and clear optimistic CSS when the signed-in company no longer matches the snapshot. */
export function invalidateBrandingSnapshotIfCompanyMismatch(
  storage: ReturnType<typeof useLocalStorage>,
  currentCompanyId: number | null
): void {
  const cached = readCompanyBrandingSnapshot(storage)
  if (!cached?.companyId || currentCompanyId == null) return
  if (cached.companyId !== currentCompanyId) {
    removeCompanyBrandingSnapshot(storage)
    const root = resolveWidgetBrandingRoot()
    if (root) clearCompanyUiBrandingTheme(root)
  }
}

export function applyBrandingSnapshotToWidgetRoot(
  storage: ReturnType<typeof useLocalStorage>,
  snapshot?: CompanyBrandingSnapshot | null
): void {
  const data = snapshot ?? readCompanyBrandingSnapshot(storage)
  const ui = data?.settings?.ui_branding
  if (!ui) return
  const root = resolveWidgetBrandingRoot()
  if (!root) return
  applyCompanyUiBrandingTheme(root, ui)
}
