import { ref, computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration, DesignCategoriesConfig } from '../../types'

// ===== SHARED STATE =====
// These refs are shared across all component instances
const designSearchModel = ref('')
const applyCustomizationOverrides = ref(false)
const designCategoriesConfig = ref<DesignCategoriesConfig | undefined>(undefined)

export function useDesignConfig() {
  // ===== UTILITIES =====
  function onDesignSearchInput(val: string) {
    console.log('onDesignSearchInput', val)
    designSearchModel.value = val
  }

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => ({
    search: {
      placeholder: 'Search designs...',
      onInput: onDesignSearchInput
    },
    applyOverrides: {
      value: applyCustomizationOverrides.value,
      onInput: (val: boolean) => (applyCustomizationOverrides.value = val),
      label: 'Preview with customization'
    },
    designCategories: designCategoriesConfig.value,
    isExpandable: true,
    breadcrumbs: [{ label: 'Designs' }]
  }))

  const footerConfig = computed<FooterConfiguration>(() => {
    return { buttons: [] }
  })

  // ===== RETURN =====
  return {
    // State
    designSearchModel,
    applyCustomizationOverrides,
    designCategoriesConfig,
    // Computed
    headerConfig,
    footerConfig
  }
}
