<script setup lang="ts">
  import Dialog from '@/components/ui/dialog/Dialog.vue'
  import DialogContent from '@/components/ui/dialog/DialogContent.vue'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import { useProfileDialogState } from '@/composables/useProfileDialogState'
  import AccountTab from './account-section/AccountTab.vue'
  import OrdersTab from './orders-section/OrdersTab.vue'
  import AddressTab from './address-section/AddressTab.vue'
  import { ref, watch, computed, nextTick } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { storeToRefs } from 'pinia'
  import Spinner from '../ui/spinner/Spinner.vue'
  import PreferencesTab from './preferences-section/PreferencesTab.vue'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useOrdersStore } from '@/stores/orders/orders.store'
  import { Button } from '@/components/ui/button'
  import { ArrowLeft } from 'lucide-vue-next'
  import { m as messages } from '@/paraglide/messages'
  import {
    DialogTitle,
    DialogDescription,
    DialogHeader,
    Dialog as DialogRoot,
    DialogContent as DialogContentInner
  } from '@/components/ui/dialog'
  import { useSignIn } from '@/composables/useSignIn'
  import AddressForm from './address-section/AddressForm.vue'
  import { m as profileMessages } from '@/paraglide/messages'

  const props = defineProps<{
    open: boolean
    initialTab?: 'account' | 'orders' | 'address' | 'preferences'
    initialOrderId?: string | number
    /** When opening with initialOrderId: 'details' = OrderDetailsView; 'timeline' = order timeline (default). */
    initialOrderPresentation?: 'details' | 'timeline'
    showSelectAddressButton?: boolean
  }>()
  const emit = defineEmits<{
    'update:open': [value: boolean]
    selectAddress: [address: import('@/services/customers/types').Address]
  }>()

  const { tab, tabItems } = useProfileDialogState()
  const profileStore = useProfileStore()
  const ordersStore = useOrdersStore()
  const { counters } = storeToRefs(profileStore)
  const { handleLogout } = useSignIn()
  const uiStore = useUIStore()

  // Mobile state: true = showing tab list, false = showing content
  const showMobileTabList = ref(true)

  // Computed classes for dialog sizing
  // const dialogClasses = computed(() => {
  //   if (uiStore.isMobile) {
  //     // Mobile: fixed to top, rounded top corners, leave space at top
  //     // Override default grid layout and centering - use flex instead of grid
  //     // Completely override default centering (left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2)
  //     // Use explicit overrides with !important to force removal of default centering
  //     return 'fixed w-full max-w-full max-h-[calc(100dvh-5rem)] h-[calc(100dvh-5rem)] bottom-0 left-0 right-0 inset-x-0 -translate-x-0 translate-y-0 transform-none rounded-t-2xl rounded-b-none p-0 overflow-hidden flex flex-col grid-cols-none top-auto'
  //   }
  //   return 'w-[1192px] h-[760px] max-w-full p-0 overflow-hidden flex flex-col'
  // })

  // Get current tab label for mobile header
  const currentTabLabel = computed(() => {
    const currentTab = tabItems.value.find(item => item.value === tab.value)
    return currentTab?.label || ''
  })

  // My profile label for mobile
  const myProfileLabel = computed(() =>
    messages.profile_my_profile({}, { locale: profileStore.currentLocale })
  )

  // Watch tab changes and persist them
  watch(
    () => tab.value,
    newTab => {
      profileStore.activeTab = newTab as 'account' | 'orders' | 'address' | 'preferences'
      profileStore.saveToLocalStorage()
      // On mobile, switch to content view when tab changes
      if (uiStore.isMobile) {
        showMobileTabList.value = false
      }
    }
  )

  function handleSignOut() {
    emit('update:open', false)
    handleLogout({
      clearAllStorage: true,
      resetProfileStore: true
    })
  }

  function handleMobileTabClick(tabValue: 'account' | 'orders' | 'address' | 'preferences') {
    // Always navigate to content view, even if clicking the same tab
    showMobileTabList.value = false
    tab.value = tabValue
  }

  function handleMobileBackClick() {
    showMobileTabList.value = true
  }

  function handleAddressSelect(address: import('@/services/customers/types').Address) {
    emit('selectAddress', address)
    emit('update:open', false)
  }

  const addressModalT = computed(() => ({
    editAddress: profileMessages.profile_edit_address({}, { locale: profileStore.currentLocale }),
    addNewAddress: profileMessages.profile_add_new_address(
      {},
      { locale: profileStore.currentLocale }
    ),
    confirmDelete: profileMessages.profile_confirm_delete(
      {},
      { locale: profileStore.currentLocale }
    ),
    confirmDeleteMessage: profileMessages.profile_confirm_delete_message(
      {},
      { locale: profileStore.currentLocale }
    ),
    cancel: profileMessages.profile_cancel({}, { locale: profileStore.currentLocale }),
    yesDelete: profileMessages.profile_yes_delete({}, { locale: profileStore.currentLocale })
  }))

  watch(
    () => props.open,
    isOpen => {
      if (isOpen) {
        // Initialize locale if not already initialized
        if (!profileStore.isInitialized) {
          void profileStore.initializeLocale()
        }
        // Set initial tab if provided
        if (props.initialTab) {
          tab.value = props.initialTab
          profileStore.activeTab = props.initialTab
        }
        // Mobile: default to the tab list only for a generic "My profile" open. When a caller
        // passes initialTab (checkout → orders, address picker, deep link), show that content
        // immediately instead of an extra tap on the same tab name.
        if (uiStore.isMobile) {
          showMobileTabList.value = !props.initialTab
        }
        // Open order when opened with initialOrderId (e.g. checkout → details, /order/:id → timeline)
        if (props.initialOrderId != null && (props.initialTab ?? tab.value) === 'orders') {
          nextTick(() => {
            const presentation = props.initialOrderPresentation ?? 'timeline'
            if (presentation === 'details') {
              void ordersStore.openOrderDetailsById(props.initialOrderId!)
            } else {
              void ordersStore.openOrderTimeline(props.initialOrderId!)
            }
            uiStore.clearOpenProfileWithOrderId()
          })
        }
      }
    },
    { immediate: true }
  )
</script>

<template>
  <Dialog :open="props.open" variant="large" @update:open="emit('update:open', $event)">
    <DialogContent variant="large" class="p-0 flex flex-col overflow-hidden">
      <DialogTitle class="sr-only">{{ myProfileLabel }}</DialogTitle>
      <DialogDescription class="sr-only">
        {{ messages.profile_my_profile({}, { locale: profileStore.currentLocale }) }}
      </DialogDescription>
      <div
        v-if="profileStore.isLoading"
        class="absolute inset-0 flex items-center justify-center z-50"
      >
        <Spinner class="text-primary size-6" />
      </div>

      <!-- Desktop Layout -->
      <template v-if="!uiStore.isMobile">
        <Tabs v-model="tab" orientation="vertical" class="flex flex-row flex-1 min-h-0">
          <TabsList
            class="flex flex-col gap-2 px-2 py-2 bg-muted/40 border-r border-border h-full rounded-none w-[256px] items-stretch justify-start"
          >
            <template v-for="item in tabItems" :key="item.value">
              <TabsTrigger
                :value="item.value"
                class="flex py-4 items-center justify-start gap-3 w-full rounded-[6px] transition-colors text-left"
                :class="tab === item.value ? '!bg-primary/30' : 'bg-transparent text-foreground'"
              >
                <component :is="item.icon" class="size-6 text-primary" />
                {{ item.label }}
              </TabsTrigger>
            </template>
          </TabsList>

          <!-- Desktop Content -->
          <div class="flex-1 relative pb-2 min-h-0 overflow-hidden">
            <TabsContent value="account" class="mt-0 h-full min-h-0">
              <AccountTab
                title="Account"
                :counters="counters"
                @save="() => {}"
                @sign-out="handleSignOut"
              />
            </TabsContent>
            <TabsContent value="orders" class="mt-0 h-full min-h-0">
              <OrdersTab title="Orders" @reorder-success="emit('update:open', false)" />
            </TabsContent>
            <TabsContent value="address" class="mt-0 h-full min-h-0">
              <AddressTab
                :show-select-button="showSelectAddressButton"
                @select-address="handleAddressSelect"
              />
            </TabsContent>
            <TabsContent value="preferences" class="mt-0 h-full min-h-0 px-4">
              <PreferencesTab />
            </TabsContent>
          </div>
        </Tabs>
      </template>

      <!-- Mobile Layout -->
      <template v-else>
        <div class="relative h-full overflow-hidden">
          <Transition name="panel-slide" mode="out-in">
            <!-- Mobile Tab List View -->
            <div
              v-if="showMobileTabList"
              key="tab-list"
              class="flex flex-col h-full absolute inset-0"
            >
              <!-- Mobile Header -->
              <div
                class="flex items-center justify-between p-4 border-b border-border flex-shrink-0"
              >
                <h2 class="text-base font-semibold">{{ myProfileLabel }}</h2>
              </div>

              <!-- Tab List - Scrollable -->
              <div class="flex flex-col gap-0 py-0">
                <template v-for="item in tabItems" :key="item.value">
                  <button
                    class="flex py-4 px-4 items-center justify-start gap-3 w-full rounded-[6px] transition-colors text-left"
                    :class="
                      tab === item.value
                        ? '!bg-primary/30'
                        : 'bg-transparent text-foreground hover:bg-muted/50'
                    "
                    @click="
                      handleMobileTabClick(
                        item.value as 'account' | 'orders' | 'address' | 'preferences'
                      )
                    "
                  >
                    <component :is="item.icon" class="size-6 text-primary" />
                    <span class="text-sm font-semibold">{{ item.label }}</span>
                  </button>
                </template>
              </div>
            </div>

            <!-- Mobile Content View -->
            <div v-else key="content" class="flex flex-col h-full absolute inset-0 min-h-0">
              <!-- Mobile Header with Back Button -->
              <div
                class="flex items-center justify-between p-4 border-b border-border flex-shrink-0"
              >
                <div class="flex items-center gap-3">
                  <Button variant="ghost" size="icon" class="size-9" @click="handleMobileBackClick">
                    <ArrowLeft class="size-4" />
                    <span class="sr-only">Back</span>
                  </Button>
                  <h2 class="text-base font-semibold">{{ currentTabLabel }}</h2>
                </div>
              </div>

              <!-- Content - Scrollable on Mobile -->
              <Tabs v-model="tab" orientation="vertical" class="h-full overflow-hidden">
                <TabsContent value="account" class="mt-0 h-full">
                  <AccountTab
                    title="Account"
                    :counters="counters"
                    @save="() => {}"
                    @sign-out="handleSignOut"
                  />
                </TabsContent>
                <TabsContent value="orders" class="mt-0 h-full">
                  <OrdersTab title="Orders" @reorder-success="emit('update:open', false)" />
                </TabsContent>
                <TabsContent value="address" class="mt-0 h-full">
                  <AddressTab
                    :show-select-button="showSelectAddressButton"
                    @select-address="handleAddressSelect"
                  />
                </TabsContent>
                <TabsContent value="preferences" class="px-4 py-4 mt-0 h-full">
                  <PreferencesTab />
                </TabsContent>
              </Tabs>
            </div>
          </Transition>
        </div>
      </template>

      <!-- Add/Edit Address Modal (shared so it works from Account tab without switching) -->
      <DialogRoot v-model:open="profileStore.showAddModal">
        <DialogContentInner
          class="max-w-3xl sm:max-w-3xl overflow-hidden"
          :class="{
            'fixed w-full max-w-full max-h-[calc(100dvh-5rem)] h-[calc(100dvh-5rem)] bottom-0 left-0 right-0 inset-x-0 -translate-x-0 translate-y-0 transform-none rounded-t-2xl rounded-b-none p-4 overflow-hidden flex flex-col grid-cols-none top-auto':
              uiStore.isMobile
          }"
        >
          <DialogHeader class="flex-shrink-0 pb-4 border-b border-border">
            <DialogTitle>{{
              profileStore.editingAddress ? addressModalT.editAddress : addressModalT.addNewAddress
            }}</DialogTitle>
          </DialogHeader>
          <AddressForm
            :address="profileStore.editingAddress"
            @save="profileStore.saveAddress"
            @cancel="profileStore.showAddModal = false"
          />
        </DialogContentInner>
      </DialogRoot>

      <!-- Delete Address Confirmation -->
      <DialogRoot v-model:open="profileStore.showDeleteConfirm">
        <DialogContentInner>
          <DialogHeader>
            <DialogTitle>{{ addressModalT.confirmDelete }}</DialogTitle>
            <DialogDescription>{{ addressModalT.confirmDeleteMessage }}</DialogDescription>
          </DialogHeader>
          <div class="flex gap-2 justify-end">
            <Button variant="outline" @click="profileStore.showDeleteConfirm = false">{{
              addressModalT.cancel
            }}</Button>
            <Button variant="destructive" @click="profileStore.deleteAddress">{{
              addressModalT.yesDelete
            }}</Button>
          </div>
        </DialogContentInner>
      </DialogRoot>
    </DialogContent>
  </Dialog>
</template>
