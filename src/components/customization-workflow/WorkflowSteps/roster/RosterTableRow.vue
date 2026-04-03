<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useDebounceFn } from '@vueuse/core'
  import { useField } from 'vee-validate'
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
  import { RadioGroupItem } from '@/components/ui/radio-group'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    roster_quantity_minimum_error,
    roster_remove_row,
    roster_table_name,
    roster_table_number,
    roster_table_quantity,
    roster_table_size,
    ui_aria_select_row
  } from '@/paraglide/messages'
  import type { RosterColumnKey } from './types'

  interface Props {
    entry: APCustomizationRosterEntry
    index: number
    sizeOptions: string[]
    showNameColumn: boolean
    showNumberColumn: boolean
    value: string
    minimumQuantity: number
    isSelected?: boolean
    canDelete?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isSelected: false,
    canDelete: true
  })

  const entryLocal = ref<APCustomizationRosterEntry>({ ...props.entry })

  const emit = defineEmits<{
    (e: 'update', index: number, payload: Partial<APCustomizationRosterEntry>): void
    (e: 'remove', index: number): void
    (e: 'select', index: number): void
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

  // Validation for quantity field using vee-validate
  const quantityFieldName = computed(() => `quantity-${props.index}`)
  const {
    value: quantityValue,
    errorMessage: quantityError,
    handleChange: handleQuantityChange,
    handleBlur: handleQuantityBlur
  } = useField(
    quantityFieldName,
    (value: number | string | null | undefined) => {
      if (value === null || value === undefined || value === '') {
        return true // Allow empty values, they'll be handled by required validation if needed
      }
      const numValue = typeof value === 'string' ? Number(value) : value
      if (isNaN(numValue)) {
        return true // Allow NaN during typing
      }
      if (numValue < props.minimumQuantity) {
        return roster_quantity_minimum_error(
          { minimum: props.minimumQuantity },
          { locale: locale.value }
        )
      }
      return true
    },
    {
      initialValue: props.entry.quantity ?? props.minimumQuantity
    }
  )

  watch(
    () => props.entry,
    newVal => {
      // Only update if the values actually differ to avoid unnecessary reactivity cycles
      if (
        newVal.text !== entryLocal.value.text ||
        newVal.number !== entryLocal.value.number ||
        newVal.size !== entryLocal.value.size ||
        newVal.quantity !== entryLocal.value.quantity ||
        newVal.information !== entryLocal.value.information
      ) {
        entryLocal.value = { ...newVal }
        // Sync quantity field value when entry changes
        if (newVal.quantity !== quantityValue.value) {
          quantityValue.value = newVal.quantity ?? props.minimumQuantity
        }
      }
    },
    { deep: true }
  )

  // Watch quantity field value changes and update local state, then debounce emit
  watch(quantityValue, newValue => {
    if (newValue === null || newValue === undefined) return
    const numValue = typeof newValue === 'string' ? Number(newValue) : newValue
    if (!isNaN(numValue) && typeof numValue === 'number') {
      entryLocal.value.quantity = numValue
      // Only emit if value is valid (no error)
      if (numValue >= props.minimumQuantity && !quantityError.value) {
        debouncedUpdateField('quantity', numValue)
      }
    }
  })

  // Immediate update function for local state (for responsive UI)
  function updateLocalField(field: keyof APCustomizationRosterEntry, value: string | number) {
    entryLocal.value = {
      ...entryLocal.value,
      [field]: value
    } as APCustomizationRosterEntry
  }

  // Debounced update function that emits to parent (saves to history)
  const debouncedUpdateField = useDebounceFn(
    (field: keyof APCustomizationRosterEntry, value: string | number) => {
      emit('update', props.index, {
        [field]: value
      } as Partial<APCustomizationRosterEntry>)
    },
    500
  )

  // Combined function that updates local state immediately and debounces the emit
  function updateField(field: keyof APCustomizationRosterEntry, value: string | number) {
    emit('select', props.index)
    // For quantity field, use vee-validate's handleChange for validation
    if (field === 'quantity') {
      const numValue = typeof value === 'string' ? Number(value) : value
      // Update vee-validate field (this will trigger validation)
      handleQuantityChange(numValue, false)
      return
    }
    // Update local state immediately for responsive UI
    updateLocalField(field, value)
    // Debounce the emit to parent (which will call async updateRow)
    debouncedUpdateField(field, value)
  }

  // Handle blur events to ensure value is saved immediately when user leaves the field
  function handleBlur(field: keyof APCustomizationRosterEntry, value: string | number) {
    // For quantity field, use vee-validate's handleBlur and validate
    if (field === 'quantity') {
      handleQuantityBlur()
      const numValue = typeof value === 'string' ? Number(value) : value
      // Cancel any pending debounced calls
      if ('cancel' in debouncedUpdateField && typeof debouncedUpdateField.cancel === 'function') {
        debouncedUpdateField.cancel()
      }
      // Only emit if value is valid
      if (!isNaN(numValue) && numValue >= props.minimumQuantity && !quantityError.value) {
        // Immediately emit the update
        emit('update', props.index, {
          [field]: numValue
        } as Partial<APCustomizationRosterEntry>)
      } else {
        // Reset to minimum quantity if invalid
        const minValue = props.minimumQuantity
        quantityValue.value = minValue
        entryLocal.value.quantity = minValue
        emit('update', props.index, {
          [field]: minValue
        } as Partial<APCustomizationRosterEntry>)
      }
      return
    }
    // Cancel any pending debounced calls if cancel method exists
    if ('cancel' in debouncedUpdateField && typeof debouncedUpdateField.cancel === 'function') {
      debouncedUpdateField.cancel()
    }
    // Immediately emit the update
    emit('update', props.index, {
      [field]: value
    } as Partial<APCustomizationRosterEntry>)
  }

  function handleKeydown(event: KeyboardEvent, column: RosterColumnKey) {
    emit('cell-keydown', { event, column, index: props.index })
  }

  function handleCellFocus() {
    emit('select', props.index)
  }

  function removeRow() {
    emit('remove', props.index)
  }

  const GRID_TEMPLATE_CLASS_MAP = {
    'true-true': {
      base: 'grid-cols-[16px_86px_44px_96px_40px_32px]',
      desktop: 'md:grid-cols-[16px_minmax(0,1fr)_44px_96px_40px_32px]'
    },
    'true-false': {
      base: 'grid-cols-[16px_86px_96px_40px_32px]',
      desktop: 'md:grid-cols-[16px_minmax(0,1fr)_96px_40px_32px]'
    },
    'false-true': {
      base: 'grid-cols-[16px_44px_96px_40px_32px]',
      desktop: 'md:grid-cols-[16px_44px_96px_40px_32px]'
    },
    'false-false': {
      base: 'grid-cols-[16px_96px_40px_32px]',
      desktop: 'md:grid-cols-[16px_96px_40px_32px]'
    }
  } as const

  const gridColumnWidthClass = computed(() => {
    const key =
      `${props.showNameColumn}-${props.showNumberColumn}` as keyof typeof GRID_TEMPLATE_CLASS_MAP
    const template = GRID_TEMPLATE_CLASS_MAP[key] ?? GRID_TEMPLATE_CLASS_MAP['false-false']
    return `${template.base} ${template.desktop}`
  })
  const deleteDisabled = computed(() => {
    // Disable delete if: it's the first row OR we can't delete
    return props.index === 0 || !props.canDelete
  })
</script>

<template>
  <div :class="['grid items-center gap-2 py-2', gridColumnWidthClass]">
    <RadioGroupItem
      :value="props.value"
      class="flex items-center justify-center"
      :aria-label="ui_aria_select_row({}, { locale })"
    />

    <Input
      v-if="showNameColumn"
      :model-value="entryLocal.text"
      :data-roster-cell="cellId('text')"
      class="h-10"
      :placeholder="roster_table_name({}, { locale })"
      @focus="handleCellFocus"
      @update:model-value="value => updateField('text', value as string)"
      @blur="(event: FocusEvent) => handleBlur('text', (event.target as HTMLInputElement).value)"
      @keydown.capture="(event: KeyboardEvent) => handleKeydown(event, 'text')"
    />

    <Input
      v-if="showNumberColumn"
      :model-value="entryLocal.number"
      :data-roster-cell="cellId('number')"
      class="h-10 text-center"
      inputmode="numeric"
      :placeholder="roster_table_number({}, { locale })"
      @focus="handleCellFocus"
      @update:model-value="value => updateField('number', value as string)"
      @blur="(event: FocusEvent) => handleBlur('number', (event.target as HTMLInputElement).value)"
      @keydown.capture="(event: KeyboardEvent) => handleKeydown(event, 'number')"
    />

    <Select
      :model-value="entryLocal.size"
      @update:model-value="value => updateField('size', value as string)"
    >
      <SelectTrigger
        :data-roster-cell="cellId('size')"
        class="h-10 w-full justify-between"
        @focus="handleCellFocus"
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

    <div class="flex flex-col gap-1">
      <Input
        :model-value="quantityValue ?? props.minimumQuantity"
        :data-roster-cell="cellId('quantity')"
        :class="[
          'h-10 text-right',
          quantityError ? 'border-destructive focus-visible:ring-destructive' : ''
        ]"
        :min="minimumQuantity"
        type="number"
        inputmode="numeric"
        :placeholder="roster_table_quantity({}, { locale })"
        :aria-invalid="!!quantityError"
        :aria-describedby="quantityError ? `quantity-error-${props.index}` : undefined"
        @focus="handleCellFocus"
        @update:model-value="value => updateField('quantity', Number(value))"
        @blur="
          (event: FocusEvent) =>
            handleBlur('quantity', Number((event.target as HTMLInputElement).value))
        "
        @keydown.capture="(event: KeyboardEvent) => handleKeydown(event, 'quantity')"
      />
      <p
        v-if="quantityError"
        :id="`quantity-error-${props.index}`"
        class="text-[0.8rem] font-medium text-destructive"
      >
        {{ quantityError }}
      </p>
    </div>

    <Button
      variant="ghost"
      size="icon"
      class="h-9 w-9 text-muted-foreground"
      :disabled="deleteDisabled"
      :title="props.index === 0 ? 'Cannot delete first row' : ''"
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
