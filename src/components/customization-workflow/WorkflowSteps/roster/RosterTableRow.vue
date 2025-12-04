<script setup lang="ts">
  import { computed } from 'vue'
  import type { APCustomizationRosterEntry } from '@/services/products/types'
  import { Trash2 } from 'lucide-vue-next'
  import { Input } from '@/components/ui/input'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@/components/ui/select'
  import { Button } from '@/components/ui/button'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    roster_remove_row,
    roster_table_name,
    roster_table_number,
    roster_table_quantity,
    roster_table_size
  } from '@/paraglide/messages'
  import type { RosterColumnKey } from './types'

  interface Props {
    entry: APCustomizationRosterEntry
    index: number
    sizeOptions: string[]
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update', index: number, payload: Partial<APCustomizationRosterEntry>): void
    (e: 'remove', index: number): void
    (
      e: 'cell-keydown',
      payload: { event: KeyboardEvent; column: RosterColumnKey; index: number }
    ): void
  }>()

  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const normalizedSizes = computed(() => {
    const set = new Set(props.sizeOptions.filter(Boolean))
    if (props.entry.size?.trim()) {
      set.add(props.entry.size.trim())
    }
    return Array.from(set)
  })

  const cellId = (column: RosterColumnKey) => `roster-cell-${props.index}-${column}`

  function updateField(field: keyof APCustomizationRosterEntry, value: string | number) {
    emit('update', props.index, {
      [field]: value
    } as Partial<APCustomizationRosterEntry>)
  }

  function handleKeydown(event: KeyboardEvent, column: RosterColumnKey) {
    emit('cell-keydown', { event, column, index: props.index })
  }

  function removeRow() {
    emit('remove', props.index)
  }
</script>

<template>
  <div
    class="grid grid-cols-[16px_86px_44px_96px_40px_32px] md:grid-cols-[16px_minmax(0,1fr)_44px_96px_40px_32px] items-center gap-2 py-2"
  >
    <button
      type="button"
      class="flex items-center justify-center text-muted-foreground"
      aria-label="Select row"
    >
      <span class="flex size-4 items-center justify-center rounded-full border border-input">
        <span class="size-2 rounded-full bg-foreground" />
      </span>
    </button>

    <Input
      :model-value="entry.text"
      :data-roster-cell="cellId('text')"
      class="h-10"
      :placeholder="roster_table_name({}, { locale })"
      @update:model-value="value => updateField('text', value as string)"
      @keydown.capture="(event: KeyboardEvent) => handleKeydown(event, 'text')"
    />

    <Input
      :model-value="entry.number"
      :data-roster-cell="cellId('number')"
      class="h-10 text-center"
      inputmode="numeric"
      :placeholder="roster_table_number({}, { locale })"
      @update:model-value="value => updateField('number', value as string)"
      @keydown.capture="(event: KeyboardEvent) => handleKeydown(event, 'number')"
    />

    <Select
      :model-value="entry.size"
      @update:model-value="value => updateField('size', value as string)"
    >
      <SelectTrigger
        :data-roster-cell="cellId('size')"
        class="h-10 w-full justify-between"
        @keydown.capture="(event: KeyboardEvent) => handleKeydown(event, 'size')"
      >
        <SelectValue :placeholder="roster_table_size({}, { locale })" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in normalizedSizes" :key="option" :value="option">
          {{ option }}
        </SelectItem>
      </SelectContent>
    </Select>

    <Input
      :model-value="entry.quantity"
      :data-roster-cell="cellId('quantity')"
      class="h-10 text-right"
      min="1"
      type="number"
      inputmode="numeric"
      :placeholder="roster_table_quantity({}, { locale })"
      @update:model-value="value => updateField('quantity', Number(value))"
      @keydown.capture="(event: KeyboardEvent) => handleKeydown(event, 'quantity')"
    />

    <Button
      variant="ghost"
      size="icon"
      class="h-9 w-9 text-muted-foreground"
      :aria-label="roster_remove_row({}, { locale })"
      @click="removeRow"
    >
      <Trash2 class="size-4" aria-hidden="true" />
    </Button>
  </div>
</template>

<style scoped>
  .quantity-input {
    /* Hide spinner arrows in Firefox */
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .quantity-input::-webkit-outer-spin-button,
  .quantity-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }
</style>
