<script setup lang="ts">
  import type { DialogRootEmits, DialogRootProps } from 'reka-ui'
  import { ConfigProvider, DialogRoot, useForwardPropsEmits } from 'reka-ui'

  const props = defineProps<DialogRootProps>()
  const emits = defineEmits<DialogRootEmits>()

  const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <!-- Wrap every dialog in a ConfigProvider so Reka skips the global body scroll lock.
       This keeps modals modal, but allows touch scrolling within our shadow-root widget. -->
  <ConfigProvider>
    <DialogRoot v-bind="forwarded">
      <slot class="bg-background text-foreground" />
    </DialogRoot>
  </ConfigProvider>
</template>
