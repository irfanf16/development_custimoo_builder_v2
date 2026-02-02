<script setup lang="ts">
  import { Search } from 'lucide-vue-next'
  import { InputGroup, InputGroupInput, InputGroupAddon } from '../input-group'
  import { cn } from '@/lib/utils'
  import { useVModel } from '@vueuse/core'
  import type { HTMLAttributes } from 'vue'
  import { ref, onMounted, onUnmounted, onUpdated, nextTick } from 'vue'
  import { useUIStore } from '@/stores/ui/ui.store'

  const props = defineProps<{
    placeholder: string
    modelValue: string
    class?: HTMLAttributes['class']
  }>()

  const emits = defineEmits<{
    (e: 'update:modelValue', payload: string | number): void
  }>()

  const modelValue = useVModel(props, 'modelValue', emits, {
    passive: true,
    defaultValue: ''
  })

  const uiStore = useUIStore()
  const inputGroupRef = ref<InstanceType<typeof InputGroup> | null>(null)
  const isInputFocused = ref(false)
  let restoreFocusTimeout: ReturnType<typeof requestAnimationFrame> | null = null

  function handleInputFocus() {
    isInputFocused.value = true
  }

  function handleInputBlur(e: FocusEvent) {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const relatedTargetDataSlot = relatedTarget?.getAttribute('data-slot')

    // Don't mark as unfocused if focus is moving to a scroll area viewport or dialog content
    if (
      relatedTargetDataSlot === 'scroll-area-viewport' ||
      (relatedTarget?.classList.contains('bg-background') && relatedTarget?.tagName === 'DIV')
    ) {
      // Use requestAnimationFrame for immediate restoration
      if (restoreFocusTimeout !== null) {
        cancelAnimationFrame(restoreFocusTimeout)
      }
      restoreFocusTimeout = requestAnimationFrame(() => {
        const inputEl = inputGroupRef.value?.$el?.querySelector('input') as HTMLInputElement | null
        if (inputEl && isInputFocused.value && document.activeElement !== inputEl) {
          // On mobile, use preventScroll to avoid scrolling issues with virtual keyboard
          try {
            inputEl.focus({ preventScroll: true })
          } catch {
            inputEl.focus()
          }
          // Also use a second RAF to ensure focus sticks
          requestAnimationFrame(() => {
            if (document.activeElement !== inputEl && isInputFocused.value) {
              try {
                inputEl.focus({ preventScroll: true })
              } catch {
                inputEl.focus()
              }
            }
          })
        }
        restoreFocusTimeout = null
      })
      return
    }

    isInputFocused.value = false
  }

  onUpdated(async () => {
    await nextTick()
    const inputElement = inputGroupRef.value?.$el?.querySelector('input') || null
    const isInputFocusedNow =
      document.activeElement === inputElement && inputElement?.tagName === 'INPUT'

    // Restore focus if it was lost during update
    if (isInputFocused.value && !isInputFocusedNow && inputElement) {
      if (restoreFocusTimeout !== null) {
        cancelAnimationFrame(restoreFocusTimeout)
      }
      restoreFocusTimeout = requestAnimationFrame(() => {
        const inputEl = inputGroupRef.value?.$el?.querySelector('input') as HTMLInputElement | null
        if (inputEl && isInputFocused.value) {
          const currentActive = document.activeElement as HTMLElement | null
          const isDialogContent =
            currentActive &&
            currentActive.classList.contains('bg-background') &&
            currentActive.tagName === 'DIV' &&
            currentActive.getAttribute('data-slot') === null

          if (isDialogContent || currentActive !== inputEl) {
            // On mobile, use preventScroll to avoid scrolling issues with virtual keyboard
            try {
              inputEl.focus({ preventScroll: true })
            } catch {
              inputEl.focus()
            }
            requestAnimationFrame(() => {
              if (document.activeElement !== inputEl && isInputFocused.value) {
                try {
                  inputEl.focus({ preventScroll: true })
                } catch {
                  inputEl.focus()
                }
              }
            })
          }
        }
        restoreFocusTimeout = null
      })
    }
  })

  // Set up focus guard to prevent DialogContent/ScrollArea from stealing focus
  let focusGuard: ((e?: FocusEvent) => void) | null = null
  let preventDialogContentFocus: ((e: Event) => void) | null = null

  onMounted(() => {
    const root = uiStore.widgetRoot || document
    const isMobile = uiStore.isMobile

    focusGuard = (e?: FocusEvent) => {
      if (isInputFocused.value) {
        const inputEl = inputGroupRef.value?.$el?.querySelector('input') as HTMLInputElement | null
        const activeElement = document.activeElement as HTMLElement | null

        if (inputEl && activeElement && activeElement !== inputEl) {
          const isDialogContent =
            activeElement.classList.contains('bg-background') &&
            activeElement.tagName === 'DIV' &&
            activeElement.getAttribute('data-slot') === null

          const isScrollArea =
            activeElement.getAttribute('data-slot') === 'scroll-area-viewport' ||
            activeElement.closest('[data-slot="scroll-area-viewport"]') !== null

          if (isDialogContent || isScrollArea) {
            if (e) {
              e.preventDefault()
              e.stopImmediatePropagation()
            }
            // On mobile, use a small delay to allow virtual keyboard to settle
            const delay = isMobile ? 50 : 0
            setTimeout(() => {
              requestAnimationFrame(() => {
                if (inputEl && isInputFocused.value && document.activeElement !== inputEl) {
                  // On iOS, use preventScroll to avoid scrolling issues with virtual keyboard
                  try {
                    inputEl.focus({ preventScroll: true })
                  } catch {
                    inputEl.focus()
                  }
                }
              })
            }, delay)
          }
        }
      }
    }

    // Listen for focusin events to catch focus theft
    root.addEventListener('focusin', focusGuard as EventListener, true)

    // Listen for both mousedown (desktop) and touchstart (mobile) to prevent focus changes
    preventDialogContentFocus = (e: Event) => {
      if (isInputFocused.value) {
        const target = e.target as HTMLElement | null
        if (
          target &&
          target.classList.contains('bg-background') &&
          target.tagName === 'DIV' &&
          target.getAttribute('data-slot') === null
        ) {
          e.preventDefault()
          const inputEl = inputGroupRef.value?.$el?.querySelector(
            'input'
          ) as HTMLInputElement | null
          if (inputEl) {
            // On mobile, use preventScroll to avoid scrolling issues
            try {
              inputEl.focus({ preventScroll: true })
            } catch {
              inputEl.focus()
            }
          }
        }
      }
    }

    // Add both mouse and touch event listeners for cross-platform support
    root.addEventListener('mousedown', preventDialogContentFocus, true)
    root.addEventListener('touchstart', preventDialogContentFocus, true)
  })

  onUnmounted(() => {
    if (restoreFocusTimeout) {
      cancelAnimationFrame(restoreFocusTimeout)
      restoreFocusTimeout = null
    }
    const root = uiStore.widgetRoot || document
    if (focusGuard) {
      root.removeEventListener('focusin', focusGuard as EventListener, true)
      focusGuard = null
    }
    if (preventDialogContentFocus) {
      root.removeEventListener('mousedown', preventDialogContentFocus, true)
      root.removeEventListener('touchstart', preventDialogContentFocus, true)
      preventDialogContentFocus = null
    }
  })
</script>

<template>
  <InputGroup ref="inputGroupRef" :class="props.class">
    <InputGroupInput
      :placeholder="props.placeholder"
      :model-value="modelValue"
      :class="cn('text-sm', props.class)"
      @update:model-value="(val: string | number) => emits('update:modelValue', val)"
      @focus="handleInputFocus"
      @blur="handleInputBlur"
    />
    <InputGroupAddon>
      <Search />
    </InputGroupAddon>
  </InputGroup>
</template>
