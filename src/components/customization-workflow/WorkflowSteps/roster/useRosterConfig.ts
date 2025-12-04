import { computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration } from '../../types'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import { useProfileStore } from '@/stores/profile/profile.store'
import {
  breadcrumbs_edit,
  nav_roster,
  roster_reset_action,
  roster_template_button,
  roster_reset_action_tooltip
} from '@/paraglide/messages'
import { useRoster } from './useRoster'
import { Download, Info } from 'lucide-vue-next'

export function useRosterConfig() {
  const workflowStore = useWorkflowStore()
  const profileStore = useProfileStore()
  const { resetRoster, hasEntries, downloadTemplate } = useRoster()

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

    return {
      breadcrumbs,
      actionButton
    }
  })

  const footerConfig = computed<FooterConfiguration>(() => {
    return { buttons: [] }
  })

  return {
    headerConfig,
    footerConfig
  }
}
