import { onMounted, onBeforeUnmount } from 'vue'
import { useWorkflowStore } from '@/stores/workflow/workflow.store'
import type { HeaderConfiguration } from '@/components/customization-workflow/types'

export type UseHeaderConfigOptions = HeaderConfiguration

/**
 * Composable for managing header configuration in workflow step components.
 * Replaces the need for defineExpose in each component.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useHeaderConfig } from '@/composables/useHeaderConfig'
 *
 * const searchModel = ref('')
 * const applyOverrides = ref(false)
 *
 * useHeaderConfig({
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
 *   breadcrumbs: computed(() => [{ label: 'Designs' }])
 * })
 * </script>
 * ```
 */
export function useHeaderConfig(
  config: UseHeaderConfigOptions | (() => UseHeaderConfigOptions)
): void {
  const workflowStore = useWorkflowStore()
  const { setCurrentHeaderConfig, clearHeaderConfig } = workflowStore

  const getConfig = (): HeaderConfiguration => {
    if (typeof config === 'function') {
      return config()
    }
    return config
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
