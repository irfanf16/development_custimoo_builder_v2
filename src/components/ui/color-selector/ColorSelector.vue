<script setup lang="ts">
  import type { PrimitiveProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import type { ColorSelectorVariants } from '.'
  import { Primitive } from 'reka-ui'
  import { cn } from '@/lib/utils'
  import { colorSelectorVariants } from '.'
  import { computed } from 'vue'

  interface Props extends PrimitiveProps {
    size?: ColorSelectorVariants['size']
    class?: HTMLAttributes['class']
    color?: string
    selected?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    as: 'button',
    color: 'rgb(0 0 0)',
    class: undefined,
    size: 'default',
    selected: false
  })

  const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
    (e: 'focus', event: FocusEvent): void
    (e: 'blur', event: FocusEvent): void
  }>()

  // Detects if the color is a gradient
  const isGradient = computed(() => {
    const color = props.color?.trim() ?? ''
    return (
      color.startsWith('linear-gradient') ||
      color.startsWith('radial-gradient') ||
      color.startsWith('conic-gradient')
    )
  })

  // Handles hex, rgb, and gradient formats for CSS background.
  const validatedColor = computed(() => {
    const color = props.color?.trim() ?? ''

    // If it's a gradient, return as-is
    if (isGradient.value) {
      return color
    }

    // If color starts with 'rgb', it's already valid
    if (color.startsWith('rgb')) {
      return color
    }
    // If color starts with '#', it's a hex string -- valid for CSS
    if (color.startsWith('#')) {
      return color
    }
    // If it looks like "number number number", treat as rgb value
    if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(color)) {
      return `rgb(${color})`
    }
    // Otherwise, pass through (could be a color name or fallback)
    return color
  })

  // Style object that uses background for gradients, backgroundColor for solid colors
  const backgroundStyle = computed(() => {
    if (isGradient.value) {
      return { background: validatedColor.value }
    }
    return { backgroundColor: validatedColor.value }
  })
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="
      cn(colorSelectorVariants({ size }), props.class, { 'ring-2 ring-primary': props.selected })
    "
    :style="backgroundStyle"
    @click="emit('click', $event)"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
  >
    <slot />
  </Primitive>
</template>
