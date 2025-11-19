import { ref, computed } from 'vue'
import type { HeaderConfiguration, FooterConfiguration, DesignCategoriesConfig } from '../../types'
import { buildDesignBreadcrumbs } from '@/components/customization-workflow/breadcrumbs'
import { useProfileStore } from '@/stores/profile/profile.store'
import { design_search_placeholder, design_apply_overrides_label } from '@/paraglide/messages'

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

  // ===== DEPENDENCIES =====
  const profileStore = useProfileStore()

  // ===== COMPUTED =====
  const headerConfig = computed<HeaderConfiguration>(() => ({
    search: {
      placeholder: design_search_placeholder({}, { locale: profileStore.currentLocale }),
      onInput: onDesignSearchInput
    },
    applyOverrides: {
      value: applyCustomizationOverrides.value,
      onInput: (val: boolean) => (applyCustomizationOverrides.value = val),
      label: design_apply_overrides_label({}, { locale: profileStore.currentLocale })
    },
    designCategories: designCategoriesConfig.value,
    isExpandable: true,
    breadcrumbs: buildDesignBreadcrumbs(profileStore.currentLocale)
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
