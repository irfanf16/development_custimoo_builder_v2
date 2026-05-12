<script setup lang="ts">
  import { nextTick, onMounted, ref } from 'vue'
  import { toast } from 'vue-sonner'
  import { useBrandStyling } from '@/composables/useBrandStyling'
  import { useElevateWidgetForOverlays } from '@/composables/useElevateWidgetForOverlays'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useAppStore } from '@/stores/app/app.store'
  import { LayoutWrapper } from '@/layouts'
  import ConfirmDialog from '@/components/global/ConfirmDialog.vue'
  import { Toaster } from '@/components/ui/sonner'

  // Define props for the widget component
  // defineProps({
  //   date: {
  //     type: String,
  //     required: false,
  //     default: ''
  //   },
  //   title: {
  //     type: String,
  //     required: false,
  //     default: 'Customizer Widget'
  //   },
  //   end: {
  //     type: String,
  //     required: false,
  //     default: 'Widget ended.'
  //   },
  //   color: {
  //     type: String,
  //     required: false,
  //     default: '#3B82F6'
  //   },
  //   secondaryColor: {
  //     type: String,
  //     required: false,
  //     default: undefined
  //   },
  //   theme: {
  //     type: String,
  //     required: false,
  //     default: 'light'
  //   },
  //   mode: {
  //     type: String,
  //     required: false,
  //     default: 'default'
  //   },
  //   showNavigation: {
  //     type: Boolean,
  //     required: false,
  //     default: true
  //   }
  // })

  const uiStore = useUIStore()
  const appStore = useAppStore()

  const widgetRootContainer = ref<HTMLElement>()

  // Initialize color scheme based on host theme
  const { applyBrandStyling } = useBrandStyling()

  // Update colors when component mounts
  useElevateWidgetForOverlays()

  onMounted(async () => {
    if (widgetRootContainer.value) {
      uiStore.setWidgetRoot(widgetRootContainer.value)
      await applyBrandStyling(widgetRootContainer.value)
    }

    // Show any pending toast (e.g. share product not found) now that Toaster is mounted
    await nextTick()
    const pendingMessage =
      (appStore.pendingShareNotFoundToastMessage as { value?: string | null })?.value ??
      appStore.pendingShareNotFoundToastMessage
    if (pendingMessage) {
      toast.warning(pendingMessage)
      appStore.clearPendingShareNotFoundToast()
    }
  })
</script>

<template>
  <div data-testid="customizer-widget-root" ref="widgetRootContainer" :class="['widget-theme w-full min-h-full']">
    <!-- Widget content -->
    <LayoutWrapper class="bg-accent text-foreground flex-1 flex flex-col">
      <router-view class="flex-1 flex flex-col" />
      <ConfirmDialog />
      <Toaster />
    </LayoutWrapper>
  </div>
</template>

<style scoped></style>
