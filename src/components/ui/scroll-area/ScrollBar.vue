<script setup lang="ts">
  import type { ScrollAreaScrollbarProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { ScrollAreaScrollbar, ScrollAreaThumb } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = withDefaults(
    defineProps<ScrollAreaScrollbarProps & { class?: HTMLAttributes['class'] }>(),
    {
      orientation: 'vertical'
    }
  )

  const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <ScrollAreaScrollbar
    data-slot="scroll-area-scrollbar"
    v-bind="delegatedProps"
    :class="
      cn(
        // Keep visible by default (we hide native scrollbars in the viewport via Reka).
        // z-20 ensures it renders above complex tab/list layouts.
        'flex touch-none p-px transition-colors select-none z-20 bg-muted/30 hover:bg-muted/40',
        orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
        props.class
      )
    "
  >
    <ScrollAreaThumb
      data-slot="scroll-area-thumb"
      class="relative flex-1 rounded-full bg-primary/80"
    />
  </ScrollAreaScrollbar>
</template>
