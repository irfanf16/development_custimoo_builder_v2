<script setup lang="ts">
  import type { TooltipContentEmits, TooltipContentProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import { reactiveOmit } from '@vueuse/core'
  import { computed } from 'vue'
  import { TooltipArrow, TooltipContent, TooltipPortal, useForwardPropsEmits } from 'reka-ui'
  import { cn } from '@/lib/utils'
  import { useUIStore } from '@/stores/ui/ui.store'

  defineOptions({
    inheritAttrs: false
  })

  const props = withDefaults(
    defineProps<TooltipContentProps & { class?: HTMLAttributes['class'] }>(),
    {
      sideOffset: 4,
      side: 'right',
      class: undefined
    }
  )

  const emits = defineEmits<TooltipContentEmits>()

  const delegatedProps = reactiveOmit(props, 'class')
  const forwarded = useForwardPropsEmits(delegatedProps, emits)

  const uiStore = useUIStore()

  const teleportTarget = computed<string | HTMLElement>(() => {
    const r = uiStore.widgetRoot
    return r && r.isConnected ? r : 'body'
  })
</script>

<template>
  <TooltipPortal :to="teleportTarget">
    <TooltipContent
      data-slot="tooltip-content"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-widget-tooltip-layer w-fit rounded-md px-3 py-1.5 text-xs text-balance',
          props.class
        )
      "
    >
      <slot />

      <TooltipArrow
        class="bg-primary fill-primary z-widget-tooltip-layer size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]"
      />
    </TooltipContent>
  </TooltipPortal>
</template>
