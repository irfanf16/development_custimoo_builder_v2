import { computed, ref, type Ref } from 'vue'
import type { HeaderConfiguration, FooterConfiguration, DesignCategoriesConfig } from '../../types'

export const designSearchModel = ref('')
export const applyCustomizationOverrides = ref(false)
export const designCategoriesConfig = ref<DesignCategoriesConfig | undefined>(undefined)

function onDesignSearchInput(val: string) {
  console.log('onDesignSearchInput', val)
  designSearchModel.value = val
}
export const designHeaderConfig: Ref<HeaderConfiguration> = computed(() => ({
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

// Footer is optional; export a creator if needed later
export const designFooterConfig: FooterConfiguration = { buttons: [] }
