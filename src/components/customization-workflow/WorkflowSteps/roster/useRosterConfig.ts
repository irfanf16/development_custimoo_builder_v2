import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import {
  breadcrumbs_edit,
  nav_roster,
  roster_reset_action,
  roster_template_button,
  roster_reset_action_tooltip,
  roster_description,
  roster_add_player
} from '@/paraglide/messages'
import { useRoster } from './useRoster'
import { Download, Info, Plus } from 'lucide-vue-next'

export function useRosterConfig() {
  const workflowStore = useWorkflowStore()
  const profileStore = useProfileStore()
  const { resetRoster, hasEntries, downloadTemplate, addEmptyRow } = useRoster()

  const headerConfig = computed<HeaderConfiguration>(() => {
    const breadcrumbs = [
      {
        label: nav_roster({}, { locale: profileStore.currentLocale }),
        action: () =>
          workflowStore.rosterSubStep === 'edit'
            ? workflowStore.setRosterSubStep('list')
            : undefined
      },
      ...(workflowStore.rosterSubStep === 'edit'
        ? [{ label: breadcrumbs_edit({}, { locale: profileStore.currentLocale }) }]
        : [])
    ]

    let actionButton: HeaderConfiguration['actionButton']
    if (workflowStore.rosterSubStep === 'list') {
      actionButton = {
        label: roster_template_button({}, { locale: profileStore.currentLocale }),
        icon: Download,
        callback: downloadTemplate
      }
    } else if (hasEntries.value) {
      actionButton = {
        label: roster_reset_action({}, { locale: profileStore.currentLocale }),
        icon: Info,
        callback: resetRoster,
        tooltip: (
          roster_reset_action_tooltip as (
            inputs?: Record<string, never>,
            options?: { locale?: string }
          ) => string
        )({}, { locale: profileStore.currentLocale })
      }
    }

    const helpText: HeaderConfiguration['helpText'] = {
      label: roster_description({}, { locale: profileStore.currentLocale })
    }

    return {
      breadcrumbs,
      actionButton,
      helpText
    }
  })

  const footerConfig = computed<FooterConfiguration>(() => {
    return {
      buttons:
        workflowStore.rosterSubStep === 'list'
          ? []
          : [
              {
                label: roster_add_player({}, { locale: profileStore.currentLocale }),
                variant: 'default',
                icon: Plus,
                onClick: () => addEmptyRow()
              }
            ]
    }
  })

  return {
    headerConfig,
    footerConfig
  }
}
