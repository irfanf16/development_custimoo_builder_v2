<script setup lang="ts">
  import { SearchX } from 'lucide-vue-next'

  withDefaults(
    defineProps<{
      title: string
      description?: string
    }>(),
    { description: '' }
  )
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center text-muted-foreground"
  >
    <slot name="icon">
      <SearchX class="size-10 shrink-0 opacity-60" aria-hidden="true" />
    </slot>
    <div class="space-y-1">
      <p class="text-base font-medium text-foreground">
        {{ title }}
      </p>
      <p v-if="description" class="text-sm max-w-sm mx-auto">
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
