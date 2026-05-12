<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import Input from '@/components/ui/input/Input.vue'
  import type { DashboardCounters } from '@/services/dashboard/types'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { storeToRefs } from 'pinia'
  import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { m as messages } from '@/paraglide/messages'
  import { computed, ref, onMounted } from 'vue'
  import { useScrollAreaFill } from '@/composables/useScrollAreaFill'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useSignIn } from '@/composables/useSignIn'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  defineProps<{ title?: string; counters: DashboardCounters }>()

  onMounted(() => {
    profileStore.fetchAddresses()
    profileStore.fetchDashboard()
  })

  const auth = useAuthStore()
  const { customer, customerInitials } = storeToRefs(auth)
  const profileStore = useProfileStore()
  const { handleLogout } = useSignIn()
  const emit = defineEmits(['sign-out'])
  const uiStore = useUIStore()
  const defaultAddress = computed(() => profileStore.defaultAddress)

  const isEditingName = ref(false)
  const isUpdatingName = ref(false)
  const firstName = ref('')
  const lastName = ref('')

  const t = computed(() => ({
    account: messages.profile_account({}, { locale: profileStore.currentLocale }),
    edit: messages.profile_edit({}, { locale: profileStore.currentLocale }),
    update: messages.profile_update({}, { locale: profileStore.currentLocale }),
    signOut: messages.profile_sign_out({}, { locale: profileStore.currentLocale }),
    ordersCount: messages.profile_orders_count({}, { locale: profileStore.currentLocale }),
    pendingApprovalCount: messages.profile_pending_approval_count(
      {},
      { locale: profileStore.currentLocale }
    ),
    trackMyOrdersCount: messages.profile_track_my_orders_count(
      {},
      { locale: profileStore.currentLocale }
    ),
    name: messages.profile_name({}, { locale: profileStore.currentLocale }),
    address: messages.profile_address({}, { locale: profileStore.currentLocale }),
    homeNumber: messages.profile_home_number({}, { locale: profileStore.currentLocale }),
    email: messages.profile_email({}, { locale: profileStore.currentLocale })
  }))

  function handleSignOut() {
    handleLogout({ clearAllStorage: true, resetProfileStore: true })
    emit('sign-out')
  }

  function handleEditDefaultAddress() {
    if (defaultAddress.value) {
      profileStore.editingAddress = defaultAddress.value
    } else {
      profileStore.editingAddress = null
      profileStore.resetAddressForm()
    }
    profileStore.showAddModal = true
  }

  const accountShellRef = ref<HTMLElement | null>(null)
  const accountHeaderMeasureRef = ref<HTMLElement | null>(null)
  const { scrollAreaStyle: accountScrollAreaStyle } = useScrollAreaFill({
    shellRef: accountShellRef,
    headerRef: accountHeaderMeasureRef
  })

  async function handleEditName() {
    if (isEditingName.value) {
      isUpdatingName.value = true
      await profileStore.updateCustomerName({
        first_name: firstName.value,
        last_name: lastName.value
      })
      isUpdatingName.value = false
      isEditingName.value = false
    } else {
      firstName.value = customer.value?.first_name || ''
      lastName.value = customer.value?.last_name || ''
      isEditingName.value = true
    }
  }
</script>

<template>
  <div ref="accountShellRef" class="flex min-h-0 h-full flex-col overflow-hidden" data-testid="profile-account-root">
    <div
      v-if="!uiStore.isMobile"
      ref="accountHeaderMeasureRef"
      class="sticky top-0 z-1 max-w-max px-4 pb-3 pt-4 shrink-0"
    >
      <div class="text-lg font-semibold">{{ title || t.account }}</div>
    </div>
    <ScrollArea :style="accountScrollAreaStyle" class="min-h-0 w-full min-w-0">
      <div class="px-4 pb-4 space-y-3">
        <!-- Profile header -->
        <div class="flex items-center justify-between py-4">
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <div
              class="h-16 w-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-lg flex-shrink-0"
            >
              {{ customerInitials }}
            </div>
            <div class="flex flex-col gap-1">
              <!-- Name: text-lg semibold -->
              <div v-if="!isEditingName" class="text-lg font-semibold leading-none">
                {{ (customer?.first_name || '') + ' ' + (customer?.last_name || '') }}
              </div>
              <div v-else class="flex gap-2">
                <Input
                  v-model="firstName"
                  :placeholder="
                    messages.account_first_name_placeholder(
                      {},
                      { locale: profileStore.currentLocale }
                    )
                  "
                  class="w-32"
                />
                <Input
                  v-model="lastName"
                  :placeholder="
                    messages.account_last_name_placeholder(
                      {},
                      { locale: profileStore.currentLocale }
                    )
                  "
                  class="w-32"
                />
              </div>
              <!-- Email: text-sm medium muted -->
              <div class="text-xs text-muted-foreground">{{ customer?.email }}</div>
            </div>
          </div>

          <!-- Buttons: rounded-md, bg #F5F5F5, border -->
          <div class="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              class="rounded-md bg-muted hover:bg-muted/80 flex items-center gap-1.5"
              data-testid="profile-account-button-edit-name"
              :disabled="isUpdatingName"
              @click="handleEditName"
            >
              <Spinner v-if="isUpdatingName" class="size-3" />
              {{ isEditingName ? t.update : t.edit }}
            </Button>
            <Button
              size="sm"
              variant="outline"
              class="rounded-md bg-muted hover:bg-muted/80"
              data-testid="profile-account-button-sign-out"
              @click="handleSignOut"
            >
              {{ t.signOut }}
            </Button>
          </div>
        </div>

        <!-- Counter cards: p-6, gap-6 inside, text-3xl semibold count, rounded-xl -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1 p-6 rounded-xl border border-border bg-card shadow-sm">
            <div class="text-sm font-normal text-muted-foreground">{{ t.ordersCount }}</div>
            <div class="text-2xl font-bold text-card-foreground">{{ counters.orders_count }}</div>
          </div>
          <div class="flex flex-col gap-1 p-6 rounded-xl border border-border bg-card shadow-sm">
            <div class="text-sm font-normal text-muted-foreground">
              {{ t.pendingApprovalCount }}
            </div>
            <div class="text-2xl font-bold text-card-foreground">
              {{ counters.pending_approval_count }}
            </div>
          </div>
          <div class="flex flex-col gap-1 p-6 rounded-xl border border-border bg-card shadow-sm">
            <div class="text-sm font-normal text-muted-foreground">{{ t.trackMyOrdersCount }}</div>
            <div class="text-2xl font-bold text-card-foreground">
              {{ counters.track_my_orders_count }}
            </div>
          </div>
        </div>

        <!-- Name card: rounded-sm, p-4, bg primary-foreground, gap-3 row, gap-0.5 title/value -->
        <div
          class="flex flex-row items-center justify-between rounded-sm border border-border bg-primary-foreground p-4 gap-3"
        >
          <div class="flex flex-col gap-0.5">
            <span class="text-sm font-normal text-muted-foreground">{{ t.name }}</span>
            <span class="text-sm font-medium text-card-foreground">
              {{
                (defaultAddress?.first_name || 'John') + ' ' + (defaultAddress?.last_name || 'Doe')
              }}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="rounded-md bg-muted hover:bg-muted/80 flex-shrink-0"
            @click="handleEditDefaultAddress"
          >
            <i-flex-line-edit class="size-3.5" />
            {{ t.edit }}
          </Button>
        </div>

        <!-- Address card: rounded-sm, p-4, bg primary-foreground, no edit button -->
        <div
          class="flex flex-col rounded-sm border border-border bg-primary-foreground p-4 gap-0.5"
        >
          <span class="text-sm font-normal text-muted-foreground">{{ t.address }}</span>
          <!-- Line 1: street, floor/apt -->
          <span
            v-if="defaultAddress?.address1 || defaultAddress?.address2"
            class="text-sm font-medium text-card-foreground"
          >
            {{
              [defaultAddress?.address1, defaultAddress?.address2].filter(v => v?.trim()).join(', ')
            }}
          </span>
          <!-- Line 2: postal code, region/state -->
          <span
            v-if="defaultAddress?.zip_code || defaultAddress?.state"
            class="text-sm font-medium text-card-foreground"
          >
            {{
              [defaultAddress?.zip_code, defaultAddress?.state].filter(v => v?.trim()).join(', ')
            }}
          </span>
          <!-- Line 3: city, country -->
          <span
            v-if="defaultAddress?.city || defaultAddress?.country?.name"
            class="text-sm font-medium text-card-foreground"
          >
            {{
              [defaultAddress?.city, defaultAddress?.country?.name]
                .filter(v => v?.trim())
                .join(', ')
            }}
          </span>
        </div>

        <!-- Phone number card -->
        <div
          class="flex flex-col rounded-sm border border-border bg-primary-foreground p-4 gap-0.5"
        >
          <span class="text-sm font-normal text-muted-foreground">{{ t.homeNumber }}</span>
          <span class="text-sm font-medium text-card-foreground">
            {{ defaultAddress?.phone_number ?? '+45 40 14 11 40' }}
          </span>
        </div>

        <!-- Email card -->
        <div
          class="flex flex-col rounded-sm border border-border bg-primary-foreground p-4 gap-0.5"
        >
          <span class="text-sm font-normal text-muted-foreground">{{ t.email }}</span>
          <span class="text-sm font-medium text-card-foreground">
            {{ customer?.email || 'user@example.com' }}
          </span>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>
