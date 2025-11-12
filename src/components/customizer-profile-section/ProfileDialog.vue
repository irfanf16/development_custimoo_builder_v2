<script setup lang="ts">
  import Dialog from '@/components/ui/dialog/Dialog.vue'
  import DialogContent from '@/components/ui/dialog/DialogContent.vue'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import { useProfileDialogState } from '@/composables/useProfileDialogState'
  import AccountTab from './account-section/AccountTab.vue'
  import OrdersTab from './orders-section/OrdersTab.vue'
  import AddressTab from './address-section/AddressTab.vue'
  // import PreferencesTab from './preferences-section/PreferencesTab.vue'
  import { onMounted, watch } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { storeToRefs } from 'pinia'
  import Loader from '../ui/loader/Loader.vue'
  import PreferencesTab from './preferences-section/PreferencesTab.vue'

  const props = defineProps<{ open: boolean }>()
  const emit = defineEmits(['update:open'])

  const { tab, tabItems } = useProfileDialogState()
  const profileStore = useProfileStore()
  const { counters } = storeToRefs(profileStore)

  // Fetch addresses when dialog opens
  onMounted(profileStore.fetchAddresses)

  // Watch tab changes and persist them
  watch(
    () => tab.value,
    newTab => {
      profileStore.activeTab = newTab as 'account' | 'orders' | 'address' | 'preferences'
      profileStore.saveToLocalStorage()
    }
  )
  function handleSignOut() {
    emit('update:open', false)
    localStorage.clear()
    useProfileStore().$reset()
  }

  watch(
    () => props.open,
    isOpen => {
      if (isOpen) {
        // Load persisted state when dialog opens
        profileStore.loadFromLocalStorage()
        // Initialize locale if not already initialized
        if (!profileStore.isInitialized) {
          void profileStore.initializeLocale()
        }
        profileStore.fetchDashboard()
      }
    },
    { immediate: true }
  )
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent
      :class="'w-[1200px] h-[760px] max-w-full p-0 overflow-hidden overflow-hidden flex flex-col'"
    >
      <div
        v-if="profileStore.isLoading"
        class="absolute inset-0 flex items-center justify-center bg-white/70 z-50"
      >
        <Loader variant="spinner" class="text-primary" />
      </div>

      <div class="flex h-full">
        <Tabs
          v-model="tab"
          orientation="vertical"
          class="flex flex-col w-[256px] border-r border-border bg-muted/40"
        >
          <div class="flex flex-col h-full py-2">
            <TabsList
              class="flex flex-col gap-2 px-2 py-0 bg-transparent rounded-none border-0 items-stretch"
            >
              <template v-for="item in tabItems" :key="item.value">
                <TabsTrigger
                  :value="item.value"
                  class="flex py-4 px-4 items-center justify-start gap-3 w-full rounded-[6px] transition-colors text-left"
                  :class="tab === item.value ? '!bg-primary/30' : 'bg-transparent text-foreground'"
                >
                  <component :is="item.icon" class="size-6 text-primary" />
                  {{ item.label }}
                </TabsTrigger>
              </template>
            </TabsList>
          </div>
        </Tabs>

        <!-- Right: Content -->
        <div class="flex-1 relative py-2">
          <Tabs v-model="tab" orientation="vertical" class="h-full">
            <TabsContent value="account" class="h-full px-4">
              <AccountTab
                title="Account"
                :counters="counters"
                @save="() => {}"
                @sign-out="handleSignOut"
              />
            </TabsContent>
            <TabsContent value="orders" class="h-full">
              <OrdersTab title="Orders" />
            </TabsContent>
            <TabsContent value="address" class="h-full">
              <AddressTab />
            </TabsContent>
            <TabsContent value="preferences" class="h-full px-4">
              <PreferencesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
