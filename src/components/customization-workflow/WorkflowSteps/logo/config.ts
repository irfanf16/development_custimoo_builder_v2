import { computed, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'

const workflowStore = useWorkflowStore()
export const logoHeaderConfig: Ref<HeaderConfiguration> = computed(() => {
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

export const logoFooterConfig: FooterConfiguration = { buttons: [] }

export function createFooterConfig(): FooterConfiguration {
  return { buttons: [] }
}
