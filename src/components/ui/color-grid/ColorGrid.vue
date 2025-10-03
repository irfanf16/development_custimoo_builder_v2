<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import type { OutputColor } from '@/services/products/types'

  interface Props {
    colors: OutputColor[]
    selectedColor?: string
    gridCols?: number
    buttonSize?: 'sm' | 'md' | 'lg'
    disabled?: boolean
  }

  interface Emits {
    (e: 'color-select', color: OutputColor): void
  }

  const props = withDefaults(defineProps<Props>(), {
    gridCols: 8,
    buttonSize: 'md',
    disabled: false,
    selectedColor: undefined
  })

  const emit = defineEmits<Emits>()

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const gridColsClasses: Record<number, string> = {
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    8: 'grid-cols-8',
    10: 'grid-cols-10',
    12: 'grid-cols-12'
  }

  function handleColorClick(color: OutputColor) {
    if (props.disabled) return
    emit('color-select', color)
  }
</script>

<template>
  <div :class="['grid gap-3', gridColsClasses[gridCols]]">
    <Button
      v-for="color in colors"
      :key="color.value"
      :class="[
        'relative rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-ring',
        sizeClasses[buttonSize],
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      ]"
      :style="{ background: color.value }"
      :disabled="disabled"
      @click="handleColorClick(color)"
    >
      <span
        v-if="selectedColor === color.value"
        class="absolute inset-0 rounded-full ring-2 ring-primary"
      />
    </Button>
  </div>
</template>
