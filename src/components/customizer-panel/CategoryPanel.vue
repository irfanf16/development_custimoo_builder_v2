<script setup lang="ts">
  import { computed, ref } from 'vue'
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
  import { useProductsStore } from '@/stores/products'

  const productsStore = useProductsStore()

  type Category = {
    id: string
    label: string
    icon: any
  }

  // const categories = ref<Category[]>([
  //   { id: 'hockey', label: 'Hockey', icon: Dumbbell },
  //   { id: 'soccer', label: 'Soccer', icon: Trophy },
  //   { id: 'basketball', label: 'Basketball', icon: Trophy },
  //   { id: 'cycling', label: 'Cycling', icon: Bike },
  //   { id: 'running', label: 'Running', icon: Shirt },
  //   { id: 'swimming', label: 'Swimming', icon: Droplets },
  //   { id: 'volleyball', label: 'Volleyball', icon: Volleyball }
  // ])

  const activeId = computed(() => {
    return productsStore.lastCategoryId
  })

  function setActive(id: number) {
    productsStore.setlastCategoryId(id)
  }
</script>

<template>
  <!-- <div class="w-[472px] p-1 bg-background/20 rounded-2xl backdrop-blur-[2px]"> -->
  <div class="w-[472px]">
    <Card class="w-full p-0 rounded-2xl shadow-none">
      <CardHeader class="py-6 px-6">
        <CardTitle class="text-xl font-semibold">Category</CardTitle>
      </CardHeader>
      <CardContent class="px-2 pb-2">
        <div class="flex flex-col">
          <Button
            v-for="item in productsStore.categories?.data"
            :key="item.id"
            variant="ghost"
            class="h-14 px-4 rounded-md justify-between"
            @click="setActive(item.id)"
          >
            <div class="flex items-center gap-3">
              <div class="grid place-items-center size-6 rounded-lg border">
                <component :is="Volleyball" class="size-3.5" :stroke-width="2" />
              </div>
              <span class="text-base font-semibold">{{ item.category_name }}</span>
            </div>

            <div class="flex items-center gap-1">
              <Check
                v-if="activeId === item.id"
                class="size-4 text-emerald-500"
                :stroke-width="2.5"
              />
              <ChevronRight class="size-4" />
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped></style>
