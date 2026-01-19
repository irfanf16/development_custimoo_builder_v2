<script setup lang="ts">
  import type { ScrollAreaScrollbarProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { ScrollAreaScrollbar, ScrollAreaThumb } from 'reka-ui'
  import { cn } from '@/lib/utils'

  const props = withDefaults(
    defineProps<ScrollAreaScrollbarProps & { class?: HTMLAttributes['class'] }>(),
    {
      orientation: 'vertical',
      class: undefined
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
        // Visible while scrolling (ScrollArea default is `type=scroll`); stays mounted to avoid focus issues.
        // We toggle opacity via Reka's `data-state` attribute.
        'flex touch-none p-px transition-opacity select-none data-[state=hidden]:opacity-0 data-[state=hidden]:pointer-events-none data-[state=visible]:opacity-100',
        orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
        orientation === 'horizontal' && 'h-2 flex-col border-t border-t-transparent',
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
