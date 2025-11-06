<script setup lang="ts">
  import { defineEmits, onMounted, onUnmounted, ref, nextTick } from 'vue'

  const emit = defineEmits(['load-more'])
  const wrapperRef = ref<HTMLElement | null>(null)
  let scrollTarget: HTMLElement | null = null
  let isNearBottom = false

  function onScroll(e: Event) {
    const el = e.target as HTMLElement
    const { scrollTop, scrollHeight, clientHeight } = el
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 200

    if (nearBottom && !isNearBottom) {
      isNearBottom = true
      emit('load-more')
    } else if (!nearBottom) {
      isNearBottom = false
    }
  }

  onMounted(async () => {
    await nextTick()
    // ✅ The ScrollAreaViewport wraps our content, so find it by selector
    const viewport = wrapperRef.value
      ?.closest('[data-slot="scroll-area"]')
      ?.querySelector('[data-slot="scroll-area-viewport"]')

    if (viewport) {
      scrollTarget = viewport as HTMLElement
      scrollTarget.addEventListener('scroll', onScroll)
    } else {
      // fallback: maybe not inside a ScrollArea
      scrollTarget = wrapperRef.value
      scrollTarget?.addEventListener('scroll', onScroll)
    }
  })

  onUnmounted(() => {
    scrollTarget?.removeEventListener('scroll', onScroll)
  })
</script>

<template>
  <div ref="wrapperRef" class="h-full">
    <slot />
  </div>
</template>
