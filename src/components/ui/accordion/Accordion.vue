<script setup lang="ts">
  import { provide, ref, computed, watch, type Ref } from 'vue'

  type AccordionType = 'single' | 'multiple'

  const props = defineProps<{
    type?: AccordionType
    collapsible?: boolean
    modelValue?: string | string[]
  }>()

  const emit = defineEmits<{
    (e: 'update:modelValue', v: string | string[]): void
  }>()

  const type = computed(() => props.type ?? 'single')
  const collapsible = computed(() => props.collapsible ?? true)

  const internal: Ref<string[]> = ref(
    Array.isArray(props.modelValue)
      ? [...props.modelValue]
      : props.modelValue
        ? [props.modelValue]
        : []
  )

  watch(
    () => props.modelValue,
    v => {
      if (Array.isArray(v)) internal.value = [...v]
      else internal.value = v ? [v] : []
    }
  )

  function isOpen(id: string): boolean {
    return internal.value.includes(id)
  }

  function toggle(id: string) {
    const open = isOpen(id)
    if (type.value === 'single') {
      if (open) {
        if (collapsible.value) internal.value = []
      } else {
        internal.value = [id]
      }
    } else {
      if (open) internal.value = internal.value.filter(x => x !== id)
      else internal.value = [...internal.value, id]
    }
    emit(
      'update:modelValue',
      type.value === 'single' ? (internal.value[0] ?? '') : internal.value
    )
  }

  provide('accordionCtx', {
    isOpen,
    toggle
  })
</script>

<template>
  <div class="w-full">
    <slot />
  </div>
</template>
