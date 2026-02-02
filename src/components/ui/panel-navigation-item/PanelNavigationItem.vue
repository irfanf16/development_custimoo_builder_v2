<script setup lang="ts">
  import { ChevronRight } from 'lucide-vue-next'
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'
  const props = defineProps<{
    id: string | number
    class?: HTMLAttributes['class']
  }>()
</script>

<template>
  <button
    :id="id.toString()"
    data-slot="panel-navigation-item"
    :class="
      cn(
        'h-14 px-4 md:px-6 rounded-md justify-between flex items-center hover:bg-muted/50 transition-colors',
        props.class
      )
    "
  >
    <slot name="content" />
    <ChevronRight class="size-4 text-muted-foreground" />
  </button>
</template>
