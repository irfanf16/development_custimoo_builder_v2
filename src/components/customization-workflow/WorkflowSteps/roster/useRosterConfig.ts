import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'

export function useRosterConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
    const trail: { label: string; action?: () => void }[] = [{ label: 'Roster' }]
    if (workflowStore.rosterSubStep === 'edit') {
      trail.push({ label: 'Edit' })
    }
    return { breadcrumbs: trail }
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
