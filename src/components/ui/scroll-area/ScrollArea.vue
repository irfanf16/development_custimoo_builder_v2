<script setup lang="ts">
  import type { ScrollAreaRootProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui'
  import { cn } from '@/lib/utils'
  import ScrollBar from './ScrollBar.vue'
  import { computed } from 'vue'
  type Direction = 'vertical' | 'horizontal' | 'both'

  const props = withDefaults(
    defineProps<
      ScrollAreaRootProps & {
        class?: HTMLAttributes['class']
        direction?: Direction
      }
    >(),
    {
      type: 'scroll',
      class: undefined,
      direction: 'vertical'
    }
  )

  const delegatedProps = reactiveOmit(props, 'class', 'direction')

  const viewportClass = computed(() => {
    switch (props.direction) {
      case 'horizontal':
        return 'overflow-x-auto overflow-y-hidden'
      case 'vertical':
        return 'overflow-y-auto overflow-x-hidden'
      case 'both':
        return 'overflow-auto'
      default:
        return 'overflow-y-auto'
    }
  })
</script>

<template>
  <ScrollAreaRoot
    data-slot="scroll-area"
    v-bind="delegatedProps"
    :class="cn('relative', props.class)"
  >
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      :class="
        cn(
          'w-full h-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] overscroll-contain',
          viewportClass
        )
      "
    >
      <slot />
    </ScrollAreaViewport>

    <!-- Keep scrollbar mounted to avoid DOM childList mutations on hover/scroll.
         In Shadow DOM, Reka's FocusScope may treat such mutations as "focused node removed"
         and focus the dialog container, which blurs inputs. -->
    <ScrollBar v-if="props.direction !== 'both'" :orientation="props.direction" force-mount />

    <!-- If both, show both scrollbars -->
    <template v-else>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
    </template>

    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
