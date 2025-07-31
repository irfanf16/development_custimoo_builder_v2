<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '@/components/ui/card'
  import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
  } from '@/components/ui/sheet'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'

  const router = useRouter()
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  const handleLogout = () => {
    authStore.logout()
    router.push('/')
  }

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Profile', path: '/profile', icon: '👤' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
    { name: 'Analytics', path: '/analytics', icon: '📈' }
  ]
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
          <nav class="hidden md:flex items-center space-x-4">
            <Button variant="ghost" @click="router.push('/')"
              >Back to Home</Button
            >
          </nav>

          <!-- User Menu -->
          <div class="flex items-center space-x-2">
            <Button variant="ghost" @click="router.push('/profile')"
              >Profile</Button
            >
            <Button variant="outline" @click="handleLogout">Logout</Button>
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
                <SheetTitle>Dashboard Menu</SheetTitle>
                <SheetDescription>
                  Navigate through your dashboard
                </SheetDescription>
              </SheetHeader>
              <div class="flex flex-col space-y-4 mt-6">
                <Button
                  variant="ghost"
                  class="justify-start"
                  @click="router.push('/')"
                  >Back to Home</Button
                >
                <div class="border-t pt-4">
                  <div
                    v-for="item in navigationItems"
                    :key="item.path"
                    class="mb-2"
                  >
                    <Button
                      variant="ghost"
                      class="justify-start w-full"
                      :class="{ 'bg-accent': $route.path === item.path }"
                      @click="router.push(item.path)"
                    >
                      <span class="mr-2">{{ item.icon }}</span>
                      {{ item.name }}
                    </Button>
                  </div>
                </div>
                <div class="border-t pt-4">
                  <Button
                    variant="outline"
                    class="justify-start w-full"
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

    <div class="flex">
      <!-- Sidebar -->
      <aside class="hidden md:block w-64 min-h-screen border-r bg-background">
        <div class="p-6">
          <h2 class="text-lg font-semibold mb-6">Dashboard</h2>
          <nav class="space-y-2">
            <div v-for="item in navigationItems" :key="item.path">
              <Button
                variant="ghost"
                class="w-full justify-start"
                :class="{ 'bg-accent': $route.path === item.path }"
                @click="router.push(item.path)"
              >
                <span class="mr-2">{{ item.icon }}</span>
                {{ item.name }}
              </Button>
            </div>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-6">
        <div class="max-w-7xl mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
