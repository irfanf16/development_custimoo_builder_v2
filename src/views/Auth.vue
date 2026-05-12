<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth/auth.store'

  const router = useRouter()
  const authStore = useAuthStore()

  const loginForm = ref({
    email: '',
    password: ''
  })

  const registerForm = ref({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleLogin = async () => {
    const result = await authStore.login(loginForm.value)
    if (result.success) {
      loginForm.value = { email: '', password: '' }
      router.push('/')
    }
  }
</script>

<template>
  <div data-testid="auth-root" class="max-w-md mx-auto">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">Welcome to Customizer</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one to get started
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Login Form -->
        <div data-testid="auth-form-login" class="space-y-4">
          <div>
            <label for="auth-email" class="block text-sm font-medium mb-2">Email</label>
            <input
              id="auth-email"
              v-model="loginForm.email"
              type="email"
              data-testid="auth-field-email"
              class="w-full rounded-md border px-3 py-2"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label for="auth-password" class="block text-sm font-medium mb-2">Password</label>
            <input
              id="auth-password"
              v-model="loginForm.password"
              type="password"
              data-testid="auth-field-password"
              class="w-full rounded-md border px-3 py-2"
              placeholder="Enter your password"
            />
          </div>
          <Button data-testid="auth-button-login" class="w-full" :disabled="authStore.isLoading" @click="handleLogin">
            {{ authStore.isLoading ? 'Signing In...' : 'Sign In' }}
          </Button>
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <!-- Register Form -->
        <div data-testid="auth-form-register" class="space-y-4">
          <div>
            <label for="auth-name" class="block text-sm font-medium mb-2">Full Name</label>
            <input
              id="auth-name"
              v-model="registerForm.name"
              type="text"
              data-testid="auth-field-name"
              class="w-full rounded-md border px-3 py-2"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label for="auth-reg-email" class="block text-sm font-medium mb-2">Email</label>
            <input
              id="auth-reg-email"
              v-model="registerForm.email"
              type="email"
              data-testid="auth-field-reg-email"
              class="w-full rounded-md border px-3 py-2"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label for="auth-reg-password" class="block text-sm font-medium mb-2">Password</label>
            <input
              id="auth-reg-password"
              v-model="registerForm.password"
              type="password"
              data-testid="auth-field-reg-password"
              class="w-full rounded-md border px-3 py-2"
              placeholder="Create a password"
            />
          </div>
          <div>
            <label for="auth-confirm-password" class="block text-sm font-medium mb-2"
              >Confirm Password</label
            >
            <input
              id="auth-confirm-password"
              v-model="registerForm.confirmPassword"
              type="password"
              data-testid="auth-field-confirm-password"
              class="w-full rounded-md border px-3 py-2"
              placeholder="Confirm your password"
            />
          </div>
          <Button data-testid="auth-button-register" variant="default" class="w-full" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? 'Creating Account...' : 'Create Account' }}
          </Button>
        </div>

        <!-- Error Display -->
        <div v-if="authStore.error" data-testid="auth-error" class="text-red-600 text-sm text-center">
          {{ authStore.error }}
        </div>

        <div class="text-center text-sm text-muted-foreground">
          By signing up, you agree to our
          <a href="#" class="text-primary hover:underline">Terms of Service</a>
          and
          <a href="#" class="text-primary hover:underline">Privacy Policy</a>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
