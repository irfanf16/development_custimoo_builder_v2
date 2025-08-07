<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useColorScheme } from '@/composables/useColorScheme'
  import { getHostTheme } from '@/lib/hostThemes'
  import { useUIStore } from '@/stores/ui'
  import SignInButton from './SignInButton.vue'
  import ThemeToggle from './ThemeToggle.vue'
  import { Button } from '@/components/ui/button'

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

  const router = useRouter()
  const route = useRoute()
  const uiStore = useUIStore()

  // Template ref for the widget root element

  // Get host-based theme
  const hostTheme = getHostTheme()

  const widgetRootContainer = ref<HTMLElement>()

  // Initialize color scheme based on host theme
  const { applyColorScheme } = useColorScheme()

  // Update colors when component mounts
  onMounted(async () => {
    if (widgetRootContainer.value) {
      console.log('widgetRootContainer', widgetRootContainer.value)
      uiStore.setWidgetRoot(widgetRootContainer.value)
      await applyColorScheme(widgetRootContainer.value, hostTheme)
    }
  })

  const currentRoute = computed(() => route.path)

  const navigateTo = (path: string) => {
    router.push(path)
  }
</script>

<template>
  <div
    ref="widgetRootContainer"
    :class="[
      'widget-theme font-sans border border-gray-200 rounded-lg p-4 shadow-sm w-full min-h-[400px]',
      { dark: uiStore.currentTheme === 'dark' }
    ]"
    :style="{
      color: 'var(--foreground)',
      'background-color': 'var(--background)'
    }"
  >
    <div class="flex flex-col gap-3 h-full">
      <div
        class="flex justify-between items-center pb-3 border-b border-gray-200"
      >
        <h3 class="text-lg font-semibold text-gray-900 m-0">{{ title }}</h3>
        <div class="flex items-center gap-4">
          <nav v-if="showNavigation" class="flex gap-2">
            <Button
              @click="navigateTo('/')"
              :variant="currentRoute === '/' ? 'default' : 'outline'"
              size="sm"
              class="text-xs px-2 py-1"
            >
              Home
            </Button>
            <Button
              @click="navigateTo('/about')"
              :variant="currentRoute === '/about' ? 'default' : 'outline'"
              size="sm"
              class="text-xs px-2 py-1"
            >
              About
            </Button>
            <Button
              @click="navigateTo('/dashboard')"
              :variant="currentRoute === '/dashboard' ? 'default' : 'outline'"
              size="sm"
              class="text-xs px-2 py-1"
            >
              Dashboard
            </Button>
          </nav>

          <!-- Theme Switch -->
          <div
            v-if="hostTheme?.allowColorModeSwitch"
            class="flex items-center gap-2"
          >
            <span class="text-xs text-muted-foreground">Theme:</span>
            <ThemeToggle />
          </div>

          <SignInButton />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <!-- Widget content -->
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
