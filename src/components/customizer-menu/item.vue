<script setup lang="ts">
  import { computed } from 'vue'
  // import * as icons from "lucide-vue-next"; // Danger: importing all icons will significantly increase the build size
  import {
    Dumbbell,
    Droplets,
    Shapes,
    PaintBucket,
    PencilLine,
    SwatchBook,
    Type,
    Table,
    NotepadText
  } from 'lucide-vue-next'
  // import type { FunctionalComponent } from 'vue'
  // import { ref } from 'vue'
  import { Button } from '@/components/ui/button'

  // Define the icon list as a tuple for type safety
  const menuIconsList = [
    Dumbbell,
    Droplets,
    Shapes,
    PaintBucket,
    PencilLine,
    SwatchBook,
    Type,
    Table,
    NotepadText
  ] as const

  // Extract the icon names as a union type
  type MenuIconName = (typeof menuIconsList)[number]['name']

  const props = defineProps<{
    name: MenuIconName
    isActive?: boolean
  }>()

  const isActive = computed(() => props.isActive || false)
  //const isModified = ref(false)
  // Map icon names to their components
  // const menuIconsMap = Object.fromEntries(
  //   menuIconsList.map(icon => [icon.name, icon])
  // ) as Record<MenuIconName, FunctionalComponent>

  const iconClass = computed(() =>
    isActive.value
      ? 'min-w-[1.5rem] min-h-[1.5rem] bg-transparent'
      : 'min-w-[1.5rem] min-h-[1.5rem] bg-transparent'
  )
  const variant = computed(() => (isActive.value ? 'default' : 'outline'))

  const buttonClass = computed(() =>
    isActive.value
      ? 'w-[56px] h-[56px] p-4 rounded-2xl animate text-primary-foreground display'
      : 'w-[56px] h-[56px] p-4 rounded-2xl animate'
  )
</script>

<template>
  <Button :variant="variant" :class="buttonClass">
    <div class="bg-transparent w-[1.5rem] h-[1.5rem]">
      <Dumbbell
        v-if="props.name === 'Dumbbell'"
        :stroke-width="1.5"
        :class="iconClass"
        class=""
      />
      <Droplets
        v-if="props.name === 'Droplets'"
        :stroke-width="1.5"
        :class="iconClass"
      />
      <Shapes
        v-if="props.name === 'Shapes'"
        :stroke-width="1.5"
        :class="iconClass"
      />
      <PaintBucket
        v-if="props.name === 'PaintBucket'"
        :stroke-width="1.5"
        :class="iconClass"
      />
      <PencilLine
        v-if="props.name === 'PencilLine'"
        :stroke-width="1.5"
        :class="iconClass"
      />
      <SwatchBook
        v-if="props.name === 'SwatchBook'"
        :stroke-width="1.5"
        :class="iconClass"
      />
      <Type
        v-if="props.name === 'Type'"
        :stroke-width="1.5"
        :class="iconClass"
      />
      <Table
        v-if="props.name === 'Table'"
        :stroke-width="1.5"
        :class="iconClass"
      />
      <NotepadText
        v-if="props.name === 'NotepadText'"
        :stroke-width="1.5"
        :class="iconClass"
      />
    </div>
  </Button>
  <!-- </div> -->
</template>
