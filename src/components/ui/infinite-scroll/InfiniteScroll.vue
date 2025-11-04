<script setup lang="ts">
  import { defineEmits, onMounted, onUnmounted, ref } from 'vue'

  const emit = defineEmits(['load-more'])
  const container = ref<HTMLElement | null>(null)
  let isNearBottom = false

  function onScroll() {
    if (!container.value) return
    const { scrollTop, scrollHeight, clientHeight } = container.value
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 200

    if (nearBottom && !isNearBottom) {
      isNearBottom = true
      emit('load-more')
    } else if (!nearBottom) {
      isNearBottom = false
    }
  }

  onMounted(() => {
    container.value?.addEventListener('scroll', onScroll)
  })

  onUnmounted(() => {
    container.value?.removeEventListener('scroll', onScroll)
  })
</script>

<template>
  <div ref="container" class="h-full overflow-y-auto">
    <slot />
  </div>
</template>
