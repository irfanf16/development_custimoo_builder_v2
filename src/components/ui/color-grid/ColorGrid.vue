<script setup lang="ts">
  import { computed } from 'vue'
  import type { HTMLAttributes } from 'vue'
  import { ColorSelector } from '../color-selector'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip'
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
   * Handles #RGB, #RRGGBB, #RRGGBBAA, bare hex, rgb()/rgba()
   */
  function normalizeColor(color: string | undefined): string {
    if (!color) return ''

    const trimmed = color.trim()

    const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
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

    let hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
    if (/^[0-9A-Fa-f]{3}$/i.test(hex)) {
      hex = hex
        .split('')
        .map(c => c + c)
        .join('')
    } else if (/^[0-9A-Fa-f]{8}$/i.test(hex)) {
      hex = hex.slice(0, 6)
    }
    if (/^[0-9A-Fa-f]{6}$/i.test(hex)) {
      return `#${hex.toLowerCase()}`
    }

    return trimmed.toLowerCase()
  }

  const normalizedSelectedColor = computed(() => normalizeColor(props.selectedColor))

  function handleColorClick(color: OutputColor) {
    if (props.disabled) return
    emit('color-select', color)
  }
</script>

<template>
  <TooltipProvider>
    <div :class="cn('grid gap-2 grid-cols-6 md:grid-cols-8', props.class)">
      <Tooltip v-for="color in colors" :key="color.value">
        <TooltipTrigger as-child>
          <ColorSelector
            :color="color.value"
            :disabled="props.disabled"
            :selected="normalizedSelectedColor === normalizeColor(color.value)"
            @click.stop="handleColorClick(color)"
          />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{{ color.name }}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
</template>
