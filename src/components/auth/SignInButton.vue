<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import type { ButtonVariants } from '@/components/ui/button'
  import { LogIn } from 'lucide-vue-next'
  import { auth_sign_in } from '@/paraglide/messages'
  import { useSignIn } from '@/composables/useSignIn'

  const emit = defineEmits<{ (e: 'open-profile'): void }>()

  const {
    isAuthenticated: isLoggedIn,
    customer: user,
    customerInitials: userInitials,
    currentLocale,
    openSignInDialog
  } = useSignIn()

  // Methods
  const handleProfileClick = () => {
    emit('open-profile')
  }

  const handleSignInClick = () => {
    openSignInDialog()
  }

  // Presentation props for reuse across placements (e.g., topbar)
  const props = withDefaults(
    defineProps<{
      variant?: ButtonVariants['variant']
      size?: ButtonVariants['size']
      class?: string
      /** When true, show icon only (for compact topbar) */
      compact?: boolean
    }>(),
    {
      variant: 'outline',
      size: 'default',
      class: '!rounded-l-md !rounded-r-none',
      compact: false
    }
  )
</script>

<template>
  <div data-testid="auth-sign-in-button-root" class="flex items-center">
    <!-- Sign In Button (when not authenticated) -->
    <template v-if="!isLoggedIn">
      <Button
        data-testid="auth-button-sign-in"
        :variant="props.variant"
        :size="props.compact ? 'icon' : props.size"
        :class="props.class"
        @click="handleSignInClick"
      >
        <LogIn v-if="props.compact" class="size-4" />
        <template v-else>{{ auth_sign_in({}, { locale: currentLocale }) }}</template>
      </Button>
    </template>

    <!-- User Menu (when authenticated) -->
    <div v-else class="relative">
      <Button
        data-testid="auth-button-profile"
        :variant="props.variant"
        :size="props.compact ? 'icon' : props.size"
        :class="['flex items-center space-x-2 px-3 py-2', props.class]"
        :title="`Logged in as ${user?.first_name} ${user?.last_name}`"
        @click.stop.prevent="handleProfileClick"
      >
        <template v-if="props.compact">
          <div
            class="w-6 h-6 min-w-6 min-h-6 shrink-0 text-white text-xs font-medium rounded-full flex items-center justify-center"
            style="background-color: var(--widget-color, #3b82f6)"
          >
            {{ userInitials }}
          </div>
        </template>
        <template v-else>
          <div
            class="w-6 h-6 text-white text-xs font-medium rounded-full flex items-center justify-center"
            style="background-color: var(--widget-color, #3b82f6)"
          >
            {{ userInitials }}
          </div>
          <span>{{ user?.first_name }}</span>
        </template>
      </Button>
    </div>
  </div>
</template>
