<script setup lang="ts">
  import { cn } from '@/lib/utils'
  import { reactiveOmit } from '@vueuse/core'
  import type { HTMLAttributes } from 'vue'

  interface DotSeparatorProps {
    class?: HTMLAttributes['class']
  }

  const props = defineProps<DotSeparatorProps>()

  const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <span
    data-slot="dot-separator"
    v-bind="delegatedProps"
    :class="
      cn(
        'inline-block align-middle select-none',
        'w-1 h-1 rounded-full bg-foreground',
        'mx-2',
        props.class
      )
    "
  ></span>
</template>
