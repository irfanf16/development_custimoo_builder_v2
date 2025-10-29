<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { Check, Search } from 'lucide-vue-next'
  import { cn } from '@/lib/utils'
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@/components/ui/select'
  import { Input } from '@/components/ui/input'
  import { ScrollArea } from '@/components/ui/scroll-area'

  import type { FontOption } from './types'

  const props = withDefaults(
    defineProps<{
      /** v-model value */
      modelValue?: string | null
      /** full list of options */
      options: FontOption[]
      /** optional label node */
      label?: string
      /** custom classes for root wrapper */
      class?: HTMLAttributes['class']
      /** optional placeholder when nothing selected */
      placeholder?: string
      /** filter placeholder */
      searchPlaceholder?: string
      /** whether to show visual preview (default true) */
      showPreview?: boolean
      /** height limit for dropdown */
      maxHeight?: number
      /** disable selection */
      disabled?: boolean
    }>(),
    {
      modelValue: null,
      label: undefined,
      class: undefined,
      placeholder: 'Select font…',
      searchPlaceholder: 'Search fonts…',
      showPreview: true,
      maxHeight: 280,
      disabled: false
    }
  )

  const emits = defineEmits<{
    'update:modelValue': [value: string | null]
    change: [value: string | null]
  }>()

  const search = ref('')

  const delegated = reactiveOmit(
    props,
    'modelValue',
    'options',
    'label',
    'class',
    'placeholder',
    'searchPlaceholder',
    'showPreview',
    'maxHeight',
    'disabled'
  )

  const filteredOptions = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return props.options
    return props.options.filter(opt => opt.label.toLowerCase().includes(term))
  })

  // Handle value updates from Select component - accepts any type and converts to string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleUpdate(value: any) {
    const stringValue = value != null ? String(value) : null
    emits('update:modelValue', stringValue)
    emits('change', stringValue)
  }

  watch(
    () => props.modelValue,
    val => {
      if (val && !props.options.some(opt => opt.value === val)) {
        emits('update:modelValue', null)
      }
    }
  )

  const selectedOption = computed(
    () => props.options.find(opt => opt.value === props.modelValue) || null
  )

  // Track loaded fonts
  const loadedFonts = new Set<string>()

  // Function to load a font dynamically
  function loadFont(option: FontOption) {
    if (!option.fontUrl || !option.fontFamily || loadedFonts.has(option.fontFamily)) {
      return
    }

    // Create @font-face style
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: '${option.fontFamily}';
        src: url('${option.fontUrl}') format('truetype');
        font-display: swap;
      }
    `
    document.head.appendChild(style)
    loadedFonts.add(option.fontFamily)
  }

  // Load fonts for all options
  watch(
    () => props.options,
    options => {
      options.forEach(option => {
        if (option.fontUrl && option.fontFamily) {
          loadFont(option)
        }
      })
    },
    { immediate: true }
  )

  // Cleanup: remove all injected styles on unmount
  onBeforeUnmount(() => {
    loadedFonts.clear()
  })
</script>

<template>
  <div :class="cn('flex flex-col gap-3', props.class)">
    <label v-if="label" class="text-sm font-medium text-foreground">{{ label }}</label>

    <Select
      :model-value="props.modelValue ?? undefined"
      :disabled="props.disabled"
      v-bind="delegated"
      @update:model-value="handleUpdate"
    >
      <SelectTrigger class="w-full justify-between">
        <SelectValue :placeholder="placeholder">
          <div class="flex items-center gap-2">
            <span
              v-if="selectedOption && showPreview"
              class="text-sm"
              :style="
                selectedOption.fontFamily || selectedOption.preview
                  ? { fontFamily: selectedOption.fontFamily || selectedOption.preview }
                  : undefined
              "
            >
              {{ selectedOption.label }}
            </span>
            <span v-else>{{ selectedOption?.label ?? placeholder }}</span>
          </div>
        </SelectValue>
      </SelectTrigger>

      <SelectContent class="w-[--radix-select-trigger-width] min-w-[220px]">
        <div class="p-2">
          <div class="relative">
            <Search
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input v-model="search" :placeholder="searchPlaceholder" class="pl-9" type="search" />
          </div>
        </div>

        <ScrollArea :style="{ maxHeight: `${maxHeight}px` }">
          <SelectGroup>
            <div
              v-if="!filteredOptions.length"
              class="px-3 py-6 text-center text-sm text-muted-foreground"
            >
              No fonts found
            </div>

            <SelectItem
              v-for="opt in filteredOptions"
              :key="opt.value"
              :value="opt.value"
              class="gap-3"
            >
              <span
                class="flex-1 truncate text-lg"
                :style="
                  opt.fontFamily || opt.preview
                    ? { fontFamily: opt.fontFamily || opt.preview }
                    : undefined
                "
              >
                {{ opt.label }}
              </span>
              <Check
                class="ml-auto hidden size-4 text-primary group-data-[state=checked]/select-item:flex"
              />
            </SelectItem>
          </SelectGroup>
        </ScrollArea>
      </SelectContent>
    </Select>
  </div>
</template>
