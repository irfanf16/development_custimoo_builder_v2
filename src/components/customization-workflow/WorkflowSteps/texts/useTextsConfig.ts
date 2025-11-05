import { computed, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { onSaveChanges, onCancel } from './useTextActions'

export function useTextsConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()

  // ===== COMPUTED =====
  const headerConfig: Ref<HeaderConfiguration> = computed(() => {
    if (workflowStore.textsSubStep === 'number-font') {
      const label = String(workflowStore.pendingNumberPreset || '1')
      return {
        breadcrumbs: [
          { label: 'Texts', action: () => workflowStore.setTextsSubStep('list') },
          { label }
        ]
      }
    }
    if (workflowStore.textsSubStep === 'edit') {
      const label =
        workflowStore.activeTextIndex != null
          ? (workflowStore.activeTextIndex + 1).toString()
          : 'Edit'
      return {
        breadcrumbs: [
          { label: 'Texts', action: () => workflowStore.setTextsSubStep('list') },
          { label }
        ]
      }
    }
    if (workflowStore.textsSubStep === 'placement') {
      return {
        breadcrumbs: [
          { label: 'Texts', action: () => workflowStore.setTextsSubStep('list') },
          { label: 'Placement' }
        ]
      }
    }
    return { breadcrumbs: [{ label: 'Texts' }] }
  })

  const footerConfig: Ref<FooterConfiguration> = computed(() => {
    if (workflowStore.textsSubStep === 'edit' || workflowStore.textsSubStep === 'number-font') {
      return {
        buttons: [
          {
            label: 'Cancel',
            variant: 'default',
            onClick: onCancel.value
          },
          { label: 'Save', variant: 'primary', disabled: false, onClick: onSaveChanges.value }
        ]
      }
    }
    return { buttons: [] }
  })

  // ===== RETURN =====
  return {
    headerConfig,
    footerConfig
  }
}
