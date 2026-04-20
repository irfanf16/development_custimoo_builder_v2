<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { computed } from 'vue'
  import { cn } from '@/lib/utils'
  import type { SkeletonRadius } from './skeletonTypes'
  import { skeletonDimension } from './skeletonUtils'

  const RADIUS_MAP: Record<SkeletonRadius, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full'
  }

  const props = withDefaults(
    defineProps<{
      class?: HTMLAttributes['class']
      /** CSS length or pixel number */
      width?: string | number
      /** CSS length or pixel number */
      height?: string | number
      radius?: SkeletonRadius
    }>(),
    {
      width: '100%',
      height: 16,
      radius: 'md'
    }
  )

  const boxStyle = computed(() => ({
    width: skeletonDimension(props.width),
    height: skeletonDimension(props.height)
  }))
</script>

<template>
  <div
    :class="
      cn(
        'relative isolate bg-gray-200 animate-pulse motion-reduce:animate-none',
        RADIUS_MAP[props.radius],
        props.class
      )
    "
    :style="boxStyle"
  />
</template>
