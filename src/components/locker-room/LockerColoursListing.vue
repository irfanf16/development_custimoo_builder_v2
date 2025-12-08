<script setup lang="ts">
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import type { Colour } from '@/services/lockers/types'

  type ColourProps = {
    colour_group: Colour[]
    group_name: string
  }

  defineProps<{ colours: ColourProps[] }>()
</script>
<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(color, group_index) in colours"
      :key="group_index"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
    >
      <!-- Thumbnail -->
      <div
        class="bg-secondary rounded-md aspect-video overflow-hidden grid border relative place-items-center"
        :class="{
          'grid-cols-3': color.colour_group.length >= 3,
          'grid-cols-2': color.colour_group.length === 2,
          'grid-cols-1': color.colour_group.length === 1
        }"
      >
        <div
          v-for="(c, cInd) in color.colour_group.slice(0, 3)"
          :key="cInd"
          class="w-full h-full"
          :style="{ backgroundColor: c.value }"
          :title="c.name"
        ></div>
      </div>

      <!-- Metadata -->
      <div class="flex flex-col items-center justify-center gap-2">
        <div class="mt-2 text-sm text-center font-medium">{{ color.group_name }}</div>
        <Button variant="outline" class="w-full">Use In Design</Button>
      </div>
    </Card>
  </div>
</template>
