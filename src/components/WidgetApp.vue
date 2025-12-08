<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  // import { useRouter, useRoute } from 'vue-router'
  import { useBrandStyling } from '@/composables/useBrandStyling'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { LayoutWrapper } from '@/layouts'
  import ConfirmDialog from '@/components/global/ConfirmDialog.vue'
  // import SignInButton from './SignInButton.vue'
  // import ThemeToggle from './ThemeToggle.vue'
  // import { Button } from '@/components/ui/button'

  // Define props for the widget component
  defineProps({
    date: {
      type: String,
      required: false,
      default: ''
    },
    title: {
      type: String,
      required: false,
      default: 'Customizer Widget'
    },
    end: {
      type: String,
      required: false,
      default: 'Widget ended.'
    },
    color: {
      type: String,
      required: false,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      required: false,
      default: undefined
    },
    theme: {
      type: String,
      required: false,
      default: 'light'
    },
    mode: {
      type: String,
      required: false,
      default: 'default'
    },
    showNavigation: {
      type: Boolean,
      required: false,
      default: true
    }
  })

  // const router = useRouter()
  // const route = useRoute()
  const uiStore = useUIStore()

  const widgetRootContainer = ref<HTMLElement>()

  // Initialize color scheme based on host theme
  const { applyBrandStyling } = useBrandStyling()

  // Update colors when component mounts
  onMounted(async () => {
    if (widgetRootContainer.value) {
      uiStore.setWidgetRoot(widgetRootContainer.value)
      await applyBrandStyling(widgetRootContainer.value)
    }
  })
</script>

<template>
  <div
    ref="widgetRootContainer"
    :class="['widget-theme w-full min-h-full', { dark: uiStore.currentTheme === 'dark' }]"
  >
    <!-- Widget content -->
    <LayoutWrapper class="bg-background text-foreground flex-1 flex flex-col">
      <router-view class="flex-1 flex flex-col" />
      <ConfirmDialog />
    </LayoutWrapper>
  </div>
</template>

<style scoped></style>
