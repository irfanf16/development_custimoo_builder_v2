<script setup lang="ts">
  import { Search } from 'lucide-vue-next'
  import { InputGroup, InputGroupInput, InputGroupAddon } from '../input-group'
  import { cn } from '@/lib/utils'
  import { useVModel } from '@vueuse/core'
  import type { HTMLAttributes } from 'vue'
  const props = defineProps<{
    placeholder: string
    modelValue: string
    class?: HTMLAttributes['class']
  }>()

  const emits = defineEmits<{
    (e: 'update:modelValue', payload: string | number): void
  }>()

  const modelValue = useVModel(props, 'modelValue', emits, {
    passive: true,
    defaultValue: ''
  })
</script>

<template>
  <InputGroup :class="props.class">
    <InputGroupInput
      :placeholder="props.placeholder"
      :model-value="modelValue"
      :class="cn('text-sm', props.class)"
      @update:model-value="(val: string | number) => emits('update:modelValue', String(val))"
    />
    <InputGroupAddon>
      <Search />
    </InputGroupAddon>
  </InputGroup>
</template>
