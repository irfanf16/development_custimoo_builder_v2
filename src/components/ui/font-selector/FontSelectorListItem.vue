<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import type { FontOption } from './types'
  import { cn } from '@/lib/utils'

  const props = defineProps<{
    option: FontOption
    selected?: boolean
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <div
    :class="
      cn(
        'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
        selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/70',
        props.class
      )
    "
  >
    <span class="flex-1 truncate">{{ option.label }}</span>
    <span
      v-if="option.preview"
      class="truncate text-muted-foreground text-sm"
      :style="{ fontFamily: option.preview }"
    >
      {{ option.label }}
    </span>
  </div>
</template>
