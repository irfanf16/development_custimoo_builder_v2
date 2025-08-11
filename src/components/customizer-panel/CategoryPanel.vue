<script setup lang="ts">
  import { ref } from 'vue'
  import {
    Card,
    CardHeader,
    CardTitle,
    CardContent
  } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import {
    Check,
    ChevronRight,
    Shirt,
    Bike,
    Dumbbell,
    Volleyball,
    Droplets,
    Trophy
  } from 'lucide-vue-next'

  type Category = {
    id: string
    label: string
    icon: any
  }

  const categories = ref<Category[]>([
    { id: 'hockey', label: 'Hockey', icon: Dumbbell },
    { id: 'soccer', label: 'Soccer', icon: Trophy },
    { id: 'basketball', label: 'Basketball', icon: Trophy },
    { id: 'cycling', label: 'Cycling', icon: Bike },
    { id: 'running', label: 'Running', icon: Shirt },
    { id: 'swimming', label: 'Swimming', icon: Droplets },
    { id: 'volleyball', label: 'Volleyball', icon: Volleyball }
  ])

  const activeId = ref<string>('soccer')

  function setActive(id: string) {
    activeId.value = id
  }
</script>

<template>
  <Card class="w-[260px] p-0 shadow-sm border-muted">
    <CardHeader class="py-4 px-4">
      <CardTitle class="text-sm font-semibold">Category</CardTitle>
    </CardHeader>
    <CardContent class="px-2 pb-3">
      <div class="flex flex-col gap-1">
        <Button
          v-for="item in categories"
          :key="item.id"
          variant="ghost"
          class="justify-between rounded-xl px-2 py-2 h-auto hover:bg-accent/60"
          @click="setActive(item.id)"
        >
          <div class="flex items-center gap-3">
            <div
              class="grid place-items-center size-6 rounded-lg border"
              :class="
                activeId === item.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground'
              "
            >
              <component :is="item.icon" class="size-3.5" :stroke-width="2" />
            </div>
            <span class="text-sm">{{ item.label }}</span>
          </div>

          <div class="flex items-center gap-1">
            <Check
              v-if="activeId === item.id"
              class="size-4 text-emerald-500"
              :stroke-width="2.5"
            />
            <ChevronRight class="size-4 text-muted-foreground" />
          </div>
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped></style>
