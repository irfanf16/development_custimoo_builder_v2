<script setup lang="ts">
  import { computed } from 'vue'
  import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import ColorSelector from '@/components/ui/color-selector/ColorSelector.vue'
  import type { GradientColor } from '@/services/products/types'

  interface Props {
    gradientColors: GradientColor[]
    modelValue: number
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    'update:modelValue': [value: number]
  }>()

  const selectedIndex = computed({
    get: () => props.modelValue,
    set: (value: number) => emit('update:modelValue', value)
  })

  function handleTabChange(value: string | number) {
    selectedIndex.value = typeof value === 'string' ? Number.parseInt(value, 10) : value
  }
</script>

<template>
  <Tabs
    data-testid="workflow-colors-gradient-tabs"
    :model-value="String(selectedIndex)"
    @update:model-value="handleTabChange"
  >
    <TabsList class="gap-2 w-full">
      <TabsTrigger
        v-for="(gradientColor, index) in gradientColors"
        :key="index"
        :value="String(index)"
        :data-testid="`workflow-colors-gradient-tab-${index}`"
        class="gap-2 w-full"
      >
        <ColorSelector :color="gradientColor.color" size="xs" class="shrink-0" :disabled="true" />
        <span class="text-foreground">{{ gradientColor.percentage }}%</span>
      </TabsTrigger>
    </TabsList>
  </Tabs>
</template>

<style scoped></style>
