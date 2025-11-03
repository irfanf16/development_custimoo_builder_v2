<template>
  <div v-if="show" :class="containerClass" role="status" :aria-label="ariaLabel">
    <!-- Spinner -->
    <svg
      v-if="variant === 'spinner'"
      :class="spinnerClass"
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" />
      <path class="opacity-75" fill="currentColor" d="M44.94 25.04A19.5 19.5 0 1 0 25 44.5" />
    </svg>

    <!-- Dots -->
    <div v-else-if="variant === 'dots'" :class="dotsContainerClass">
      <span
        v-for="i in 3"
        :key="i"
        :class="dotClass"
        :style="{ animationDelay: `${(i - 1) * 0.15}s` }"
      ></span>
    </div>

    <!-- Skeleton -->
    <div v-else-if="variant === 'skeleton'" :class="skeletonClass">
      <slot>
        <div :class="['w-full', skeletonInnerHeight]" />
      </slot>
    </div>

    <!-- Fallback (spinner) -->
    <svg
      v-else
      :class="spinnerClass"
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="25" cy="25" r="20" stroke="currentColor" stroke-width="5" />
      <path class="opacity-75" fill="currentColor" d="M44.94 25.04A19.5 19.5 0 1 0 25 44.5" />
    </svg>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    variant?: 'spinner' | 'dots' | 'skeleton'
    size?: 'sm' | 'md' | 'lg' | number
    rounded?: boolean
    show?: boolean
    class?: string
    ariaLabel?: string
    skeletonHeight?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'spinner',
    size: 'md',
    rounded: true,
    show: true,
    ariaLabel: 'Loading',
    skeletonHeight: 'h-6'
  })

  const sizeMap: Record<string, string> = {
    sm: 'w-4 h-4 text-sm',
    md: 'w-6 h-6 text-base',
    lg: 'w-8 h-8 text-lg'
  }

  const spinnerClass = computed(() => {
    const base = 'animate-spin text-current'
    if (typeof props.size === 'number') return base
    return `${base} ${sizeMap[props.size] ?? sizeMap.md}`
  })

  const dotClass = computed(() => {
    const base = 'inline-block rounded-full bg-current mr-1'
    if (typeof props.size === 'number')
      return `${base} w-[${props.size / 3}px] h-[${props.size / 3}px]`
    const d = props.size === 'sm' ? 'w-1.5 h-1.5' : props.size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
    return `${base} ${d}`
  })

  const dotsContainerClass = computed(() => `flex items-center ${props.class ?? ''}`)

  const containerClass = computed(() => {
    const base = 'inline-flex items-center justify-center'
    if (props.variant === 'skeleton') return `${base} w-full ${props.class ?? ''}`
    return `${base} ${props.class ?? ''}`
  })

  const skeletonClass = computed(() => {
    const r = props.rounded ? 'rounded-md' : ''
    return `w-full bg-gray-200 dark:bg-gray-700 animate-pulse ${r} ${props.skeletonHeight}`
  })

  const skeletonInnerHeight = computed(() => props.skeletonHeight)
</script>

<style scoped>
  @keyframes dotBounce {
    0%,
    80%,
    100% {
      transform: translateY(0);
      opacity: 0.6;
    }
    40% {
      transform: translateY(-6px);
      opacity: 1;
    }
  }

  div[role='status'] span {
    display: inline-block;
    animation: dotBounce 0.6s infinite ease-in-out;
  }
</style>
