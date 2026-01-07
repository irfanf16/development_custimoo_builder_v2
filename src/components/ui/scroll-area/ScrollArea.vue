<script setup lang="ts">
  import type { ScrollAreaRootProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui'
  import { cn } from '@/lib/utils'
  import ScrollBar from './ScrollBar.vue'

  // Default to `scroll` (not `hover`) so scrollbars can appear on mobile (no hover),
  // without forcing them to always show.
  const props = withDefaults(
    defineProps<ScrollAreaRootProps & { class?: HTMLAttributes['class'] }>(),
    {
      type: 'scroll',
      class: undefined
    }
  )

  const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    v-bind="delegatedProps"
    :class="cn('relative', props.class)"
  >
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      class="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
    >
      <slot />
    </ScrollAreaViewport>
    <!-- Keep scrollbar mounted to avoid DOM childList mutations on hover/scroll.
         In Shadow DOM, Reka's FocusScope may treat such mutations as "focused node removed"
         and focus the dialog container, which blurs inputs. -->
    <ScrollBar force-mount />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
