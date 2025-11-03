<script setup lang="ts">
  import { defineEmits, onMounted, onUnmounted } from 'vue'

  const emit = defineEmits(['load-more'])

  function onScroll() {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      emit('load-more')
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })
</script>

<template>
  <slot />
</template>
