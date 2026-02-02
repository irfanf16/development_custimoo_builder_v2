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
    profile_email
  } from '@/paraglide/messages'
  import { useSignIn } from '@/composables/useSignIn'
  import SignUpDialog from './SignUpDialog.vue'

  const emit = defineEmits<{
    (e: 'success'): void
  }>()

  const {
    isSignInDialogOpen,
    isSignUpDialogOpen,
    credentials,
    isLoading,
    authError,
    currentLocale,
    setSignInDialogOpen,
    handleSignIn,
    handleCancel,
    handleOpenSignUp,
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
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ auth_dialog_title({}, { locale: currentLocale }) }}</DialogTitle>
        <DialogDescription> Enter your credentials to access your account. </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSignInSubmit">
        <div class="grid gap-2">
          <Label for="email">{{ profile_email({}, { locale: currentLocale }) }}</Label>
          <Input
            id="email"
            v-model="credentials.email"
            type="email"
            required
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
            :placeholder="auth_placeholder_password({}, { locale: currentLocale })"
            autocomplete="current-password"
          />
        </div>
        <div v-if="authError" class="text-sm text-red-600">
          {{ authError }}
        </div>
        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <Button type="button" variant="default" @click="handleCancel">
            {{ auth_cancel({}, { locale: currentLocale }) }}
          </Button>
          <Button type="submit" :disabled="isLoading">
            <span v-if="isLoading">{{ auth_signing_in({}, { locale: currentLocale }) }}</span>
            <span v-else>{{ auth_sign_in({}, { locale: currentLocale }) }}</span>
          </Button>
        </DialogFooter>
        <div class="text-center text-sm text-muted-foreground pt-2">
          {{ auth_not_a_user({}, { locale: currentLocale }) }}
          <Button
            type="button"
            variant="link"
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
</template>
