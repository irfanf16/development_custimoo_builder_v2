<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '@/components/ui/card'
  import { useRouter } from 'vue-router'

  const router = useRouter()
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Hero Section -->
    <section class="py-12 text-center">
      <h1 class="text-4xl font-bold tracking-tight lg:text-5xl mb-6">
        About Customizer
      </h1>
      <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
        A modern component library built with Vue 3, TypeScript, and Tailwind
        CSS. Designed to help developers build beautiful, accessible, and
        maintainable user interfaces.
      </p>
    </section>

    <!-- Mission Section -->
    <section class="py-12">
      <Card>
        <CardHeader>
          <CardTitle>Our Mission</CardTitle>
          <CardDescription>
            Empowering developers to build better user interfaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground mb-4">
            Customizer was created with the goal of providing developers with a
            comprehensive set of pre-built components that follow modern design
            principles and accessibility standards. We believe that great user
            interfaces should be both beautiful and functional.
          </p>
          <p class="text-muted-foreground">
            Our components are built on top of Vue 3's Composition API,
            providing excellent TypeScript support and a developer experience
            that scales with your application.
          </p>
        </CardContent>
      </Card>
    </section>

    <!-- Features Section -->
    <section class="py-12">
      <h2 class="text-3xl font-bold text-center mb-8">
        Why Choose Customizer?
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>🎨 Beautiful by Default</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Every component is designed with modern aesthetics in mind. Clean,
              minimal, and professional out of the box.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>♿ Accessible</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Built with accessibility as a first-class concern. All components
              follow WAI-ARIA guidelines and support keyboard navigation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔧 Customizable</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Easy to customize and extend. Use CSS variables, Tailwind classes,
              or create your own variants to match your design system.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚡ Performant</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-sm text-muted-foreground">
              Optimized for performance with tree-shaking support and minimal
              bundle size. Only include what you use.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- Tech Stack Section -->
    <section class="py-12">
      <Card>
        <CardHeader>
          <CardTitle>Built with Modern Technologies</CardTitle>
          <CardDescription>
            Leveraging the best tools in the ecosystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 border rounded-lg">
              <div class="text-2xl mb-2">⚡</div>
              <div class="font-semibold">Vue 3</div>
              <div class="text-sm text-muted-foreground">Composition API</div>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-2xl mb-2">🔷</div>
              <div class="font-semibold">TypeScript</div>
              <div class="text-sm text-muted-foreground">Type Safety</div>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-2xl mb-2">🎨</div>
              <div class="font-semibold">Tailwind CSS</div>
              <div class="text-sm text-muted-foreground">Utility First</div>
            </div>
            <div class="text-center p-4 border rounded-lg">
              <div class="text-2xl mb-2">🧩</div>
              <div class="font-semibold">shadcn/ui</div>
              <div class="text-sm text-muted-foreground">Component System</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    <!-- CTA Section -->
    <section class="py-12 text-center">
      <h2 class="text-3xl font-bold mb-4">Ready to get started?</h2>
      <p class="text-muted-foreground mb-6 max-w-2xl mx-auto">
        Start building beautiful user interfaces with Customizer today.
      </p>
      <div class="flex justify-center space-x-4">
        <Button size="lg" @click="router.push('/dashboard')"
          >Try Dashboard</Button
        >
        <Button variant="outline" size="lg">View Documentation</Button>
      </div>
    </section>
  </div>
</template>
