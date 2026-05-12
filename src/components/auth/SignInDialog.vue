<script setup lang="ts">
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
    auth_dialog_title,
    auth_placeholder_email,
    auth_placeholder_password,
    auth_register_now,
    auth_not_a_user,
    auth_password_label,
    profile_email,
    msg_forgot_password_question
  } from '@/paraglide/messages'
  import { useSignIn } from '@/composables/useSignIn'
  import SignUpDialog from './SignUpDialog.vue'
  import ForgotPasswordDialog from './ForgotPasswordDialog.vue'

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const {
    isSignInDialogOpen,
    isSignUpDialogOpen,
    isForgotPasswordDialogOpen,
    credentials,
    isLoading,
    authError,
    currentLocale,
    setSignInDialogOpen,
    setForgotPasswordDialogOpen,
    handleSignIn,
    handleCancel,
    handleOpenSignUp,
    handleOpenForgotPassword,
    handleSignUpSuccess: handleSignUpSuccessBase
  } = useSignIn()

  // Methods
  const handleSignInSubmit = async () => {
    const success = await handleSignIn()
    if (success) {
      emit('success')
    }
  }

  const handleSignUpSuccess = () => {
    handleSignUpSuccessBase()
    emit('success')
  }
</script>

<template>
  <Dialog :open="isSignInDialogOpen" @update:open="setSignInDialogOpen">
    <DialogContent data-testid="auth-dialog-sign-in" class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ auth_dialog_title({}, { locale: currentLocale }) }}</DialogTitle>
        <DialogDescription> Enter your credentials to access your account. </DialogDescription>
      </DialogHeader>
      <form data-testid="auth-form-credentials" class="space-y-4" @submit.prevent="handleSignInSubmit">
        <div class="grid gap-2">
          <Label for="email">{{ profile_email({}, { locale: currentLocale }) }}</Label>
          <Input
            id="email"
            v-model="credentials.email"
            type="email"
            required
            data-testid="auth-field-email"
            :placeholder="auth_placeholder_email({}, { locale: currentLocale })"
            autocomplete="email"
          />
        </div>
        <div class="grid gap-2">
          <Label for="password">{{ auth_password_label({}, { locale: currentLocale }) }}</Label>
          <Input
            id="password"
            v-model="credentials.password"
            type="password"
            required
            data-testid="auth-field-password"
            :placeholder="auth_placeholder_password({}, { locale: currentLocale })"
            autocomplete="current-password"
          />
        </div>
        <div v-if="authError" data-testid="auth-error" class="text-sm text-red-600">
          {{ authError }}
        </div>
        <DialogFooter class="flex sm:justify-between w-full gap-2 test-class">
          <div class="flex items-center">
            <Button
              type="button"
              variant="link"
              data-testid="auth-button-forgot-password"
              class="p-0 h-auto font-semibold text-primary underline-offset-4 hover:underline"
              @click="handleOpenForgotPassword"
            >
              {{ msg_forgot_password_question({}, { locale: currentLocale }) }}
            </Button>
          </div>
          <div class="flex gap-1">
            <Button data-testid="auth-button-cancel" type="button" variant="default" @click="handleCancel">
              {{ auth_cancel({}, { locale: currentLocale }) }}
            </Button>
            <Button data-testid="auth-button-submit" type="submit" :disabled="isLoading">
              <span v-if="isLoading">{{ auth_signing_in({}, { locale: currentLocale }) }}</span>
              <span v-else>{{ auth_sign_in({}, { locale: currentLocale }) }}</span>
            </Button>
          </div>
        </DialogFooter>
        <div class="text-center text-sm text-muted-foreground pt-2">
          {{ auth_not_a_user({}, { locale: currentLocale }) }}
          <Button
            type="button"
            variant="link"
            data-testid="auth-button-register"
            class="p-0 h-auto font-semibold text-primary underline-offset-4 hover:underline"
            @click="handleOpenSignUp"
          >
            {{ auth_register_now({}, { locale: currentLocale }) }}
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
  <ForgotPasswordDialog
    :open="isForgotPasswordDialogOpen"
    @update:open="setForgotPasswordDialogOpen"
    @success="handleSignUpSuccess"
  />
</template>
