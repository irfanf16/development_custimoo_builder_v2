<script setup lang="ts">
  import { computed } from 'vue'
  import type { APCustomizationRosterEntry } from '@/services/products/types'
  import RosterTableRow from './RosterTableRow.vue'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    roster_table_name,
    roster_table_number,
    roster_table_quantity,
    roster_table_size
  } from '@/paraglide/messages'
  import type { RosterColumnKey } from './types'

  interface Props {
    entries: APCustomizationRosterEntry[]
    sizeOptions: string[]
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:entry', index: number, payload: Partial<APCustomizationRosterEntry>): void
    (e: 'remove', index: number): void
  }>()

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  function focusCell(rowIndex: number, column: RosterColumnKey) {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-roster-cell="roster-cell-${rowIndex}-${column}"]`
      )
      el?.focus()
    })
  }

  function handleCellKeydown(payload: {
    event: KeyboardEvent
    column: RosterColumnKey
    index: number
  }) {
    const { event, column, index } = payload
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const target = event.currentTarget as HTMLElement | null
    if (target?.getAttribute('aria-expanded') === 'true') {
      return
    }
    event.preventDefault()
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const nextRow = index + delta
    if (nextRow < 0 || nextRow >= props.entries.length) return
    focusCell(nextRow, column)
  }

  function handleUpdate(index: number, payload: Partial<APCustomizationRosterEntry>) {
    emit('update:entry', index, payload)
  }

  function handleRemove(index: number) {
    emit('remove', index)
  }
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      class="grid grid-cols-[20px_minmax(0,1fr)_64px_112px_56px_32px] items-center gap-3 px-4 py-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground"
    >
      <span aria-hidden="true" class="justify-self-center" />
      <span>{{ roster_table_name({}, { locale }) }}</span>
      <span class="text-center">{{ roster_table_number({}, { locale }) }}</span>
      <span class="text-center">{{ roster_table_size({}, { locale }) }}</span>
      <span class="text-right">{{ roster_table_quantity({}, { locale }) }}</span>
      <span aria-hidden="true" class="justify-self-center" />
    </div>
    <ScrollArea class="max-h-[420px]">
      <div class="flex flex-col gap-1 px-1 pb-2">
        <RosterTableRow
          v-for="(entry, index) in entries"
          :key="`roster-row-${index}`"
          :entry="entry"
          :index="index"
          :size-options="sizeOptions"
          @update="handleUpdate"
          @remove="handleRemove"
          @cell-keydown="handleCellKeydown"
        />
      </div>
    </ScrollArea>
  </div>
</template>

<style scoped></style>
