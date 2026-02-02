<script setup lang="ts">
  import { ref, watch, computed, onMounted, onUnmounted, nextTick, type HTMLAttributes } from 'vue'
  import { Input } from '@/components/ui/input'
  import { cn } from '@/lib/utils'
  import { useTeleportTo } from '@/composables/useTeleportTo'
  import { ChevronDown } from 'lucide-vue-next'
  import Button from '../button/Button.vue'

  export interface AutocompleteItem {
    label: string
    value: string
    extras?: Record<string, unknown>
  }

  interface Props {
    modelValue?: string
    items?: AutocompleteItem[]
    placeholder?: string
    disabled?: boolean
    maxSuggestions?: number
    class?: HTMLAttributes['class']
    emptyMessage?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: undefined,
    items: () => [],
    placeholder: undefined,
    disabled: false,
    maxSuggestions: 10,
    class: undefined,
    emptyMessage: 'No results found'
  })

  const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void
    (e: 'select', item: AutocompleteItem): void
  }>()

  const inputValue = ref(props.modelValue ?? '')
  const open = ref(false)
  const highlighted = ref(-1)
  const listRef = ref<HTMLElement | null>(null)
  const rootRef = ref<HTMLElement | null>(null)
  const dropdownStyle = ref<Record<string, string>>({})

  const { teleportTo } = useTeleportTo()

  // Watch for open state changes to update position
  watch(open, isOpen => {
    if (isOpen) {
      // Wait for both input and list to be available
      const tryUpdate = () => {
        const rootEl = rootRef.value
        const listEl = listRef.value
        const inputEl = rootEl?.querySelector('input[data-slot="autocomplete-input"]')

        if (inputEl && listEl) {
          updatePosition()
        } else {
          // Retry with requestAnimationFrame if elements aren't ready
          requestAnimationFrame(() => {
            const rootEl2 = rootRef.value
            const listEl2 = listRef.value
            const inputEl2 = rootEl2?.querySelector('input[data-slot="autocomplete-input"]')

            if (inputEl2 && listEl2) {
              updatePosition()
            } else {
              // Final retry with nextTick
              nextTick(() => {
                const rootEl3 = rootRef.value
                const listEl3 = listRef.value
                const inputEl3 = rootEl3?.querySelector('input[data-slot="autocomplete-input"]')

                if (inputEl3 && listEl3) {
                  updatePosition()
                }
              })
            }
          })
        }
      }
      nextTick(tryUpdate)
    }
  })

  // Watch for listRef to be available and update position
  watch(listRef, newRef => {
    if (newRef && open.value && rootRef.value) {
      const inputEl = rootRef.value.querySelector('input[data-slot="autocomplete-input"]')
      if (inputEl) {
        updatePosition()
      }
    }
  })

  watch(
    () => props.modelValue,
    v => {
      if (v !== inputValue.value) inputValue.value = v ?? ''
    }
  )

  watch(inputValue, v => {
    emit('update:modelValue', v)
  })

  const filtered = computed(() => {
    const q = (inputValue.value || '').trim().toLowerCase()
    // support passing a computed/ref or a plain array for `items`
    const rawPropsItems = props.items as unknown
    const itemsArray: AutocompleteItem[] =
      rawPropsItems && (rawPropsItems as { value?: AutocompleteItem[] }).value !== undefined
        ? (rawPropsItems as { value: AutocompleteItem[] }).value
        : (props.items as AutocompleteItem[]) || []
    if (!q) return (itemsArray || []).slice(0, props.maxSuggestions)
    return (
      (itemsArray || []).filter(i => {
        const label = String(i.label || '').toLowerCase()
        const value = String(i.value || '').toLowerCase()
        return label.includes(q) || value.includes(q) || value.replace('#', '').includes(q)
      }) || []
    ).slice(0, props.maxSuggestions)
  })

  function onInput(e: Event) {
    inputValue.value = (e.target as HTMLInputElement).value
    const hasQuery = (inputValue.value || '').trim().length > 0
    open.value = hasQuery || filtered.value.length > 0
    highlighted.value = -1
    // Position will be updated by the watch on open
  }

  function onFocus() {
    const hasQuery = (inputValue.value || '').trim().length > 0
    open.value = hasQuery || filtered.value.length > 0
    // Position will be updated by the watch on open
  }

  function close() {
    open.value = false
    highlighted.value = -1
  }

  function select(item: AutocompleteItem) {
    inputValue.value = item.label || item.value
    emit('select', item)
    close()
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      open.value = filtered.value.length > 0
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      highlighted.value = Math.min(highlighted.value + 1, filtered.value.length - 1)
      scrollToHighlighted()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      highlighted.value = Math.max(highlighted.value - 1, 0)
      scrollToHighlighted()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered.value[highlighted.value]
      if (item) select(item)
    } else if (e.key === 'Escape') {
      close()
    }
  }

  function scrollToHighlighted() {
    if (!listRef.value) return
    const el = listRef.value.children[highlighted.value] as HTMLElement | undefined
    if (el) el.scrollIntoView({ block: 'nearest' })
  }

  // click outside to close
  onMounted(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return

      const rootEl = rootRef.value
      const listEl = listRef.value

      // If click started inside input or dropdown → ignore
      if (rootEl?.contains(target)) return
      if (listEl?.contains(target)) return

      close()
    }
    document.addEventListener('mousedown', onDocMouseDown)

    onUnmounted(() => document.removeEventListener('mousedown', onDocMouseDown))
    // reposition on scroll/resize so teleport dropdown stays aligned
    const onScrollResize = () => {
      if (open.value) updatePosition()
    }
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
    onUnmounted(() => {
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
    })
  })

  function updatePosition() {
    // compute bounding rect of input and set dropdown style for Teleport
    // Use fixed positioning when teleported to work correctly in shadow DOM
    if (!open.value) return

    // Get the actual input element - Input component doesn't expose ref, so we need to find it
    const rootEl = rootRef.value
    const listEl = listRef.value

    if (!rootEl || !listEl) {
      // If elements aren't ready, try again on next frame
      requestAnimationFrame(() => {
        updatePosition()
      })
      return
    }

    // Find the actual input element within the root
    const inputEl = rootEl.querySelector(
      'input[data-slot="autocomplete-input"]'
    ) as HTMLInputElement | null

    if (!inputEl) {
      // If input element not found, try again
      requestAnimationFrame(() => {
        updatePosition()
      })
      return
    }

    // Check if getBoundingClientRect is available
    if (typeof inputEl.getBoundingClientRect !== 'function') {
      return
    }

    try {
      const rect = inputEl.getBoundingClientRect()
      const top = rect.bottom + 4 // Add small gap
      let left = rect.left
      let width = rect.width

      // Try to constrain dropdown to parent container width so it doesn't overflow
      const wrapper = rootRef.value
      const parentEl = wrapper?.parentElement
      if (parentEl && typeof parentEl.getBoundingClientRect === 'function') {
        const pRect = parentEl.getBoundingClientRect()
        const pLeft = pRect.left
        const pRight = pLeft + pRect.width
        // ensure width does not exceed parent width
        width = Math.min(width, pRect.width)
        // adjust left to stay within parent bounds
        if (left + width > pRight) left = Math.max(pLeft, pRight - width)
        if (left < pLeft) left = pLeft
      }

      // Create a new object to ensure reactivity
      const newStyle: Record<string, string> = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxWidth:
          parentEl && typeof parentEl.getBoundingClientRect === 'function'
            ? `${parentEl.getBoundingClientRect().width}px`
            : `${width}px`,
        zIndex: '9999'
      }

      dropdownStyle.value = newStyle

      // Also apply directly to the element (for teleported elements)
      Object.assign(listEl.style, newStyle)
    } catch (error) {
      // Silently fail if there's an error accessing bounding rect
      console.warn('Autocomplete: Failed to update position', error)
    }
  }
  function toggleDropdown() {
    if (props.disabled) return

    open.value = !open.value
    highlighted.value = -1

    if (open.value) {
      nextTick(updatePosition)
    }
  }
</script>

<template>
  <div ref="rootRef" :class="cn('relative', props.class)" @keydown="onKeydown">
    <Input
      v-model="inputValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      data-slot="autocomplete-input"
      @input="onInput"
      @focus="onFocus"
    />
    <Teleport :to="teleportTo">
      <ul
        v-if="open"
        ref="listRef"
        :style="dropdownStyle"
        data-slot="autocomplete-list"
        :class="
          cn(
            'bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-auto z-50 min-w-32'
          )
        "
        role="listbox"
      >
        <template v-if="filtered.length > 0">
          <li
            v-for="(item, idx) in filtered"
            :key="`${item.value}-${idx}`"
            :class="
              cn(
                'cursor-pointer flex items-center gap-2 px-2 py-1.5 text-sm outline-hidden select-none',
                highlighted === idx && 'bg-accent/30 focus:bg-accent focus:text-accent-foreground'
              )
            "
            role="option"
            :aria-selected="highlighted === idx"
            @mousedown.prevent="select(item)"
            @mouseenter="highlighted = idx"
          >
            <slot name="option" :item="item" :index="idx" :highlighted="highlighted === idx">
              <!-- Default option rendering - can be customized via slot -->
              <div class="text-sm min-w-0 flex-1">
                <div class="font-medium truncate">{{ item.label }}</div>
                <div
                  v-if="item.value && item.value !== item.label"
                  class="text-xs text-muted-foreground truncate"
                >
                  {{ item.value }}
                </div>
              </div>
            </slot>
          </li>
        </template>
        <template v-else>
          <li
            :class="cn('flex items-center gap-2 px-2 py-1.5 opacity-70 cursor-not-allowed')"
            aria-disabled="true"
          >
            <div class="text-sm text-muted-foreground">{{ props.emptyMessage }}</div>
          </li>
        </template>
      </ul>
    </Teleport>
    <Button
      variant="outline"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-transparent p-0 w-4 h-4"
      @mousedown.prevent
      @click="toggleDropdown"
    >
      <ChevronDown class="size-4" />
    </Button>
  </div>
</template>

<style scoped></style>
