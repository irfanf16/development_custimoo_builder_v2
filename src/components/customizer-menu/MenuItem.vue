<script setup lang="ts">
  import { computed } from 'vue'
  import { Button } from '@/components/ui/button'

  const props = defineProps<{
    isActive?: boolean
    text?: string
  }>()

  const emit = defineEmits<{ (e: 'click'): void }>()

  const isActive = computed(() => props.isActive || false)

  const variant = computed(() => (isActive.value ? 'primary' : 'default'))

  const buttonClass = computed(() => {
    const baseClass = 'w-[4.5rem] h-[4.5rem] p-4 rounded-2xl shadow-none '
    return isActive.value ? `${baseClass} text-primary-foreground display` : `${baseClass} `
  })
</script>

<template>
  <Button :variant="variant" :class="buttonClass" @click="emit('click')">
    <div class="flex flex-col items-center gap-1">
      <slot name="icon" />
      <p class="text-xs">{{ text }}</p>
    </div>
  </Button>
</template>
