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
  import { FormTextField } from '@/components/ui/form'
  import { useSignIn } from '@/composables/useSignIn'
  import { useForm } from 'vee-validate'
  import { toTypedSchema } from '@vee-validate/zod'
  import * as z from 'zod'
  import { useRoute, useRouter } from 'vue-router'
  import { toast } from 'vue-sonner'
  import {
    auth_password_label,
    auth_placeholder_password,
    reset_password,
    profile_email,
    auth_confirm_password_label,
    auth_placeholder_confirm_password
  } from '@/paraglide/messages'

  const {
    currentLocale,
    isResetPasswordDialogOpen,
    setResetPasswordDialogOpen,
    handleResetPassword,
    isLoading,
    authError
  } = useSignIn()
  const route = useRoute()
  const router = useRouter()

  const formSchema = toTypedSchema(
    z
      .object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
      })
      .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword']
      })
  )

  const { handleSubmit, resetForm } = useForm({
    validationSchema: formSchema
  })

  const onSubmit = handleSubmit(async values => {
    const token = (route.params.password_token || route.query.password_token) as string
    if (!token) {
      toast.error('Reset token is missing from URL')
      return
    }

    const success = await handleResetPassword({
      email_address: values.email,
      password: values.password,
      confirm_password: values.confirmPassword,
      token: token
    })

    if (success) {
      toast.success('Password reset successfully')
      setResetPasswordDialogOpen(false)
      resetForm()
      router.replace('/')
    }
  })
</script>

<template>
  <Dialog :open="isResetPasswordDialogOpen" @update:open="setResetPasswordDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogDescription>Enter your new password below to reset it.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <FormTextField
          name="email"
          :label="profile_email({}, { locale: currentLocale })"
          type="email"
          :placeholder="profile_email({}, { locale: currentLocale })"
          autocomplete="email"
        />
        <FormTextField
          name="password"
          :label="auth_password_label({}, { locale: currentLocale })"
          type="password"
          :placeholder="auth_placeholder_password({}, { locale: currentLocale })"
          autocomplete="new-password"
        />
        <FormTextField
          name="confirmPassword"
          :label="auth_confirm_password_label({}, { locale: currentLocale })"
          type="password"
          :placeholder="auth_placeholder_confirm_password({}, { locale: currentLocale })"
          autocomplete="new-password"
        />

        <div v-if="authError" class="text-sm text-red-600">
          {{ authError }}
        </div>

        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <Button type="submit" :loading="isLoading" :disabled="isLoading">
            {{ reset_password({}, { locale: currentLocale }) }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
