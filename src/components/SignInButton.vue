<script setup lang="ts">
  import { ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
  } from '@/components/ui/dialog'
  import { Button } from '@/components/ui/button'
  import type { ButtonVariants } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import {
    auth_sign_in,
    auth_signing_in,
    auth_cancel,
    auth_dialog_title
  } from '@/paraglide/messages'
  import { useLocaleStore } from '@/stores/locale/locale.store'

  const authStore = useAuthStore()
  const localeStore = useLocaleStore()

  const {
    isAuthenticated: isLoggedIn,
    customer: user,
    customerInitials: userInitials,
    isLoading
  } = storeToRefs(authStore)

  // Reactive state
  const showSignInDialog = ref(false)
  const showUserMenu = ref(false)
  const credentials = ref({
    email: '',
    password: ''
  })
  const error = ref('')

  // Methods
  const handleSignIn = async () => {
    error.value = ''
    const result = await authStore.login(credentials.value)
    if (result.success) {
      showSignInDialog.value = false
      credentials.value = { email: '', password: '' }
    }
  }

  const toggleUserMenu = (e: MouseEvent) => {
    e.stopPropagation()
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
      class: '!rounded-l-md rounded-r-none'
    }
  )
</script>

<template>
  <div class="flex items-center">
    <!-- Sign In Button (when not authenticated) -->

    <!-- Sign In Dialog -->
    <Dialog v-if="!isLoggedIn">
      <DialogTrigger as-child>
        <Button :variant="props.variant" :size="props.size" :class="isLoggedIn ?? props.class">
          {{ auth_sign_in({}, { locale: localeStore.currentLocale }) }}
        </Button>
      </DialogTrigger>
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{
            auth_dialog_title({}, { locale: localeStore.currentLocale })
          }}</DialogTitle>
          <DialogDescription> Enter your credentials to access your account. </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleSignIn">
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="credentials.email"
              type="email"
              required
              placeholder="Enter your email"
              autocomplete="email"
            />
          </div>
          <div class="grid gap-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="credentials.password"
              type="password"
              required
              placeholder="Enter your password"
              autocomplete="current-password"
            />
          </div>
          <div v-if="error" class="text-sm text-red-600">
            {{ error }}
          </div>
          <DialogFooter>
            <Button type="button" variant="default" @click="showSignInDialog = false">
              {{ auth_cancel({}, { locale: localeStore.currentLocale }) }}
            </Button>
            <Button type="submit" :disabled="isLoading">
              <span v-if="isLoading">{{
                auth_signing_in({}, { locale: localeStore.currentLocale })
              }}</span>
              <span v-else>{{ auth_sign_in({}, { locale: localeStore.currentLocale }) }}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- User Menu (when authenticated) -->
    <div v-else class="relative">
      <Button
        :variant="props.variant"
        :size="props.size"
        :class="['flex items-center space-x-2 px-3 py-2', props.class]"
        :title="`Logged in as ${user?.first_name} ${user?.last_name}`"
        @click="(e: MouseEvent) => toggleUserMenu(e)"
      >
        <div
          class="w-6 h-6 text-white text-xs font-medium rounded-full flex items-center justify-center"
          style="background-color: var(--widget-color, #3b82f6)"
        >
          {{ userInitials }}
        </div>
        <span>{{ user?.first_name }}</span>
      </Button>
    </div>
  </div>
</template>
