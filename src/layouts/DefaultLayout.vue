<script setup lang="ts">
  const props = defineProps<{
    class?: string
  }>()
</script>

<template>
  <div :class="['w-full max-w-none mx-auto px-6 py-6', props.class]">
    <slot />
  </div>
</template>
