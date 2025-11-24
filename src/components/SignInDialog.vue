<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { storeToRefs } from 'pinia'
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
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import {
    auth_sign_in,
    auth_signing_in,
    auth_cancel,
    auth_dialog_title
  } from '@/paraglide/messages'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import SignUpDialog from '@/components/SignUpDialog.vue'

  const props = withDefaults(
    defineProps<{
      open?: boolean
    }>(),
    {
      open: false
    }
  )

  const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
    (e: 'success'): void
  }>()

  const authStore = useAuthStore()
  const profileStore = useProfileStore()

  const { isLoading, error: authError } = storeToRefs(authStore)

  // Reactive state
  const isOpen = ref(props.open)
  const isSignUpDialogOpen = ref(false)
  const credentials = ref({
    email: '',
    password: ''
  })

  // Watch for prop changes
  watch(
    () => props.open,
    newValue => {
      isOpen.value = newValue
      if (newValue) {
        // Reset form when dialog opens
        credentials.value = { email: '', password: '' }
        authStore.setError(null)
      }
    }
  )

  // Watch for internal state changes and emit
  watch(isOpen, newValue => {
    emit('update:open', newValue)
  })

  // Methods
  const handleSignIn = async () => {
    authStore.setError(null)
    const result = await authStore.login(credentials.value)
    if (result.success) {
      isOpen.value = false
      credentials.value = { email: '', password: '' }
      emit('success')
    }
  }

  const handleCancel = () => {
    isOpen.value = false
  }

  const handleOpenSignUp = () => {
    isOpen.value = false
    isSignUpDialogOpen.value = true
  }

  const handleSignUpSuccess = () => {
    isSignUpDialogOpen.value = false
    emit('success')
  }
</script>

<template>
  <Dialog :open="isOpen" @update:open="isOpen = $event">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{
          auth_dialog_title({}, { locale: profileStore.currentLocale })
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
        <div v-if="authError" class="text-sm text-red-600">
          {{ authError }}
        </div>
        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="default" @click="handleCancel">
            {{ auth_cancel({}, { locale: profileStore.currentLocale }) }}
          </Button>
          <Button type="submit" :disabled="isLoading">
            <span v-if="isLoading">{{
              auth_signing_in({}, { locale: profileStore.currentLocale })
            }}</span>
            <span v-else>{{ auth_sign_in({}, { locale: profileStore.currentLocale }) }}</span>
          </Button>
        </DialogFooter>
        <div class="text-center text-sm text-muted-foreground pt-2">
          Not a user?
          <Button
            type="button"
            variant="link"
            class="p-0 h-auto font-semibold text-primary underline-offset-4 hover:underline"
            @click="handleOpenSignUp"
          >
            Register now
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
  <SignUpDialog
    :open="isSignUpDialogOpen"
    @update:open="isSignUpDialogOpen = $event"
    @success="handleSignUpSuccess"
  />
</template>
