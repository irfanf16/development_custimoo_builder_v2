import { useLocaleStore } from '@/stores/locale/locale.store'
import { m as messages } from '@/paraglide/messages'
import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'
import { useProfileStore } from '@/stores/profile/profile.store'
import { storeToRefs } from 'pinia'

export function useProfileDialogState() {
  const localeStore = useLocaleStore()
  const profileStore = useProfileStore()
  const { activeTab } = storeToRefs(profileStore)

  const tabItems = [
    {
      label: messages.profile_account({}, { locale: localeStore.currentLocale }),
      value: 'account',
      icon: flexFlatCategoryIcons.UserIcon
    },
    {
      label: messages.profile_orders({}, { locale: localeStore.currentLocale }),
      value: 'orders',
      icon: flexFlatCategoryIcons.OrderIcon
    },
    {
      label: messages.profile_address_book({}, { locale: localeStore.currentLocale }),
      value: 'address',
      icon: flexFlatCategoryIcons.AddressIcon
    },
    {
      label: messages.profile_preferences({}, { locale: localeStore.currentLocale }),
      value: 'preferences',
      icon: flexFlatCategoryIcons.SettingsIcon
    }
  ]
  return { tab: activeTab, tabItems }
}
