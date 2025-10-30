import { computed, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'

const workflowStore = useWorkflowStore()

export const rosterHeaderConfig: Ref<HeaderConfiguration> = computed(() => {
  const trail: { label: string; action?: () => void }[] = [{ label: 'Roster' }]
  if (workflowStore.rosterSubStep === 'edit') {
    trail.push({ label: 'Edit' })
  }
  return { breadcrumbs: trail }
})

export const rosterFooterConfig: FooterConfiguration = { buttons: [] }
