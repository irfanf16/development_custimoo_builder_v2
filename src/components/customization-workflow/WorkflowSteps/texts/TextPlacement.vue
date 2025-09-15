<script setup lang="ts">
  import { computed } from 'vue'

  // no props/emits

  // Breadcrumb logic for text placement
  const breadcrumbs = computed(() => [{ label: 'Texts' }])
  const headerExtras = { breadcrumbs }
  defineExpose({ headerExtras })
</script>

<template>
  <!-- Content -->
  <div class="p-6">
    <div
      class="h-40 rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground"
    >
      Text placement editor
    </div>
  </div>
</template>

<style scoped></style>
