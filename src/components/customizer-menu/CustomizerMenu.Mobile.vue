<script setup lang="ts">
  import { computed } from 'vue'
  import CustomizerMenuItem from './MenuItem.vue'
  import { useCustomizerMenu } from '@/composables/useCustomizerMenu'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import type { CustomizerStep } from '@/stores/workflow/workflow.store.types'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import { customizer_menu_label } from '@/paraglide/messages'

  const { isActive, goTo, getNavText, menuItems } = useCustomizerMenu()
  const workflow = useWorkflowStore()
  const profileStore = useProfileStore()
  const menuLabel = computed(() =>
    customizer_menu_label({}, { locale: profileStore.currentLocale })
  )

  async function handleGoTo(step: string) {
    // Toggle panel if tapping current step again
    if (isActive(step as CustomizerStep)) {
      workflow.togglePanel()
      return
    }

    // Normal navigation
    await goTo(step as CustomizerStep)
    workflow.setPanelOpen(true)
  }
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 bg-background z-10 py-2 shadow-lg md:hidden"
    role="navigation"
    :aria-label="menuLabel"
  >
    <div class="flex overflow-x-auto overflow-y-hidden gap-2 px-4 scrollbar-hide whitespace-nowrap">
      <CustomizerMenuItem
        v-for="item in menuItems"
        :key="item.step"
        :is-active="isActive(item.step)"
        :text="getNavText(item.step)"
        class="flex-shrink-0 min-w-[72px]"
        @click="handleGoTo(item.step)"
      >
        <template #icon>
          <i-flex-line-categories
            v-if="item.step === 'product'"
            class="size-[1.5rem] bg-transparent"
          />
          <i-flex-line-ai-edit-spark
            v-else-if="item.step === 'designs'"
            class="size-[1.5rem] bg-transparent"
          />
          <i-flex-line-ai-sparkles
            v-else-if="item.step === 'styles'"
            class="size-[1.5rem] bg-transparent"
          />
          <i-flex-line-landscape1
            v-else-if="item.step === 'logos'"
            class="size-[1.5rem] bg-transparent"
          />
          <i-flex-line-paint-palette
            v-else-if="item.step === 'colors'"
            class="size-[1.5rem] bg-transparent"
          />
          <i-flex-line-pattern
            v-else-if="item.step === 'patterns'"
            class="size-[1.5rem] bg-transparent"
          />
          <i-flex-line-text-style
            v-else-if="item.step === 'texts'"
            class="size-[1.5rem] bg-transparent"
          />
          <i-flex-line-table
            v-else-if="item.step === 'roster'"
            class="size-[1.5rem] bg-transparent"
          />
          <i-flex-line-text-file
            v-else-if="item.step === 'summary'"
            class="size-[1.5rem] bg-transparent"
          />
        </template>
      </CustomizerMenuItem>
    </div>
  </nav>
</template>

<style scoped>
  /* Hide scrollbar for webkit browsers */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  /* Ensure smooth scrolling */
  .scrollbar-hide {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }

  /* Ensure the main content has bottom padding to account for fixed nav */
  :global(.mobile-layout) {
    padding-bottom: 80px;
  }
</style>
