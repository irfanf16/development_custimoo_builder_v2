<script setup lang="ts">
  import { computed } from 'vue'
  import { Button } from '@/components/ui/button'
  import { Separator } from '@/components/ui/separator'
  import { CheckCircle2, Plus, X } from 'lucide-vue-next'
  import RosterTable from './RosterTable.vue'
  import { useRoster } from './useRoster'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    colors_choose_from_locker,
    colors_separator_or,
    roster_add_player,
    roster_empty_state,
    roster_import_ready,
    roster_import_success,
    ui_close
  } from '@/paraglide/messages'

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const {
    rosterEntries,
    availableSizes,
    addEmptyRow,
    removeRow,
    updateRow,
    hasEntries,
    lastImportSummary,
    setLastImportSummary
  } = useRoster()

  const playersCount = computed(() => rosterEntries.value.length)
  const showInlineMessage = computed(() => lastImportSummary.value != null)

  function handleAddRow() {
    addEmptyRow()
  }

  function handleDismissInline() {
    setLastImportSummary(null)
  }
</script>

<template>
  <div class="flex flex-col gap-4 px-4 py-6 md:px-6">
    <transition name="fade">
      <div
        v-if="showInlineMessage"
        class="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-emerald-900"
      >
        <CheckCircle2 class="mt-0.5 size-5 text-emerald-600" aria-hidden="true" />
        <div class="flex-1 text-sm">
          <p class="font-semibold">
            {{
              roster_import_success(
                { count: lastImportSummary?.totalRows ?? playersCount },
                { locale }
              )
            }}
          </p>
          <p class="text-emerald-900/80">
            {{ roster_import_ready({}, { locale }) }}
          </p>
        </div>
        <button
          type="button"
          class="text-emerald-600 transition hover:text-emerald-800"
          :aria-label="ui_close({}, { locale })"
          @click="handleDismissInline"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>
    </transition>

    <div v-if="hasEntries" class="space-y-4">
      <RosterTable
        :entries="rosterEntries"
        :size-options="availableSizes"
        @update:entry="updateRow"
        @remove="removeRow"
      />
      <Button
        variant="secondary"
        class="h-11 w-full justify-center gap-2 rounded-xl border border-border bg-background font-medium"
        @click="handleAddRow"
      >
        <Plus class="size-4" />
        {{ roster_add_player({}, { locale }) }}
      </Button>
      <div class="flex items-center gap-3 text-xs font-semibold uppercase text-muted-foreground">
        <Separator class="flex-1 bg-border" />
        <span class="tracking-[0.3em]">{{ colors_separator_or({}, { locale }) }}</span>
        <Separator class="flex-1 bg-border" />
      </div>
      <Button
        variant="secondary"
        class="h-11 w-full rounded-xl border border-dashed border-border bg-muted/30"
        disabled
        aria-disabled="true"
      >
        {{ colors_choose_from_locker({}, { locale }) }}
      </Button>
    </div>

    <div
      v-else
      class="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground"
    >
      {{ roster_empty_state({}, { locale }) }}
      <Separator class="my-4 bg-border" />
      <Button
        variant="secondary"
        class="h-11 w-full justify-center gap-2 rounded-xl border border-border bg-background"
        @click="handleAddRow"
      >
        <Plus class="size-4" />
        {{ roster_add_player({}, { locale }) }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
