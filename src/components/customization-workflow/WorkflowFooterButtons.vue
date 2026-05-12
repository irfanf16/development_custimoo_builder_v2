<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import type { FooterButton } from './types'
  import { useUIStore } from '@/stores/ui/ui.store'
  const uiStore = useUIStore()
  const props = defineProps<{ config?: { buttons?: FooterButton[] }; isExpanded?: boolean }>()
</script>
<template>
  <div data-testid="workflow-footer-buttons" class="flex gap-2" :class="{ 'w-auto': props.isExpanded, 'w-full': !props.isExpanded }">
    <Button
      v-for="button in props.config?.buttons ?? []"
      :key="button.label"
      :data-testid="`workflow-button-${button.label?.toLowerCase().replace(/\s+/g, '-')}`"
      :variant="button.variant"
      :disabled="button.disabled ?? false"
      :size="uiStore.isMobile ? 'sm' : 'default'"
      class="flex-1"
      @click="button.onClick"
    >
      <component :is="button.icon" class="size-4" />
      <span>{{ button.label }}</span>
    </Button>
  </div>
</template>
