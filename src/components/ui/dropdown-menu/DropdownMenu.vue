<script setup lang="ts">
  import type { DropdownMenuRootEmits, DropdownMenuRootProps } from 'reka-ui'
  import { DropdownMenuRoot, useForwardPropsEmits } from 'reka-ui'

  /** Non-modal: do not lock host page scroll or body pointer-events (embedded widget). */
  const props = withDefaults(defineProps<DropdownMenuRootProps>(), {
    modal: false
  })
  const emits = defineEmits<DropdownMenuRootEmits>()

  const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DropdownMenuRoot data-slot="dropdown-menu" v-bind="forwarded">
    <slot />
  </DropdownMenuRoot>
</template>
