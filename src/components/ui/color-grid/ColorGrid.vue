<script setup lang="ts">
  import type { HTMLAttributes } from 'vue'
  import { ColorSelector } from '../color-selector'
  import { cn } from '@/lib/utils'

  type OutputColor = {
    position: number
    name: string
    value: string
  }

  const props = withDefaults(
    defineProps<{
      colors: OutputColor[]
      class?: HTMLAttributes['class']
      selectedColor?: string
      disabled?: boolean
    }>(),
    {
      class: undefined,
      disabled: false,
      selectedColor: undefined
    }
  )

  interface Emits {
    (e: 'color-select', color: OutputColor): void
  }

  const emit = defineEmits<Emits>()

  function handleColorClick(color: OutputColor) {
    if (props.disabled) return
    emit('color-select', color)
  }
</script>

<template>
  <div :class="cn('grid gap-2 grid-cols-6 md:grid-cols-8', props.class)">
    <ColorSelector
      v-for="color in colors"
      :key="color.value"
      :color="color.value"
      :disabled="props.disabled"
      :selected="props.selectedColor === color.value"
      @click.stop="handleColorClick(color)"
    />
  </div>
</template>
