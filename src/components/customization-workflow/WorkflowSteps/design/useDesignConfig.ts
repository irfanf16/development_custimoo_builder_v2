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
const selectedDesigns = ref<number[]>([])

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

  const hasSelectedDesigns = computed<boolean>(() => {
    return selectedDesigns.value.length > 0
  })

  const toggleDesignSelection = (designId: number) => {
    if (selectedDesigns.value.includes(designId)) {
      selectedDesigns.value = selectedDesigns.value.filter(id => id !== designId)
    } else {
      selectedDesigns.value.push(designId)
    }
  }

  const footerConfig = computed<FooterConfiguration>(() => {
    if (hasSelectedDesigns.value) {
      return {
        buttons: [
          {
            label: 'Deselect all',
            variant: 'secondary',
            onClick: () => {
              selectedDesigns.value = []
            }
          },
          {
            label: 'Add to locker',
            variant: 'primary',
            onClick: () => {
              console.log('add to locker: ', selectedDesigns.value)
            }
          }
        ]
      }
    }
    return { buttons: [] }
  })

  // ===== RETURN =====
  return {
    // State
    designSearchModel,
    applyCustomizationOverrides,
    designCategoriesConfig,
    selectedDesigns,
    toggleDesignSelection,
    // Computed
    headerConfig,
    footerConfig
  }
}
