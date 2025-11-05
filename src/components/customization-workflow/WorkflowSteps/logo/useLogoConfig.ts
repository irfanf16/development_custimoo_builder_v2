import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'

export function useLogoConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    if (workflowStore.logosSubStep === 'edit' && workflowStore.activeLogoId) {
      return {
        breadcrumbs: [
          { label: 'Logos', action: () => workflowStore.setLogosSubStep('list') },
          { label: 'Controls' }
        ]
      }
    }
    if (workflowStore.logosSubStep === 'placement') {
      return {
        breadcrumbs: [
          { label: 'Logos', action: () => workflowStore.setLogosSubStep('list') },
          { label: 'Placement' }
        ]
      }
    }
    return { breadcrumbs: [{ label: 'Logos' }] }
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
