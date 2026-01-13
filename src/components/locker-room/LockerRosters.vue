<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { Spinner } from '@/components/ui/spinner'
  import type { ProductRosterDetail } from '@/services/products/types'
  import { UsersIcon } from 'lucide-vue-next'
  import { computed, ref } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    locker_roster_name,
    locker_roster_number,
    locker_roster_players,
    locker_use_in_design,
    locker_preview
  } from '@/paraglide/messages'
  type RosterProps = {
    roster_group: ProductRosterDetail[] | undefined
    group_name: string
  }
  defineProps<{ rosters: RosterProps[] }>()

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const isLoading = ref(false)
</script>
<template>
  <div class="w-full">
    <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />

    <div v-else class="flex flex-col gap-4 h-full p-4">
      <!-- Rosters Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
        <template v-for="(roster, rosterIndex) in rosters">
          <Card
            v-if="roster.roster_group"
            :key="rosterIndex"
            class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
          >
            <!-- Sticky Table Header -->
            <!-- Header -->
            <div class="sticky top-0 bg-gray-200 border-b border-border border rounded-t-lg z-10">
              <div class="grid grid-cols-2 gap-4 px-4 py-3 font-semibold text-sm">
                <div>{{ locker_roster_name({}, { locale }) }}</div>
                <div>{{ locker_roster_number({}, { locale }) }}</div>
              </div>
            </div>

            <ScrollArea class="h-28 overflow-y-auto border-border rounded-b-lg border">
              <!-- Table Body -->
              <div class="divide-y">
                <div
                  v-for="(player, playerIndex) in roster.roster_group"
                  :key="playerIndex"
                  class="grid grid-cols-2 gap-4 px-4 py-3 text-sm hover:bg-secondary border-b border border-border"
                >
                  <div class="text-foreground">{{ player.text }}</div>
                  <div class="text-foreground">{{ player.number }}</div>
                </div>
              </div>
            </ScrollArea>

            <div class="flex flex-col items-center justify-center gap-1">
              <h3 class="font-semibold text-base">{{ roster.group_name }}</h3>
              <p class="text-xs text-muted-foreground mb-2">
                <UsersIcon class="inline-block w-4 h-4 mr-1" />
                {{ roster.roster_group.reduce((acc, player) => acc + player.quantity, 0) }}
                {{ locker_roster_players({}, { locale }) }}
              </p>

              <Button class="w-full bg-teal-500 hover:bg-teal-600 text-white">
                {{ locker_use_in_design({}, { locale }) }}
              </Button>
              <Button variant="outline" class="w-full">
                {{ locker_preview({}, { locale }) }}
              </Button>
            </div>
          </Card>
        </template>
      </div>
    </div>
  </div>
</template>
