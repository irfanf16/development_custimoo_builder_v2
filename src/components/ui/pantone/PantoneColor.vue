<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    name?: string
    value: string
    size?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    name: '',
    size: 16
  })

  const swatchSize = computed(() =>
    typeof props.size === 'number' ? `${props.size}px` : String(props.size)
  )
</script>

<template>
  <div class="flex items-center gap-2">
    <span
      class="inline-block rounded-full border"
      :style="{ width: swatchSize, height: swatchSize, background: props.value }"
    />
    <div class="text-sm">
      <div class="font-medium">{{ props.name }}</div>
      <div class="text-xs text-muted-foreground">{{ props.value }}</div>
    </div>
  </div>
</template>

<style scoped></style>
