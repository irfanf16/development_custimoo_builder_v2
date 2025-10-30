import { useLocaleStore } from '@/stores/locale/locale.store'
import { ref } from 'vue'
import { m as messages } from '@/paraglide/messages'
import { flexFlatCategoryIcons } from '@/icons/flex-flat-categories'
export function useProfileDialogState() {
  const localeStore = useLocaleStore()
  const tab = ref('account')

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
  return { tab, tabItems }
}
