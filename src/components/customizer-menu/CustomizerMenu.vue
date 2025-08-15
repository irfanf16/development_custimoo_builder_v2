<script setup lang="ts">
  import CustomizerMenuItem from './MenuItem.vue'
</script>

<template>
  <div class="flex flex-col gap-1 p-1">
    <CustomizerMenuItem :isActive="true" :text="'Categories'">
      <template #icon>
        <i-flex-line-categories--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem :isActive="false" :text="'Designs'">
      <template #icon>
        <i-flex-line-ai-edit-spark--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem :isActive="false" :text="'Styles'">
      <template #icon>
        <i-flex-line-ai-sparkles--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem :isActive="false" :text="'Logos'">
      <template #icon>
        <i-flex-line-landscape1--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem :isActive="false" :text="'Colors'">
      <template #icon>
        <i-flex-line-paint-palette--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem :isActive="false" :text="'Patterns'">
      <template #icon>
        <i-flex-line-pattern--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem :isActive="false" :text="'Texts'">
      <template #icon>
        <i-flex-line-text-style--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem :isActive="false" :text="'Roster'">
      <template #icon>
        <i-flex-line-table--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
    <CustomizerMenuItem :isActive="false" :text="'Summary'">
      <template #icon>
        <i-flex-line-text-file--streamline-flex
          class="size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
  </div>
</template>
