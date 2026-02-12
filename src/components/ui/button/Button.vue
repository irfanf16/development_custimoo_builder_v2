<script setup lang="ts">
  import type { PrimitiveProps } from 'reka-ui'
  import type { HTMLAttributes } from 'vue'
  import type { ButtonVariants } from '.'
  import { Primitive } from 'reka-ui'
  import { cn } from '@/lib/utils'
  import { buttonVariants } from '.'
  import Spinner from '../spinner/Spinner.vue'

  interface Props extends PrimitiveProps {
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    class?: HTMLAttributes['class']
    loading?: boolean
    disabled?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    as: 'button'
  })
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :disabled="disabled || loading"
    :class="
      cn(
        'relative',
        buttonVariants({ variant, size }),
        loading && 'cursor-not-allowed',
        props.class
      )
    "
  >
    <!-- Slot directly -->
    <slot />

    <!-- Overlay Spinner -->
    <Spinner
      v-if="loading"
      class="absolute inset-0 m-auto text-primary animate-spin pointer-events-none"
      :size="size === 'sm' ? 16 : size === 'lg' ? 24 : 20"
    />
  </Primitive>
</template>
