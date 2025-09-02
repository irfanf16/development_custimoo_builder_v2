<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
  } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import type { ButtonVariants } from '@/components/ui/button'
  import {
    auth_sign_in,
    auth_signing_in,
    auth_cancel,
    auth_dialog_title
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'

  const authStore = useAuthStore()
  const localeStore = useLocaleStore()

  // Reactive state
  const showSignInDialog = ref(false)
  const showUserMenu = ref(false)
  const credentials = ref({
    email: '',
    password: ''
  })
  const error = ref('')

  // Computed properties
  const isLoggedIn = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.customer)
  const userInitials = computed(() => authStore.customerInitials)
  const isLoading = computed(() => authStore.isLoading)

  // Methods
  const handleSignIn = async () => {
    error.value = ''
    const result = await authStore.dispatchLogin(credentials.value)
    if (result.success) {
      showSignInDialog.value = false
      credentials.value = { email: '', password: '' }
    }
  }

  const handleLogout = () => {
    authStore.logout()
    showUserMenu.value = false
  }

  const toggleUserMenu = () => {
    showUserMenu.value = !showUserMenu.value
  }

  // Presentation props for reuse across placements (e.g., topbar)
  const props = withDefaults(
    defineProps<{
      variant?: ButtonVariants['variant']
      size?: ButtonVariants['size']
      class?: string
    }>(),
    {
      variant: 'outline',
      size: 'default',
      class: 'rounded-lg'
    }
  )
</script>

<template>
  <div class="flex items-center">
    <!-- Sign In Button (when not authenticated) -->
    <Button
      v-if="!isLoggedIn"
      @click="showSignInDialog = true"
      :variant="props.variant"
      :size="props.size"
      :class="props.class"
    >
      {{ auth_sign_in({}, { locale: localeStore.currentLocale }) }}
    </Button>

    <!-- User Menu (when authenticated) -->
    <div v-else class="relative">
      <Button
        @click="toggleUserMenu"
        :variant="props.variant"
        :size="props.size"
        :class="['flex items-center space-x-2 px-3 py-2', props.class]"
        :title="`Logged in as ${user?.first_name} ${user?.last_name}`"
      >
        <div
          class="w-6 h-6 text-white text-xs font-medium rounded-full flex items-center justify-center"
          style="background-color: var(--widget-color, #3b82f6)"
        >
          {{ userInitials }}
        </div>
        <span>{{ user?.first_name }} {{ user?.last_name }}</span>
        <svg
          class="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      <!-- Simple Dropdown Menu -->
      <div
        v-if="showUserMenu"
        class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg"
        style="z-index: 99999; position: absolute !important"
      >
        <div class="py-1">
          <div class="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            <div class="font-medium">
              {{ user?.first_name }} {{ user?.last_name }}
            </div>
            <div class="text-gray-500">{{ user?.email }}</div>
          </div>
          <button
            @click="handleLogout"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>

    <!-- Sign In Dialog -->
    <Dialog v-model:open="showSignInDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{
            auth_dialog_title({}, { locale: localeStore.currentLocale })
          }}</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="handleSignIn" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              v-model="credentials.email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>
          <div v-if="error" class="text-sm text-red-600">
            {{ error }}
          </div>
          <DialogFooter>
            <button
              type="button"
              @click="showSignInDialog = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
            >
              {{ auth_cancel({}, { locale: localeStore.currentLocale }) }}
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style="background-color: var(--widget-color, #3b82f6)"
            >
              <span v-if="isLoading">{{
                auth_signing_in({}, { locale: localeStore.currentLocale })
              }}</span>
              <span v-else>{{
                auth_sign_in({}, { locale: localeStore.currentLocale })
              }}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
