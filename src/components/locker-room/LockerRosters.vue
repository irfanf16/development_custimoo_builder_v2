<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { Spinner } from '@/components/ui/spinner'
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import type { ProductRosterDetail } from '@/services/products/types'
  import type { APCustomizationRosterEntry } from '@/services/products/types'
  import { UsersIcon } from 'lucide-vue-next'
  import { computed, ref, inject } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { useRoster } from '@/components/customization-workflow/WorkflowSteps/roster/useRoster'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { toast } from 'vue-sonner'
  import {
    locker_roster_name,
    locker_roster_number,
    locker_roster_players,
    locker_use_in_design,
    locker_preview,
    locker_no_rosters,
    roster_table_size,
    roster_table_quantity,
    msg_no_roster_data,
    msg_failed_to_convert_roster,
    msg_roster_step_not_available
  } from '@/paraglide/messages'

  type RosterProps = {
    roster_group: ProductRosterDetail[] | undefined
    group_name: string
  }
  const props = defineProps<{ rosters: RosterProps[] }>()

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const isLoading = ref(false)
  const showPreviewDialog = ref(false)
  const previewRoster = ref<ProductRosterDetail[] | null>(null)
  const previewGroupName = ref<string>('')

  const { replaceRoster, ensureEditableRoster, presetNameId, presetNumberId } = useRoster()
  const { menuItems, goTo } = useCustomizerMenu()
  const closeLockerBrowser = inject<(() => void) | undefined>('closeLockerBrowser')

  const hasAnyRoster = computed(
    () => props.rosters?.some(r => r.roster_group && r.roster_group.length > 0) ?? false
  )

  // Convert ProductRosterDetail to APCustomizationRosterEntry
  function normalizeRosterEntries(
    roster: ProductRosterDetail[] | undefined
  ): APCustomizationRosterEntry[] {
    if (!roster || !Array.isArray(roster)) return []
    return roster.map(entry => ({
      text: entry.text ?? '',
      number: entry.number ?? '',
      size: entry.size ?? '',
      quantity: Number(entry.quantity ?? 0),
      information: entry.information ?? ''
    }))
  }

  // Convert ProductRosterDetail to APCustomizationRosterEntry for preview
  const previewRosterEntries = computed<APCustomizationRosterEntry[]>(() => {
    if (!previewRoster.value) return []
    return normalizeRosterEntries(previewRoster.value)
  })

  async function handleUseInDesign(roster: ProductRosterDetail[] | undefined) {
    if (!roster || roster.length === 0) {
      toast.error(msg_no_roster_data({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }

    // Convert and load roster into customizer
    const rosterEntries = normalizeRosterEntries(roster)
    if (rosterEntries.length === 0) {
      toast.error(msg_failed_to_convert_roster({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }

    // Replace existing roster with the locker roster
    await replaceRoster(rosterEntries)

    // Navigate to roster step and open edit mode
    const visibleSteps = menuItems.value.map(i => i.step)
    if (visibleSteps.includes('roster')) {
      await goTo('roster')
      await ensureEditableRoster()
    } else {
      toast.error(msg_roster_step_not_available({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
    }

    // Close the locker browser dialog
    closeLockerBrowser?.()
  }

  function handlePreview(roster: ProductRosterDetail[] | undefined, groupName: string) {
    if (!roster || roster.length === 0) {
      toast.error(msg_no_roster_data({}, { locale: locale.value }), {
        position: 'top-right',
        richColors: true
      })
      return
    }
    previewRoster.value = roster
    previewGroupName.value = groupName
    showPreviewDialog.value = true
  }
</script>
<template>
  <div class="w-full">
    <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />

    <div v-else-if="!hasAnyRoster" class="py-8 text-center text-muted-foreground">
      {{ locker_no_rosters({}, { locale }) }}
    </div>

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

              <Button
                class="w-full bg-teal-500 hover:bg-teal-600 text-white"
                @click="handleUseInDesign(roster.roster_group)"
              >
                {{ locker_use_in_design({}, { locale }) }}
              </Button>
              <Button
                variant="outline"
                class="w-full"
                @click="handlePreview(roster.roster_group, roster.group_name)"
              >
                {{ locker_preview({}, { locale }) }}
              </Button>
            </div>
          </Card>
        </template>
      </div>
    </div>

    <!-- Preview Dialog -->
    <Dialog v-model:open="showPreviewDialog" variant="large">
      <DialogContent variant="large" class="max-w-6xl max-h-[90vh] flex flex-col gap-0">
        <DialogHeader class="p-4 border-b sticky top-0 z-10 shrink-0">
          <DialogTitle class="text-lg font-semibold">
            {{ previewGroupName }} - {{ locker_preview({}, { locale }) }}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea class="flex-1 overflow-y-auto p-4">
          <div v-if="previewRosterEntries.length > 0" class="rounded-lg border overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-muted/50">
                <tr>
                  <th
                    v-if="presetNameId"
                    class="text-left py-3 px-4 font-semibold text-muted-foreground"
                  >
                    {{ locker_roster_name({}, { locale }) }}
                  </th>
                  <th
                    v-if="presetNumberId"
                    class="text-left py-3 px-4 font-semibold text-muted-foreground"
                  >
                    {{ locker_roster_number({}, { locale }) }}
                  </th>
                  <th class="text-left py-3 px-4 font-semibold text-muted-foreground">
                    {{ roster_table_size({}, { locale }) }}
                  </th>
                  <th class="text-left py-3 px-4 font-semibold text-muted-foreground">
                    {{ roster_table_quantity({}, { locale }) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(entry, index) in previewRosterEntries"
                  :key="index"
                  class="border-t hover:bg-muted/50 transition-colors"
                >
                  <td v-if="presetNameId" class="py-3 px-4 text-foreground">
                    {{ entry.text || '-' }}
                  </td>
                  <td v-if="presetNumberId" class="py-3 px-4 text-foreground">
                    {{ entry.number || '-' }}
                  </td>
                  <td class="py-3 px-4 text-foreground">{{ entry.size || '-' }}</td>
                  <td class="py-3 px-4 text-foreground">{{ entry.quantity || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center text-muted-foreground py-8">
            No roster entries to display
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </div>
</template>
