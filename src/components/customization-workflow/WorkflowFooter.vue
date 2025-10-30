<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import type { FooterButton } from './types'

  const props = defineProps<{ config?: { buttons?: FooterButton[] } }>()
</script>
<template>
  <div v-if="props.config?.buttons && props.config.buttons.length" class="flex w-full gap-2">
    <Button
      v-for="button in props.config.buttons"
      :key="button.label"
      :variant="button.variant"
      :disabled="button.disabled ?? false"
      class="flex-1"
      @click="button.onClick"
      >{{ button.label }}</Button
    >
  </div>
</template>
