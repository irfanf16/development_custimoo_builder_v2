<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import Card from '@/components/ui/card/Card.vue'
  import CardHeader from '@/components/ui/card/CardHeader.vue'
  import CardTitle from '@/components/ui/card/CardTitle.vue'
  import CardContent from '@/components/ui/card/CardContent.vue'
  import type { DashboardCounters } from '@/services/dashboard/types'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { storeToRefs } from 'pinia'
  import ScrollArea from '@/components/ui/scroll-area/ScrollArea.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { m as messages } from '@/paraglide/messages'
  import { computed } from 'vue'

  defineProps<{ title?: string; counters: DashboardCounters }>()

  const auth = useAuthStore()
  const { customer, customerInitials } = storeToRefs(auth)
  const profileStore = useProfileStore()
  const emit = defineEmits(['sign-out'])

  const t = computed(() => ({
    account: messages.profile_account({}, { locale: profileStore.currentLocale }),
    edit: messages.profile_edit({}, { locale: profileStore.currentLocale }),
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
    auth.logout() // logout user
    localStorage.clear() // clear all localStorage data
    emit('sign-out') // let parent know to close dialog
  }
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="sticky top-0 z-1 pb-3 max-w-max">
      <div class="text-lg font-semibold">{{ title || t.account }}</div>
    </div>
    <ScrollArea>
      <div class="flex-1 overflow-y-auto py-2 space-y-3">
        <!-- Profile header with avatar and actions -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold"
            >
              {{ customerInitials }}
            </div>
            <div class="flex flex-col">
              <div class="font-medium">
                {{ (customer?.first_name || '') + ' ' + (customer?.last_name || '') }}
              </div>
              <div class="text-sm text-muted-foreground">{{ customer?.email }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button size="sm" variant="outline">{{ t.edit }}</Button>
            <Button size="sm" variant="destructive" @click="handleSignOut">{{ t.signOut }}</Button>
          </div>
        </div>

        <!-- Counters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card class="flex flex-col gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-4 hover:bg-[#FAFAFA]">
            <div class="text-sm text-muted-foreground">{{ t.ordersCount }}</div>
            <div class="text-2xl font-bold">{{ counters.orders_count }}</div>
          </Card>
          <Card class="flex flex-col gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-4 hover:bg-[#FAFAFA]">
            <div class="text-sm text-muted-foreground">{{ t.pendingApprovalCount }}</div>
            <div class="text-2xl font-bold">{{ counters.pending_approval_count }}</div>
          </Card>
          <Card class="flex flex-col gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-4 hover:bg-[#FAFAFA]">
            <div class="text-sm text-muted-foreground">{{ t.trackMyOrdersCount }}</div>
            <div class="text-2xl font-bold">{{ counters.track_my_orders_count }}</div>
          </Card>
        </div>

        <!-- Name card with edit on right -->
        <Card
          class="flex flex-row items-center justify-between gap-0 md:gap-0 px-2 md:px-4 py-2 md:py-4 hover:bg-[#FAFAFA]"
        >
          <!-- Left side: Name and customer name -->
          <div class="flex flex-col">
            <CardTitle class="text-[12px] text-muted-foreground font-normal">{{
              t.name
            }}</CardTitle>
            <div class="text-sm">
              {{ (customer?.first_name || 'John') + ' ' + (customer?.last_name || 'Doe') }}
            </div>
          </div>

          <!-- Right side: Edit button -->
          <Button size="sm" variant="outline" class="self-center"
            ><i-flex-line-edit /> {{ t.edit }}</Button
          >
        </Card>
        <!-- Address card (hardcoded for now) -->
        <Card class="flex flex-col gap-0 md:gap-0 px-2 md:px-4 py-2 md:py-4 hover:bg-[#FAFAFA]">
          <CardHeader class="px-0 md:px-0 py-0 md:py-0 gap-0">
            <CardTitle class="text-[12px] text-muted-foreground font-normal">{{
              t.address
            }}</CardTitle>
          </CardHeader>
          <CardContent class="px-0 md:px-0 py-0 md:py-0">
            <div class="text-sm">Danneskiold-Samsøes Allé 41</div>
            <div class="text-sm text-muted-foreground">Copenhagen 1434</div>
          </CardContent>
        </Card>

        <!-- Home number card (hardcoded) -->
        <Card class="flex flex-col gap-0 md:gap-0 px-2 md:px-4 py-2 md:py-4 hover:bg-[#FAFAFA]">
          <CardHeader class="px-0 md:px-0 py-0 md:py-0 gap-0">
            <CardTitle class="text-[12px] text-muted-foreground font-normal">{{
              t.homeNumber
            }}</CardTitle>
          </CardHeader>
          <CardContent class="px-0 md:px-0 py-0 md:py-0">
            <div class="text-sm">+45 40 14 11 40</div>
          </CardContent>
        </Card>

        <!-- Email card from customer -->
        <Card class="flex flex-col gap-0 md:gap-0 px-2 md:px-4 py-2 md:py-4 hover:bg-[#FAFAFA]">
          <CardHeader class="px-0 md:px-0 py-0 md:py-0 gap-0">
            <CardTitle class="text-[12px] text-muted-foreground font-normal">{{
              t.email
            }}</CardTitle>
          </CardHeader>
          <CardContent class="px-0 md:px-0 py-0 md:py-0">
            <div class="text-sm">{{ customer?.email || 'user@example.com' }}</div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
</template>
