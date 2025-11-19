import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { buildLogoBreadcrumbs } from '@/components/customization-workflow/breadcrumbs'
import { useProfileStore } from '@/stores/profile/profile.store'

export function useLogoConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()
  const profileStore = useProfileStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    const breadcrumbs = buildLogoBreadcrumbs({
      logosSubStep: workflowStore.logosSubStep,
      hasActiveLogo: !!workflowStore.activeLogoId,
      onBackToList: () => workflowStore.setLogosSubStep('list'),
      locale: profileStore.currentLocale
    })

    if (workflowStore.logosSubStep === 'edit' && workflowStore.activeLogoId) {
      return {
        breadcrumbs,
        helpText: { label: 'Add and adjust logos or graphics.' }
      }
    }

    return { breadcrumbs }
  })

  const footerConfig = computed<FooterConfiguration>(() => {
    return { buttons: [] }
  })

  // ===== RETURN =====
  return {
    // Computed
    headerConfig,
    footerConfig
  }
}
