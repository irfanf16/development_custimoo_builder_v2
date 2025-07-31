<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
  } from '@/components/ui/navigation-menu'
  import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
  } from '@/components/ui/sheet'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
  } from '@/components/ui/dialog'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'

  const router = useRouter()
  const authStore = useAuthStore()
  const uiStore = useUIStore()

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
      uiStore.closeLoginDialog()
      loginForm.value = { email: '', password: '' }
      router.push('/dashboard')
    }
  }

  const handleRegister = async () => {
    const result = await authStore.register(registerForm.value)
    if (result.success) {
      uiStore.closeRegisterDialog()
      registerForm.value = {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
      router.push('/dashboard')
    }
  }

  const handleLogout = () => {
    authStore.logout()
    router.push('/')
  }
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header
      class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center space-x-2">
            <div class="h-8 w-8 rounded-lg bg-primary"></div>
            <span class="text-xl font-bold">Customizer</span>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    :class="{ 'bg-accent/50': $route.path === '/' }"
                    @click="router.push('/')"
                  >
                    Home
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    :class="{ 'bg-accent/50': $route.path === '/about' }"
                    @click="router.push('/about')"
                  >
                    About
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem v-if="authStore.isLoggedIn">
                  <NavigationMenuLink
                    class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    :class="{ 'bg-accent/50': $route.path === '/dashboard' }"
                    @click="router.push('/dashboard')"
                  >
                    Dashboard
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <!-- Auth Buttons -->
          <div class="hidden md:flex items-center space-x-2">
            <template v-if="!authStore.isLoggedIn">
              <Dialog v-model:open="uiStore.isLoginDialogOpen">
                <DialogTrigger as-child>
                  <Button variant="ghost">Sign In</Button>
                </DialogTrigger>
                <DialogContent class="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Sign In</DialogTitle>
                    <DialogDescription>
                      Enter your credentials to access your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                      <label for="email" class="text-right">Email</label>
                      <input
                        id="email"
                        v-model="loginForm.email"
                        type="email"
                        class="col-span-3 rounded-md border px-3 py-2"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                      <label for="password" class="text-right">Password</label>
                      <input
                        id="password"
                        v-model="loginForm.password"
                        type="password"
                        class="col-span-3 rounded-md border px-3 py-2"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      @click="handleLogin"
                      :disabled="authStore.isLoading"
                    >
                      {{ authStore.isLoading ? 'Signing In...' : 'Sign In' }}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog v-model:open="uiStore.isRegisterDialogOpen">
                <DialogTrigger as-child>
                  <Button>Sign Up</Button>
                </DialogTrigger>
                <DialogContent class="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create Account</DialogTitle>
                    <DialogDescription>
                      Fill in the information below to create your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div class="grid gap-4 py-4">
                    <div class="grid grid-cols-4 items-center gap-4">
                      <label for="name" class="text-right">Name</label>
                      <input
                        id="name"
                        v-model="registerForm.name"
                        type="text"
                        class="col-span-3 rounded-md border px-3 py-2"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                      <label for="reg-email" class="text-right">Email</label>
                      <input
                        id="reg-email"
                        v-model="registerForm.email"
                        type="email"
                        class="col-span-3 rounded-md border px-3 py-2"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                      <label for="reg-password" class="text-right"
                        >Password</label
                      >
                      <input
                        id="reg-password"
                        v-model="registerForm.password"
                        type="password"
                        class="col-span-3 rounded-md border px-3 py-2"
                        placeholder="Enter your password"
                      />
                    </div>
                    <div class="grid grid-cols-4 items-center gap-4">
                      <label for="confirm-password" class="text-right"
                        >Confirm</label
                      >
                      <input
                        id="confirm-password"
                        v-model="registerForm.confirmPassword"
                        type="password"
                        class="col-span-3 rounded-md border px-3 py-2"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      @click="handleRegister"
                      :disabled="authStore.isLoading"
                    >
                      {{
                        authStore.isLoading
                          ? 'Creating Account...'
                          : 'Create Account'
                      }}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </template>
            <template v-else>
              <Button variant="ghost" @click="router.push('/profile')"
                >Profile</Button
              >
              <Button variant="outline" @click="handleLogout">Logout</Button>
            </template>
          </div>

          <!-- Mobile Menu -->
          <Sheet v-model:open="uiStore.isMobileMenuOpen">
            <SheetTrigger as-child class="md:hidden">
              <Button variant="ghost" size="icon">
                <svg
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  ></path>
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Navigate through the application
                </SheetDescription>
              </SheetHeader>
              <div class="flex flex-col space-y-4 mt-6">
                <Button
                  variant="ghost"
                  class="justify-start"
                  @click="router.push('/')"
                  >Home</Button
                >
                <Button
                  variant="ghost"
                  class="justify-start"
                  @click="router.push('/about')"
                  >About</Button
                >
                <Button
                  v-if="authStore.isLoggedIn"
                  variant="ghost"
                  class="justify-start"
                  @click="router.push('/dashboard')"
                  >Dashboard</Button
                >
                <Button
                  v-if="authStore.isLoggedIn"
                  variant="ghost"
                  class="justify-start"
                  @click="router.push('/profile')"
                  >Profile</Button
                >
                <div class="border-t pt-4">
                  <template v-if="!authStore.isLoggedIn">
                    <Button
                      variant="ghost"
                      class="justify-start w-full"
                      @click="uiStore.openLoginDialog"
                      >Sign In</Button
                    >
                    <Button
                      class="justify-start w-full mt-2"
                      @click="uiStore.openRegisterDialog"
                      >Sign Up</Button
                    >
                  </template>
                  <Button
                    v-else
                    variant="outline"
                    class="justify-start w-full mt-2"
                    @click="handleLogout"
                    >Logout</Button
                  >
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t bg-background">
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="font-semibold mb-4">Customizer</h3>
            <p class="text-sm text-muted-foreground">
              Beautiful components that you can copy and paste into your apps.
            </p>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Components</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Buttons</a
                >
              </li>
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Cards</a
                >
              </li>
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Dialogs</a
                >
              </li>
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Navigation</a
                >
              </li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Resources</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Documentation</a
                >
              </li>
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Examples</a
                >
              </li>
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >GitHub</a
                >
              </li>
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Discord</a
                >
              </li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Legal</h4>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Privacy</a
                >
              </li>
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >Terms</a
                >
              </li>
              <li>
                <a href="#" class="text-muted-foreground hover:text-foreground"
                  >License</a
                >
              </li>
            </ul>
          </div>
        </div>
        <div
          class="border-t mt-8 pt-8 text-center text-sm text-muted-foreground"
        >
          © 2024 Customizer. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>
