<template>
  <div
    class="font-sans border border-gray-200 rounded-lg p-4 bg-white shadow-sm w-full min-h-[400px]"
    :style="{ '--widget-color': color }"
  >
    <div class="flex flex-col gap-3 h-full">
      <div
        class="flex justify-between items-center pb-3 border-b border-gray-200"
      >
        <h3 class="text-lg font-semibold text-gray-900 m-0">{{ title }}</h3>
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
      </div>
      <div class="flex-1 overflow-y-auto">
        <!-- Use the same layout system as SPA mode -->
        <component :is="currentLayout">
          <router-view />
        </component>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import DefaultLayout from '@/layouts/DefaultLayout.vue'
  import DashboardLayout from '@/layouts/DashboardLayout.vue'
  import AuthLayout from '@/layouts/AuthLayout.vue'

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

  const currentRoute = computed(() => route.path)

  // Use the same layout detection logic as SPA mode
  const currentLayout = computed(() => {
    const layout = (route.meta?.layout as string) || 'default'

    switch (layout) {
      case 'dashboard':
        return DashboardLayout
      case 'auth':
        return AuthLayout
      default:
        return DefaultLayout
    }
  })

  const navigateTo = (path: string) => {
    router.push(path)
  }
</script>

<style scoped>
  /* Override layout styles for widget context */
  :deep(.min-h-screen) {
    min-height: auto;
  }

  :deep(header) {
    display: none; /* Hide layout header in widget */
  }

  :deep(nav) {
    display: none; /* Hide layout navigation in widget */
  }

  :deep(.container) {
    padding: 0;
    margin: 0;
    max-width: none;
  }

  :deep(.mx-auto) {
    margin-left: 0;
    margin-right: 0;
  }

  :deep(.px-4) {
    padding-left: 0;
    padding-right: 0;
  }

  :deep(.py-4) {
    padding-top: 0;
    padding-bottom: 0;
  }

  :deep(.flex) {
    display: block;
  }

  :deep(.items-center) {
    align-items: normal;
  }

  :deep(.justify-between) {
    justify-content: normal;
  }

  :deep(.space-x-2) {
    margin-left: 0;
  }

  :deep(.space-x-2 > *) {
    margin-left: 0;
  }

  :deep(.space-x-4) {
    margin-left: 0;
  }

  :deep(.space-x-4 > *) {
    margin-left: 0;
  }

  /* Override some Home.vue styles for widget context */
  :deep(section) {
    padding: 12px 0;
  }

  :deep(h1) {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  :deep(h2) {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  :deep(p) {
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }

  :deep(.grid) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  /* Dynamic color support */
  :deep(.bg-blue-500) {
    background-color: var(--widget-color, #3b82f6) !important;
  }

  :deep(.border-blue-500) {
    border-color: var(--widget-color, #3b82f6) !important;
  }
</style>
