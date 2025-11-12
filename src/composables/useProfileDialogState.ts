import { m as messages } from '@/paraglide/messages'
import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'
import { useProfileStore } from '@/stores/profile/profile.store'
import { useAuthStore } from '@/stores/auth/auth.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

export function useProfileDialogState() {
  const profileStore = useProfileStore()
  const authStore = useAuthStore()
  const { activeTab, currentLocale } = storeToRefs(profileStore)
  const { isAuthenticated: isLoggedIn } = storeToRefs(authStore)

  const tabItems = computed(() => {
    const allTabs = [
      {
        label: messages.profile_account({}, { locale: currentLocale.value }),
        value: 'account',
        icon: flexFlatCategoryIcons.UserIcon
      },
      {
        label: messages.profile_orders({}, { locale: currentLocale.value }),
        value: 'orders',
        icon: flexFlatCategoryIcons.OrderIcon
      },
      {
        label: messages.profile_address_book({}, { locale: currentLocale.value }),
        value: 'address',
        icon: flexFlatCategoryIcons.AddressIcon
      },
      {
        label: messages.profile_preferences({}, { locale: currentLocale.value }),
        value: 'preferences',
        icon: flexFlatCategoryIcons.SettingsIcon
      }
    ]

    if (isLoggedIn.value) {
      return allTabs
    }

    return allTabs.filter(tab => tab.value === 'preferences')
  })
  return { tab: activeTab, tabItems }
}
