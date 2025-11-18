<script setup lang="ts">
  import Dialog from '@/components/ui/dialog/Dialog.vue'
  import DialogContent from '@/components/ui/dialog/DialogContent.vue'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import { useProfileDialogState } from '@/composables/useProfileDialogState'
  import AccountTab from './account-section/AccountTab.vue'
  import OrdersTab from './orders-section/OrdersTab.vue'
  import AddressTab from './address-section/AddressTab.vue'
  import { ref, watch, computed } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { storeToRefs } from 'pinia'
  import Spinner from '../ui/spinner/Spinner.vue'
  import PreferencesTab from './preferences-section/PreferencesTab.vue'
  import { useLocalStorage } from '@/composables/useLocalStorage'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { Button } from '@/components/ui/button'
  import { ArrowLeft } from 'lucide-vue-next'
  import { m as messages } from '@/paraglide/messages'
  import { DialogTitle, DialogDescription } from '@/components/ui/dialog'

  const props = defineProps<{ open: boolean }>()
  const emit = defineEmits(['update:open'])

  const { tab, tabItems } = useProfileDialogState()
  const profileStore = useProfileStore()
  const { counters } = storeToRefs(profileStore)
  const { clearAll } = useLocalStorage()
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
    clearAll()
    useProfileStore().$reset()
  }

  function handleMobileTabClick(tabValue: 'account' | 'orders' | 'address' | 'preferences') {
    // Always navigate to content view, even if clicking the same tab
    showMobileTabList.value = false
    tab.value = tabValue
  }

  function handleMobileBackClick() {
    showMobileTabList.value = true
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
        // Reset mobile view to tab list when dialog opens
        if (uiStore.isMobile) {
          showMobileTabList.value = true
        }
      }
    },
    { immediate: true }
  )
</script>

<template>
  <Dialog :open="props.open" variant="large" @update:open="emit('update:open', $event)">
    <DialogContent variant="large" class="p-0">
      <DialogTitle class="sr-only">{{ myProfileLabel }}</DialogTitle>
      <DialogDescription class="sr-only">
        {{ messages.profile_my_profile({}, { locale: profileStore.currentLocale }) }}
      </DialogDescription>
      <div
        v-if="profileStore.isLoading"
        class="absolute inset-0 flex items-center justify-center bg-white/70 z-50"
      >
        <Spinner class="text-primary size-6" />
      </div>

      <!-- Desktop Layout -->
      <template v-if="!uiStore.isMobile">
        <div class="flex h-full flex-row">
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
                    class="flex py-4 items-center justify-start gap-3 w-full rounded-[6px] transition-colors text-left"
                    :class="
                      tab === item.value ? '!bg-primary/30' : 'bg-transparent text-foreground'
                    "
                  >
                    <component :is="item.icon" class="size-6 text-primary" />
                    {{ item.label }}
                  </TabsTrigger>
                </template>
              </TabsList>
            </div>
          </Tabs>

          <!-- Desktop Content -->
          <div class="flex-1 relative py-2">
            <Tabs v-model="tab" orientation="vertical" class="h-full">
              <TabsContent value="account" class="h-full">
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
                  <OrdersTab title="Orders" />
                </TabsContent>
                <TabsContent value="address" class="mt-0 h-full">
                  <AddressTab />
                </TabsContent>
                <TabsContent value="preferences" class="px-4 py-4 mt-0 h-full">
                  <PreferencesTab />
                </TabsContent>
              </Tabs>
            </div>
          </Transition>
        </div>
      </template>
    </DialogContent>
  </Dialog>
</template>
