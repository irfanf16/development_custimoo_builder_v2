<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import type { ColorSelectorVariants } from '../color-selector'
  import { ColorSelector } from '../color-selector'
  import { cn } from '@/lib/utils'

  const props = withDefaults(
    defineProps<{
      size?: ColorSelectorVariants['size']
      class?: HTMLAttributes['class']
      colors: string[]
      maxColors?: number
    }>(),
    {
      size: 'default',
      class: undefined,
      maxColors: 4
    }
  )
</script>

<template>
  <div :class="cn('flex items-center', props.class)">
    <ColorSelector
      v-for="(color, idx) in props.colors.slice(0, props.maxColors)"
      :key="idx"
      :color="color"
      :size="props.size"
      :class="[idx > 0 ? '-ml-5' : '']"
      :disabled="true"
    />
  </div>
</template>
