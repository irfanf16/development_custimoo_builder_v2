<script setup lang="ts">
  import { computed } from 'vue'
  import type { APCustomizationRosterEntry } from '@/services/products/types'
  import RosterTableRow from './RosterTableRow.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    roster_table_name,
    roster_table_number,
    roster_table_quantity,
    roster_table_size
  } from '@/paraglide/messages'
  import type { RosterColumnKey } from './types'
  import { RadioGroup } from '@/components/ui/radio-group'

  interface Props {
    entries: APCustomizationRosterEntry[]
    sizeOptions: string[]
    showNameColumn: boolean
    showNumberColumn: boolean
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:entry', index: number, payload: Partial<APCustomizationRosterEntry>): void
    (e: 'remove', index: number): void
  }>()

  const selectedRowIndexModel = defineModel<number | null>('selectedRowIndex', {
    default: null
  })

  const radioGroupValue = computed<string | undefined>({
    get: () =>
      selectedRowIndexModel.value != null ? String(selectedRowIndexModel.value) : undefined,
    set: value => {
      selectedRowIndexModel.value = value != null ? Number(value) : null
    }
  })

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

  const GRID_TEMPLATE_CLASS_MAP = {
    'true-true': {
      base: 'grid-cols-[16px_86px_44px_96px_40px_16px]',
      desktop: 'md:grid-cols-[16px_minmax(0,1fr)_44px_96px_40px_32px]'
    },
    'true-false': {
      base: 'grid-cols-[16px_86px_96px_40px_16px]',
      desktop: 'md:grid-cols-[16px_minmax(0,1fr)_96px_40px_32px]'
    },
    'false-true': {
      base: 'grid-cols-[16px_44px_96px_40px_16px]',
      desktop: 'md:grid-cols-[16px_44px_96px_40px_32px]'
    },
    'false-false': {
      base: 'grid-cols-[16px_96px_40px_16px]',
      desktop: 'md:grid-cols-[16px_96px_40px_32px]'
    }
  } as const

  const gridColumnWidthClass = computed(() => {
    const key =
      `${props.showNameColumn}-${props.showNumberColumn}` as keyof typeof GRID_TEMPLATE_CLASS_MAP
    const template = GRID_TEMPLATE_CLASS_MAP[key] ?? GRID_TEMPLATE_CLASS_MAP['false-false']
    return `${template.base} ${template.desktop}`
  })
  function handleSelectRow(index: number) {
    selectedRowIndexModel.value = index
  }
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      :class="[
        'grid items-center gap-2 text-xs font-medium text-muted-foreground',
        gridColumnWidthClass
      ]"
    >
      <span aria-hidden="true" class="justify-self-center" />
      <span v-if="showNameColumn">{{ roster_table_name({}, { locale }) }}</span>
      <span v-if="showNumberColumn" class="text-left">{{
        roster_table_number({}, { locale })
      }}</span>
      <span class="text-left">{{ roster_table_size({}, { locale }) }}</span>
      <span class="text-left">{{ roster_table_quantity({}, { locale }) }}</span>
      <span aria-hidden="true" class="justify-self-center" />
    </div>
    <RadioGroup v-model="radioGroupValue" class="flex flex-col gap-1">
      <RosterTableRow
        v-for="(entry, index) in entries"
        :key="`roster-row-${index}`"
        :entry="entry"
        :index="index"
        :size-options="sizeOptions"
        :show-name-column="showNameColumn"
        :show-number-column="showNumberColumn"
        :value="String(index)"
        :minimum-quantity="1"
        :is-selected="selectedRowIndexModel === index"
        @update="handleUpdate"
        @remove="handleRemove"
        @cell-keydown="handleCellKeydown"
        @select="handleSelectRow"
      />
    </RadioGroup>
  </div>
</template>

<style scoped></style>
