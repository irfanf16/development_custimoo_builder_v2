<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const isLoginOpen = ref(false)
const isRegisterOpen = ref(false)
const isMobileMenuOpen = ref(false)

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

const handleLogin = () => {
  console.log('Login:', loginForm.value)
  isLoginOpen.value = false
  loginForm.value = { email: '', password: '' }
}

const handleRegister = () => {
  console.log('Register:', registerForm.value)
  isRegisterOpen.value = false
  registerForm.value = { name: '', email: '', password: '', confirmPassword: '' }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Header -->
    <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                  <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul class="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li class="row-span-3">
                        <NavigationMenuLink as-child>
                          <a
                            class="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/"
                          >
                            <div class="mb-2 mt-4 text-lg font-medium">
                              Customizer
                            </div>
                            <p class="text-sm leading-tight text-muted-foreground">
                              Beautiful components that you can copy and paste into your apps. Accessible. Customizable. Open Source.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink as-child>
                          <a
                            class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="/docs"
                          >
                            <div class="text-sm font-medium leading-none">Introduction</div>
                            <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Build high-quality, accessible design systems and web apps.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink as-child>
                          <a
                            class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="/docs/installation"
                          >
                            <div class="text-sm font-medium leading-none">Installation</div>
                            <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              How to install dependencies and structure your app.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink as-child>
                          <a
                            class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="/docs/primitives/typography"
                          >
                            <div class="text-sm font-medium leading-none">Typography</div>
                            <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Styles for headings, paragraphs, lists...etc
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" href="/components">
                    Components
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink class="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50" href="/examples">
                    Examples
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <!-- Auth Buttons -->
          <div class="hidden md:flex items-center space-x-2">
            <Dialog v-model:open="isLoginOpen">
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
                  <Button @click="handleLogin">Sign In</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog v-model:open="isRegisterOpen">
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
                    <label for="reg-password" class="text-right">Password</label>
                    <input
                      id="reg-password"
                      v-model="registerForm.password"
                      type="password"
                      class="col-span-3 rounded-md border px-3 py-2"
                      placeholder="Enter your password"
                    />
                  </div>
                  <div class="grid grid-cols-4 items-center gap-4">
                    <label for="confirm-password" class="text-right">Confirm</label>
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
                  <Button @click="handleRegister">Create Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <!-- Mobile Menu -->
          <Sheet v-model:open="isMobileMenuOpen">
            <SheetTrigger as-child class="md:hidden">
              <Button variant="ghost" size="icon">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
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
                <Button variant="ghost" class="justify-start">Getting Started</Button>
                <Button variant="ghost" class="justify-start">Components</Button>
                <Button variant="ghost" class="justify-start">Examples</Button>
                <div class="border-t pt-4">
                  <Button variant="ghost" class="justify-start w-full" @click="isLoginOpen = true">Sign In</Button>
                  <Button class="justify-start w-full mt-2" @click="isRegisterOpen = true">Sign Up</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <!-- Hero Section -->
      <section class="py-12 text-center">
        <h1 class="text-4xl font-bold tracking-tight lg:text-5xl">
          Welcome to Customizer
        </h1>
        <p class="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          A beautiful and modern component library built with Vue 3 and Tailwind CSS. 
          Create stunning user interfaces with ease.
        </p>
        <div class="mt-8 flex justify-center space-x-4">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">View Components</Button>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="py-12">
        <h2 class="text-3xl font-bold text-center mb-8">Features</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessible</CardTitle>
              <CardDescription>
                All components follow WAI-ARIA guidelines and support keyboard navigation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                Built with accessibility in mind from the ground up. Every component is tested with screen readers and keyboard navigation.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Learn More</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customizable</CardTitle>
              <CardDescription>
                Easily customize components to match your design system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                Use CSS variables, Tailwind classes, or create your own variants. The possibilities are endless.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Learn More</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Type Safe</CardTitle>
              <CardDescription>
                Full TypeScript support with excellent developer experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p class="text-sm text-muted-foreground">
                Built with TypeScript from day one. Get autocomplete, type checking, and better refactoring support.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Learn More</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-12 bg-muted/50 rounded-lg">
        <div class="text-center">
          <h2 class="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p class="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of developers who are already building amazing user interfaces with our components.
          </p>
          <div class="flex justify-center space-x-4">
            <Button size="lg">Start Building</Button>
            <Button variant="outline" size="lg">View Documentation</Button>
          </div>
        </div>
      </section>
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
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Buttons</a></li>
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Cards</a></li>
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Dialogs</a></li>
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Navigation</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Resources</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Documentation</a></li>
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Examples</a></li>
              <li><a href="#" class="text-muted-foreground hover:text-foreground">GitHub</a></li>
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Discord</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Legal</h4>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Privacy</a></li>
              <li><a href="#" class="text-muted-foreground hover:text-foreground">Terms</a></li>
              <li><a href="#" class="text-muted-foreground hover:text-foreground">License</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © 2024 Customizer. All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</template>
