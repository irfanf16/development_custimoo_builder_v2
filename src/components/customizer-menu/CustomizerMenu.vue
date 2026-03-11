<script setup lang="ts">
  import { computed } from 'vue'
  import CustomizerMenuItem from './MenuItem.vue'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { customizer_menu_label } from '@/paraglide/messages'

  const { isActive, goTo, getNavText, menuItems } = useCustomizerMenu()
  const profileStore = useProfileStore()
  const menuLabel = computed(() =>
    customizer_menu_label({}, { locale: profileStore.currentLocale })
  )
</script>

<template>
  <nav class="flex flex-col gap-1 p-1" role="navigation" :aria-label="menuLabel">
    <CustomizerMenuItem
      v-for="item in menuItems"
      :key="item.step"
      :is-active="isActive(item.step)"
      :text="getNavText(item.step)"
      @click="goTo(item.step)"
    >
      <template #icon>
        <i-flex-line-categories
          v-if="item.step === 'product'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
        <i-flex-line-ai-edit-spark
          v-else-if="item.step === 'designs'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
        <i-flex-line-ai-sparkles
          v-else-if="item.step === 'styles'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
        <i-flex-line-landscape1
          v-else-if="item.step === 'logos'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
        <i-flex-line-paint-palette
          v-else-if="item.step === 'colors'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
        <i-flex-line-pattern
          v-else-if="item.step === 'patterns'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
        <i-flex-line-text-style
          v-else-if="item.step === 'texts'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
        <i-flex-line-table
          v-else-if="item.step === 'roster'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
        <i-flex-line-text-file
          v-else-if="item.step === 'summary'"
          class="size-[1rem] md:size-[1rem] lg:size-[1.5rem] bg-transparent"
        />
      </template>
    </CustomizerMenuItem>
  </nav>
</template>
