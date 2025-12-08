<script setup lang="ts">
  import { computed } from 'vue'
  import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
  import { CheckCircle2, X } from 'lucide-vue-next'
  import RosterTable from './RosterTable.vue'
  import { useRoster } from './useRoster'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { roster_import_ready, roster_import_success, ui_close } from '@/paraglide/messages'

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const {
    rosterEntries,
    availableSizes,
    removeRow,
    updateRow,
    hasEntries,
    lastImportSummary,
    setLastImportSummary
  } = useRoster()

  const playersCount = computed(() => rosterEntries.value.length)
  const showInlineMessage = computed(() => lastImportSummary.value != null)

  function handleDismissInline() {
    setLastImportSummary(null)
  }
</script>

<template>
  <div class="flex flex-col gap-4 px-4 pb-4 md:px-6 md:pb-6">
    <transition name="fade">
      <Alert
        v-if="showInlineMessage"
        class="relative flex items-start gap-3 rounded-2xl border-primary/20 bg-primary/10"
      >
        <div class="flex flex-row gap-2">
          <CheckCircle2 class="size-9 text-primary" aria-hidden="true" />
          <div class="flex flex-col">
            <AlertTitle>
              {{
                roster_import_success(
                  { count: lastImportSummary?.totalRows ?? playersCount },
                  { locale }
                )
              }}
            </AlertTitle>
            <AlertDescription class="text-muted-foreground">
              {{ roster_import_ready({}, { locale }) }}
            </AlertDescription>
          </div>
        </div>
        <button
          type="button"
          class="absolute right-4 top-4 text-primary transition hover:text-primary/80"
          :aria-label="ui_close({}, { locale })"
          @click="handleDismissInline"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </Alert>
    </transition>

    <div v-if="hasEntries" class="space-y-4">
      <RosterTable
        :entries="rosterEntries"
        :size-options="availableSizes"
        @update:entry="updateRow"
        @remove="removeRow"
      />
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
