<script setup lang="ts">
  import { computed } from 'vue'
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

  /**
   * Normalize color to hex format for comparison
   * Handles hex (with/without #), rgb(), and rgba() formats
   */
  function normalizeColor(color: string | undefined): string {
    if (!color) return ''

    const trimmed = color.trim()

    // If it's already hex format (with or without #)
    if (/^#?[0-9A-Fa-f]{6}$/.test(trimmed)) {
      const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
      return hex.toLowerCase()
    }

    // If it's RGB or RGBA format
    const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1] || '0', 10)
      const g = parseInt(rgbMatch[2] || '0', 10)
      const b = parseInt(rgbMatch[3] || '0', 10)

      const toHex = (n: number) => {
        const hex = Math.max(0, Math.min(255, n)).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }

    // Return as-is if format is not recognized
    return trimmed.toLowerCase()
  }

  const normalizedSelectedColor = computed(() => normalizeColor(props.selectedColor))

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
      :selected="normalizedSelectedColor === normalizeColor(color.value)"
      @click.stop="handleColorClick(color)"
    />
  </div>
</template>
