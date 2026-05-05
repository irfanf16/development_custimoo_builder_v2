import { computed } from 'vue'
import { useCompanyStore } from '@/stores/company/company.store'
import { getCompanySettingValue } from '@/lib/companySettingsRead'

/**
 * `ai_logo_generation_enabled` from get-settings (`false` disables generator + refine/regenerate/shuffle).
 * Missing / unknown defaults to enabled for backwards compatibility.
 */
export function useAiLogoGenerationEnabled() {
  const companyStore = useCompanyStore()

  const isAiLogoGenerationEnabled = computed(() => {
    const raw = getCompanySettingValue(
      companyStore.settings?.settings as Record<string, unknown> | undefined,
      'ai_logo_generation_enabled'
    )
    if (raw === false) return false
    return true
  })

  return { isAiLogoGenerationEnabled }
}
