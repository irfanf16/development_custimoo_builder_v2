<script setup lang="ts">
  import { cn } from '@/lib/utils'
  import { computed } from 'vue'

  interface Props {
    images: string[] // list of avatar URLs
    max?: number // how many avatars to show
    size?: string // avatar size in px (default: 36)
    class?: string // extra classes for container
    avatarClass?: string // extra classes for avatars
  }

  const props = defineProps<Props>()

  const size = computed(() => props.size ?? 36)
  const maxToShow = computed(() => props.max ?? 3)

  // visible avatars
  const visible = computed(() => props.images.slice(0, maxToShow.value))

  // remaining avatars
  const remainingCount = computed(() =>
    props.images.length > maxToShow.value ? props.images.length - maxToShow.value : 0
  )
</script>

<template>
  <div :class="cn('flex items-center', props.class)">
    <!-- Avatars -->
    <template v-for="(img, index) in visible" :key="index">
      <img
        :src="img"
        :alt="`avatar-${index}`"
        :style="{
          width: size + 'px',
          height: size + 'px',
          zIndex: 50 + index
        }"
        :class="
          cn(
            avatarClass,
            `rounded-full ring-2 bg-muted ring-background object-cover ${index !== 0 ? '-ml-3' : ''}`
          )
        "
      />
    </template>

    <!-- +N Overlay -->
    <div
      v-if="remainingCount > 0"
      :style="{
        width: size + 'px',
        height: size + 'px',
        zIndex: 50 + visible.length
      }"
      class=""
      :class="
        cn(
          avatarClass,
          `rounded-full ring-2 ring-background object-cover -ml-3 flex items-center justify-center bg-muted text-foreground font-medium`
        )
      "
    >
      +{{ remainingCount }}
    </div>
  </div>
</template>
