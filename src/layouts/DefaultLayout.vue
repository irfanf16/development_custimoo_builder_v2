<script setup lang="ts">
  const props = defineProps<{
    class?: string
  }>()
</script>

<template>
  <div :class="['layout w-full max-w-none mx-auto px-6 py-6 flex-1 flex flex-col', props.class]">
    <slot />
  </div>
</template>
