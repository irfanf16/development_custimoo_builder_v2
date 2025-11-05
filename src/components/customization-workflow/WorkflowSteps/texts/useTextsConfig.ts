import { computed, ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { OutputProductText } from '../../../../services/products/types'

// ===== SHARED STATE =====
// These refs are shared across all component instances
const currentTextEditRef = ref<OutputProductText | null>(null)
const onSaveChanges = ref<() => void>(() => {
  console.log('onSaveChanges')
})
const onCancel = ref<() => void>(() => {
  console.log('onCancel')
})

export function useTextsConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => {
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
    return { breadcrumbs: [{ label: 'Texts' }] }
  })

  const footerConfig = computed<FooterConfiguration>(() => {
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
    // State
    currentTextEditRef,
    onSaveChanges,
    onCancel,
    // Computed
    headerConfig,
    footerConfig
  }
}
