<script setup lang="ts">
  import { computed } from 'vue'
  import { Button } from '@/components/ui/button'
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
  } from '@/components/ui/tooltip'

  const props = defineProps<{
    isActive?: boolean
    text?: string
  }>()

  const emit = defineEmits<{ (e: 'click'): void }>()

  const isActive = computed(() => props.isActive || false)

  const variant = computed(() => (isActive.value ? 'default' : 'outline'))

  const buttonClass = computed(() =>
    isActive.value
      ? 'w-[56px] h-[56px] p-4 rounded-2xl animate text-primary-foreground display'
      : 'w-[56px] h-[56px] p-4 rounded-2xl animate'
  )
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button :variant="variant" :class="buttonClass" @click="emit('click')">
          <slot name="icon" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ text }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
