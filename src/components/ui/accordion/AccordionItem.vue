<script setup lang="ts">
  import { inject, computed } from 'vue'
  const props = defineProps<{ value: string }>()
  const ctx = inject<any>('accordionCtx')
  const open = computed(() => ctx?.isOpen(props.value))
  function toggle() {
    ctx?.toggle(props.value)
  }
</script>

<template>
  <div class="border-b border-border">
    <div
      class="flex items-center justify-between py-3 cursor-pointer"
      @click="toggle"
    >
      <div class="font-medium text-sm">
        <slot name="trigger" />
      </div>
      <svg
        :class="['size-4 transition-transform', open ? 'rotate-180' : '']"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
    <div
      :class="[
        'grid transition-[grid-template-rows] duration-300 ease-in-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      ]"
    >
      <div class="overflow-hidden">
        <div class="pb-3 text-sm text-muted-foreground">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
