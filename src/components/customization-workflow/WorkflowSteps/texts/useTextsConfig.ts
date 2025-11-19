import { computed, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useCustomizationStore } from '@/stores/customization/customization.store'
import { buildTextsBreadcrumbs } from '@/components/customization-workflow/breadcrumbs'
import { useProfileStore } from '@/stores/profile/profile.store'
import { texts_help_insert_style } from '@/paraglide/messages'

export function useTextsConfig() {
  // ===== DEPENDENCIES =====
  const workflowStore = useWorkflowStore()
  const customizationStore = useCustomizationStore()
  const profileStore = useProfileStore()

  // ===== COMPUTED =====
  const headerConfig: Ref<HeaderConfiguration> = computed(() => {
    const activeText =
      workflowStore.activeTextId != null
        ? customizationStore.activeProductTexts.find(text => text.id === workflowStore.activeTextId)
        : null

    const breadcrumbs = buildTextsBreadcrumbs({
      textsSubStep: workflowStore.textsSubStep,
      activeTextMeta: activeText ? { value: activeText.value, label: activeText.label } : undefined,
      onBackToList: () => workflowStore.setTextsSubStep('list'),
      locale: profileStore.currentLocale
    })

    if (workflowStore.textsSubStep === 'list') {
      return {
        breadcrumbs,
        helpText: {
          label: texts_help_insert_style({}, { locale: profileStore.currentLocale })
        }
      }
    }

    return {
      breadcrumbs
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
