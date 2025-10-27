import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { HeaderConfiguration } from '@/components/customization-workflow/types'

type BreadcrumbItem = { label: string; action?: () => void }

export interface useWorkflowHeaderConfigOptions {
  breadcrumbs?: BreadcrumbItem[]
  search?: {
    placeholder: string
    model: Ref<string>
    onInput: (val: string) => void
  }
  applyOverrides?: {
    model: Ref<boolean>
    onInput: (val: boolean) => void
    label: string
  }
  actionButton?: {
    label: string
    tooltip?: string
    callback: () => void
  }
  isExpandable?: boolean
}

/**
 * Composable for managing header configuration in workflow step components.
 * Replaces the need for defineExpose in each component.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useWorkflowHeaderConfig } from '@/composables/useWorkflowHeaderConfig'
 *
 * const searchModel = ref('')
 * const applyOverrides = ref(false)
 *
 * useWorkflowHeaderConfig({
 *   search: {
 *     placeholder: 'Search designs...',
 *     model: searchModel,
 *     onInput: (val) => searchModel.value = val
 *   },
 *   applyOverrides: {
 *     model: applyOverrides,
 *     onInput: (val) => applyOverrides.value = val,
 *     label: 'Preview with customization'
 *   },
 *   isExpandable: true,
 *   breadcrumbs: [{ label: 'Designs' }]
 * })
 * </script>
 * ```
 */
export function useWorkflowHeaderConfig(
  config: useWorkflowHeaderConfigOptions | (() => useWorkflowHeaderConfigOptions)
): void {
  const workflowStore = useWorkflowStore()
  const { setCurrentHeaderConfig, clearHeaderConfig } = workflowStore

  const getConfig = (): HeaderConfiguration & {
    _refs: { search?: Ref<string>; applyOverrides?: Ref<boolean> }
  } => {
    const rawConfig = typeof config === 'function' ? config() : config

    const headerConfig: HeaderConfiguration = {
      breadcrumbs: rawConfig.breadcrumbs,
      search: rawConfig.search
        ? {
            placeholder: rawConfig.search.placeholder,
            onInput: rawConfig.search.onInput
          }
        : undefined,
      applyOverrides: rawConfig.applyOverrides
        ? {
            onInput: rawConfig.applyOverrides.onInput,
            label: rawConfig.applyOverrides.label
          }
        : undefined,
      actionButton: rawConfig.actionButton,
      isExpandable: rawConfig.isExpandable
    }

    // Store refs for accessing current values
    const refs = {
      search: rawConfig.search?.model,
      applyOverrides: rawConfig.applyOverrides?.model
    }

    return { ...headerConfig, _refs: refs }
  }

  // Register on mount
  onMounted(() => {
    const configValue = getConfig()
    setCurrentHeaderConfig(configValue)
  })

  // Clean up on unmount
  onBeforeUnmount(() => {
    clearHeaderConfig()
  })
}
