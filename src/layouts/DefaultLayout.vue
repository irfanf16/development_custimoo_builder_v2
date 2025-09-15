<script setup lang="ts">
  const props = defineProps<{
    class?: string
  }>()
</script>

<template>
  <div
    :class="[
      'layout w-full max-w-none mx-auto flex-1 flex flex-col overflow-hidden',
      props.class
    ]"
  >
    <slot />
  </div>
</template>
