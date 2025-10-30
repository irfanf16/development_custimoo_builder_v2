import { computed, ref, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'

const workflowStore = useWorkflowStore()
export const textsHeaderConfig: Ref<HeaderConfiguration> = computed(() => {
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

export const textsFooterConfig: FooterConfiguration = { buttons: [] }
// Footer for texts will be constructed in WorkflowLayout where the current step ref is available

export function createFooterConfig() {
  return { buttons: [] }
}

export const onSaveChanges = ref<() => void>(() => {
  console.log('onSaveChanges')
})
export const onCancel = ref<() => void>(() => {
  console.log('onCancel')
})

export function getTextsFooterConfig(): FooterConfiguration {
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
  return textsFooterConfig
}
