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

    // Only show item label in breadcrumb when on 'single' (editing one item). On 'multipleitems' we show only Texts > Entry.
    const activeItemLabel =
      workflowStore.textsSubStep === 'single' &&
      activeText?.items?.length &&
      activeText.items.length > 1
        ? (() => {
            const idx = activeText.active_item_index ?? 0
            const item = activeText.items[idx]
            const label = item && 'label' in item && item.label ? item.label : null
            if (label?.trim()) return label
            return `Placement ${idx + 1}`
          })()
        : null

    const hasMultipleItems = (activeText?.items?.length ?? 0) > 1

    const breadcrumbs = buildTextsBreadcrumbs({
      textsSubStep: workflowStore.textsSubStep,
      activeTextMeta: activeText ? { value: activeText.value, label: activeText.label } : undefined,
      activeItemLabel: activeItemLabel ?? null,
      onBackToList: () => workflowStore.setTextsSubStep('list'),
      onBackToMultipleItems: hasMultipleItems
        ? () => workflowStore.setTextsSubStep('multipleitems')
        : undefined,
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
