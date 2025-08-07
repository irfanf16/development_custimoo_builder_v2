<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
  } from '@/components/ui/card'
</script>

<template>
  <!-- Hero Section -->
  <section class="py-12 text-center">
    <h1 class="text-4xl font-bold tracking-tight lg:text-5xl">
      Welcome to Customizer
    </h1>
    <p class="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
      A beautiful and modern component library built with Vue 3 and Tailwind
      CSS. Create stunning user interfaces with ease.
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
            All components follow WAI-ARIA guidelines and support keyboard
            navigation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Built with accessibility in mind from the ground up. Every component
            is tested with screen readers and keyboard navigation.
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
            Use CSS variables, Tailwind classes, or create your own variants.
            The possibilities are endless.
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
            Built with TypeScript from day one. Get autocomplete, type checking,
            and better refactoring support.
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
        Join thousands of developers who are already building amazing user
        interfaces with our components.
      </p>
      <div class="flex justify-center space-x-4">
        <Button size="lg">Start Building</Button>
        <Button variant="outline" size="lg">View Documentation</Button>
      </div>
    </div>
  </section>
</template>
