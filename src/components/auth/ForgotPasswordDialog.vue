<script setup lang="ts">
  import { watch } from 'vue'
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
  import {
    forgot_password_dialog_title,
    forgot_password_dialog_description,
    auth_placeholder_email,
    auth_cancel,
    auth_send_reset_link
  } from '@/paraglide/messages'
  import { toast } from 'vue-sonner'
  import { useSignIn } from '@/composables/useSignIn'
  import SignUpDialog from './SignUpDialog.vue'

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const {
    isSignUpDialogOpen,
    credentials,
    isLoading,
    authError,
    currentLocale,
    setForgotPasswordDialogOpen,
    isForgotPasswordDialogOpen,
    handleOpenSignIn,
    handleForgotPassword,
    clearAuthError,
    handleSignUpSuccess: handleSignUpSuccessBase
  } = useSignIn()

  // Reset state when dialog opens
  watch(
    () => isForgotPasswordDialogOpen.value,
    isOpen => {
      if (isOpen) {
        // We could reset authError here if needed, but usually it's handled by handleForgotPassword
      }
    }
  )

  // Methods
  const handleForgotPasswordSubmit = async () => {
    const success = await handleForgotPassword()
    if (success) {
      toast.success(authError.value || '', {
        position: 'top-right',
        richColors: true
      })
      setForgotPasswordDialogOpen(false)
      clearAuthError()
    }
  }

  const handleSignUpSuccess = () => {
    handleSignUpSuccessBase()
    emit('success')
  }
</script>

<template>
  <Dialog :open="isForgotPasswordDialogOpen" @update:open="setForgotPasswordDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ forgot_password_dialog_title({}, { locale: currentLocale }) }}</DialogTitle>
        <DialogDescription>
          {{ forgot_password_dialog_description({}, { locale: currentLocale }) }}
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleForgotPasswordSubmit">
        <div class="grid gap-2">
          <Input
            id="email"
            v-model="credentials.email"
            type="email"
            required
            :placeholder="auth_placeholder_email({}, { locale: currentLocale })"
            autocomplete="email"
          />
        </div>
        <div v-if="authError" class="text-sm text-red-600">
          {{ authError }}
        </div>
        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="default" @click="handleOpenSignIn">
            {{ auth_cancel({}, { locale: currentLocale }) }}
          </Button>
          <Button type="submit" :loading="isLoading" :disabled="isLoading">
            <span>{{ auth_send_reset_link({}, { locale: currentLocale }) }}</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  <SignUpDialog
    :open="isSignUpDialogOpen"
    @update:open="isSignUpDialogOpen = $event"
    @success="handleSignUpSuccess"
  />
</template>
