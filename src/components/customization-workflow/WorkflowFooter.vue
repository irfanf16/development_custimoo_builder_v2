<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import type { FooterButton } from './types'
  import { useUIStore } from '@/stores/ui/ui.store'
  const uiStore = useUIStore()
  const props = defineProps<{ config?: { buttons?: FooterButton[] }; isExpanded?: boolean }>()
</script>
<template>
  <div :class="['flex flex-row w-full', { 'justify-end': props.isExpanded }]">
    <div
      v-if="props.config?.buttons && props.config.buttons.length"
      class="flex gap-2"
      :class="{ 'w-auto': props.isExpanded, 'w-full': !props.isExpanded }"
    >
      <Button
        v-for="button in props.config.buttons"
        :key="button.label"
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
  </div>
</template>
