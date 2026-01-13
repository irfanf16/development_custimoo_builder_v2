<script lang="ts" setup>
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'
  import { Input } from '../input'

  const props = defineProps<{
    class?: HTMLAttributes['class']
  }>()

  const emits = defineEmits<{
    (e: 'focus', event: FocusEvent): void
    (e: 'blur', event: FocusEvent): void
  }>()

  function handleFocus(e: FocusEvent) {
    emits('focus', e)
  }

  function handleBlur(e: FocusEvent) {
    emits('blur', e)
  }
</script>

<template>
  <Input
    data-slot="input-group-control"
    :class="
      cn(
        'flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent',
        props.class
      )
    "
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>
