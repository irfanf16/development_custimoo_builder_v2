import { computed, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'

export function useTextsConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()

  // ===== COMPUTED =====
  const headerConfig: Ref<HeaderConfiguration> = computed(() => {
    if (workflowStore.textsSubStep === 'number-font') {
      let label = 'Number'
      if (workflowStore.activeTextId != null) {
        const entry = customizationStore.activeProductTexts.find(
          text => text.id === workflowStore.activeTextId
        )
        if (entry?.value) {
          label = entry.value
        }
      }
      return {
        breadcrumbs: [
          { label: 'Texts', action: () => workflowStore.setTextsSubStep('list') },
          { label }
        ]
      }
    }
    if (workflowStore.textsSubStep === 'edit') {
      let label = 'Edit'
      if (workflowStore.activeTextId != null) {
        const entry = customizationStore.activeProductTexts.find(
          e => e.id === workflowStore.activeTextId
        )
        if (entry) {
          label = entry.value || entry.label || 'Edit'
        }
      }
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
    return {
      breadcrumbs: [{ label: 'Texts' }],
      helpText: { label: 'Insert and style text.' }
    }
  })

  const footerConfig: Ref<FooterConfiguration> = computed(() => {
    return { buttons: [] }
  })

  // ===== RETURN =====
  return {
    headerConfig,
    footerConfig
  }
}
