<script setup lang="ts">
  import CustomizerMenuItem from './item.vue'
</script>

<template>
  <div class="flex flex-col gap-1 p-1">
    <CustomizerMenuItem name="Dumbbell" :isActive="true" />
    <CustomizerMenuItem name="Droplets" />
    <CustomizerMenuItem name="Shapes" />
    <CustomizerMenuItem name="PaintBucket" />
    <CustomizerMenuItem name="PencilLine" />
    <CustomizerMenuItem name="SwatchBook" />
    <CustomizerMenuItem name="Type" />
    <CustomizerMenuItem name="Table" />
    <CustomizerMenuItem name="NotepadText" />
  </div>
</template>
