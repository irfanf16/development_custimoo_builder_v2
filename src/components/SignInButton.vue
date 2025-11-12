<script setup lang="ts">
  import { ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useAuthStore } from '@/stores/auth/auth.store'
  import { Button } from '@/components/ui/button'
  import type { ButtonVariants } from '@/components/ui/button'
  import { auth_sign_in } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import SignInDialog from './SignInDialog.vue'

  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  const emit = defineEmits<{ (e: 'open-profile'): void }>()

  const {
    isAuthenticated: isLoggedIn,
    customer: user,
    customerInitials: userInitials
  } = storeToRefs(authStore)

  // Reactive state
  const showSignInDialog = ref(false)

  // Methods
  const handleProfileClick = () => {
    emit('open-profile')
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
      class: '!rounded-l-md !rounded-r-none'
    }
  )
</script>

<template>
  <div class="flex items-center">
    <!-- Sign In Button (when not authenticated) -->
    <template v-if="!isLoggedIn">
      <Button
        :variant="props.variant"
        :size="props.size"
        :class="props.class"
        @click="showSignInDialog = true"
      >
        {{ auth_sign_in({}, { locale: profileStore.currentLocale }) }}
      </Button>
      <SignInDialog v-model:open="showSignInDialog" />
    </template>

    <!-- User Menu (when authenticated) -->
    <div v-else class="relative">
      <Button
        :variant="props.variant"
        :size="props.size"
        :class="['flex items-center space-x-2 px-3 py-2', props.class]"
        :title="`Logged in as ${user?.first_name} ${user?.last_name}`"
        @click.stop.prevent="handleProfileClick"
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
