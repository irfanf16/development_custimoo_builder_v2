import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { buildLogoBreadcrumbs } from '@/components/customization-workflow/breadcrumbs'

export function useLogoConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    const breadcrumbs = buildLogoBreadcrumbs({
      logosSubStep: workflowStore.logosSubStep,
      hasActiveLogo: !!workflowStore.activeLogoId,
      onBackToList: () => workflowStore.setLogosSubStep('list')
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
