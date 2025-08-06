<template>
  <div
    ref="widgetRoot"
    class="widget-theme font-sans border border-gray-200 rounded-lg p-4 bg-white shadow-sm w-full min-h-[400px]"
    :style="{ '--widget-color': color }"
  >
    <div class="flex flex-col gap-3 h-full">
      <div
        class="flex justify-between items-center pb-3 border-b border-gray-200"
      >
        <h3 class="text-lg font-semibold text-gray-900 m-0">{{ title }}</h3>
        <div class="flex items-center gap-4">
          <nav v-if="showNavigation" class="flex gap-2">
            <button
              @click="navigateTo('/')"
              :class="{
                'bg-blue-500 text-white border-blue-500': currentRoute === '/',
                'bg-white text-gray-700 border-gray-200 hover:bg-gray-50':
                  currentRoute !== '/'
              }"
              class="px-2 py-1 text-xs border rounded transition-colors duration-200"
            >
              Home
            </button>
            <button
              @click="navigateTo('/about')"
              :class="{
                'bg-blue-500 text-white border-blue-500':
                  currentRoute === '/about',
                'bg-white text-gray-700 border-gray-200 hover:bg-gray-50':
                  currentRoute !== '/about'
              }"
              class="px-2 py-1 text-xs border rounded transition-colors duration-200"
            >
              About
            </button>
            <button
              @click="navigateTo('/dashboard')"
              :class="{
                'bg-blue-500 text-white border-blue-500':
                  currentRoute === '/dashboard',
                'bg-white text-gray-700 border-gray-200 hover:bg-gray-50':
                  currentRoute !== '/dashboard'
              }"
              class="px-2 py-1 text-xs border rounded transition-colors duration-200"
            >
              Dashboard
            </button>
          </nav>
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

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useColorScheme } from '@/composables/useColorScheme'
  import { getHostTheme } from '@/lib/hostThemes'
  import SignInButton from './SignInButton.vue'

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

  // Template ref for the widget root element
  const widgetRoot = ref<HTMLElement>()

  // Get host-based theme
  const hostTheme = getHostTheme()

  // Initialize color scheme based on host theme
  const { applyColorScheme } = useColorScheme()

  // Update colors when component mounts
  onMounted(() => {
    // Use the template ref to get the widget container
    const widgetContainer = widgetRoot.value

    if (widgetContainer) {
      // Always apply a theme (host theme or default)
      applyColorScheme(widgetContainer, hostTheme)
    }
  })

  const currentRoute = computed(() => route.path)

  const navigateTo = (path: string) => {
    router.push(path)
  }
</script>

<style scoped>
  /* Essential widget overrides only */

  /* Hide layout elements that shouldn't appear in widget */
  /* :deep(header) {
    display: none;
  }

  :deep(nav) {
    display: none;
  } */

  /* Adjust container for widget context */
  /* :deep(.container) {
    padding: 0;
    margin: 0;
    max-width: none;
  }

  :deep(.min-h-screen) {
    min-height: auto;
  } */

  /* Dynamic color support */
  /* :deep(.bg-blue-500) {
    background-color: var(--widget-color, #3b82f6) !important;
  }

  :deep(.border-blue-500) {
    border-color: var(--widget-color, #3b82f6) !important;
  } */

  /* Ensure proper positioning in widget context */
  /* :deep(.absolute) {
    position: absolute !important;
  }

  :deep(.relative) {
    position: relative !important;
  }

  :deep(.z-50) {
    z-index: 50 !important;
  }

  :deep(.z-60) {
    z-index: 60 !important;
  } */
</style>
