<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { ColorGrid } from '@/components/ui/color-grid'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import type { HTMLAttributes } from 'vue'
  import { cn } from '@/lib/utils'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import Autocomplete from '@/components/ui/autocomplete'
  import { pantonesTcx } from '@/lib/pantonesTcx'
  import { pantonesCoated } from '@/lib/pantonesCoated'
  import ScrollArea from '../scroll-area/ScrollArea.vue'

  type OutputColor = {
    position: number
    name: string
    value: string
  }

  type Palette = {
    id: number
    name: string
    colors: OutputColor[]
  }

  interface Props {
    class?: HTMLAttributes['class']
    palettes: Palette[]
    selectedColor?: string
    loading?: boolean
    allowCustomColor?: boolean
    customPalettes?: Palette[]
    hasSvgColors?: boolean
    parsedLockerRooms?: any[]
  }

  interface Emits {
    (e: 'color-select', color: OutputColor): void
  }

  const props = withDefaults(defineProps<Props>(), {
    class: undefined,
    selectedColor: undefined,
    loading: false,
    allowCustomColor: false,
    customPalettes: () => [],
    hasSvgColors: false,
    parsedLockerRooms: () => []
  })
  const emit = defineEmits<Emits>()

  // Initialize with the first palette's ID
  const currentPaletteId = ref<string>(
    props.palettes.length > 0 ? String(props.palettes[0]?.id || '') : ''
  )
  const activeRoomId = ref<string>('')
  const activeFolderName = ref<string>('')
  const customPantone = ref('')
  const customColor = ref<string | null>(null)
  const pantoneMessage = ref('')
  // Build pantone suggestion items from datasets
  const pantoneItems = computed(() => {
    const tcx = (pantonesTcx || []).map(p => ({
      label: `${p.pantone} ${p.name || ''}`.trim(),
      value: p.hex || p.hex || ''
    }))
    const coated = (pantonesCoated || []).map(p => ({
      label: `${p.pantone} ${p.name || ''}`.trim(),
      value: p.hex || p.hex || ''
    }))
    // prefer TCX first, then coated; remove empties
    return [...tcx, ...coated].filter(i => i.value)
  })

  // Update currentPaletteId if palettes change
  watch(
    () => props.palettes,
    newPalettes => {
      if (
        newPalettes.length > 0 &&
        !newPalettes.find(p => String(p?.id || '') === currentPaletteId.value)
      ) {
        currentPaletteId.value = String(newPalettes[0]?.id || '')
      }
    },
    { immediate: true }
  )

  // Get the currently active palette for lazy rendering
  const activePalette = computed(() => {
    return props.palettes.find(p => String(p.id) === currentPaletteId.value) || props.palettes[0]
  })
  const activeCustomPalette = computed(() => {
    return props.customPalettes?.find(p => String(p.id) === currentPaletteId.value)
  })

  function handleColorSelect(color: OutputColor) {
    emit('color-select', color)
  }

  function selectSuggestionFromAuto(item: { label: string; value: string }) {
    customPantone.value = item.label
    customColor.value = item.value
    pantoneMessage.value = ''
    emit('color-select', { name: item.label, value: item.value, position: 0 })
  }
  // Watch for changes in locker rooms to set initial active room and folder
  watch(
    () => props.parsedLockerRooms,
    rooms => {
      if (rooms?.length) {
        activeRoomId.value = String(rooms[0].id)
        activeFolderName.value = rooms[0].folders?.[0]?.folder_name || ''
      }
    },
    { immediate: true }
  )
  // Watch for changes in activeRoomId to update activeFolderName
  watch(activeRoomId, newRoomId => {
    const room = props.parsedLockerRooms?.find(r => String(r.id) === newRoomId)
    if (room?.folders?.length) {
      activeFolderName.value = room.folders[0].folder_name
    } else {
      activeFolderName.value = ''
    }
  })
</script>

<template>
  <div v-if="palettes.length > 0" :class="cn('space-y-3', props.class)" class="space-y-3">
    <!-- Tabs for palettes -->
    <Tabs v-model="currentPaletteId">
      <ScrollArea class="w-full" direction="horizontal">
        <TabsList class="w-max flex flex-start gap-2 justify-start">
          <TabsTrigger
            v-for="palette in palettes"
            :key="palette.id"
            :value="String(palette.id)"
            class="flex-1"
          >
            {{ palette.name }}
          </TabsTrigger>
          <template v-if="!hasSvgColors">
            <TabsTrigger
              v-for="palette in props.customPalettes"
              :key="palette.id"
              :value="String(palette.id)"
              class="flex-1"
            >
              {{ palette.name }}
            </TabsTrigger>
          </template>
          <template v-if="!hasSvgColors && props.parsedLockerRooms?.length">
            <TabsTrigger class="flex-1" value="locker-room"> Locker Rooms </TabsTrigger>
          </template>
          <TabsTrigger
            v-if="props.allowCustomColor && !props.hasSvgColors"
            value="custom"
            class="flex-1"
          >
            Others
          </TabsTrigger>
        </TabsList>
      </ScrollArea>

      <!-- Only render the active tab content for better performance -->
      <TabsContent v-if="activePalette" :value="String(activePalette.id)">
        <div class="relative">
          <ColorGrid
            :colors="activePalette.colors"
            :selected-color="selectedColor"
            :disabled="props.loading"
            class="transition-opacity"
            :class="{ 'opacity-50 pointer-events-none': props.loading }"
            @color-select="handleColorSelect"
          />
          <div v-if="props.loading" class="absolute inset-0 flex items-center justify-center">
            <div class="rounded-full bg-background/80 p-2 shadow-sm">
              <Spinner class="size-5 text-primary" />
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent v-if="activeCustomPalette" :value="String(activeCustomPalette.id)">
        <div class="relative">
          <ColorGrid
            :colors="activeCustomPalette.colors"
            :selected-color="selectedColor"
            :disabled="props.loading"
            class="transition-opacity"
            :class="{ 'opacity-50 pointer-events-none': props.loading }"
            @color-select="handleColorSelect"
          />
          <div v-if="props.loading" class="absolute inset-0 flex items-center justify-center">
            <div class="rounded-full bg-background/80 p-2 shadow-sm">
              <Spinner class="size-5 text-primary" />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent v-if="!hasSvgColors" value="locker-room">
        <div v-if="props.parsedLockerRooms?.length" class="space-y-4">
          <!-- ROOM TABS -->
          <Tabs v-model="activeRoomId">
            <ScrollArea class="w-full" direction="horizontal">
              <TabsList class="flex gap-2 w-max">
                <TabsTrigger
                  v-for="room in props.parsedLockerRooms"
                  :key="room.id"
                  :value="String(room.id)"
                >
                  {{ room.room_name || room.name }}
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            <!-- ROOM CONTENT -->
            <TabsContent
              v-for="room in props.parsedLockerRooms"
              :key="room.id"
              :value="String(room.id)"
            >
              <div class="space-y-3">
                <!-- FOLDER TABS -->
                <Tabs v-model="activeFolderName">
                  <ScrollArea class="w-full" direction="horizontal">
                    <TabsList class="flex gap-2 w-max">
                      <TabsTrigger
                        v-for="folder in room.folders"
                        :key="folder.folder_name"
                        :value="folder.folder_name"
                      >
                        {{ folder.folder_name }}
                      </TabsTrigger>
                    </TabsList>
                  </ScrollArea>
                  <!-- FOLDER CONTENT -->
                  <TabsContent
                    v-for="folder in room.folders"
                    :key="folder.folder_name"
                    :value="folder.folder_name"
                  >
                    <div class="relative">
                      <ColorGrid
                        v-if="folder.colors && folder.colors.some((c: any) => c.value)"
                        :colors="folder.colors"
                        :selected-color="selectedColor"
                        :disabled="props.loading"
                        class="transition-opacity"
                        :class="{ 'opacity-50 pointer-events-none': props.loading }"
                        @color-select="handleColorSelect"
                      />
                      <div
                        v-if="props.loading"
                        class="absolute inset-0 flex items-center justify-center"
                      >
                        <div class="rounded-full bg-background/80 p-2 shadow-sm">
                          <Spinner class="size-5 text-primary" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div v-else class="text-sm text-muted-foreground">No locker room colors available</div>
      </TabsContent>

      <TabsContent v-if="props.allowCustomColor" value="custom">
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium mb-2">Pantone (TCX)</label>
            <div class="relative">
              <Autocomplete
                v-model="customPantone"
                :items="pantoneItems"
                placeholder="XX-XXXX"
                @select="selectSuggestionFromAuto"
              >
                <template #option="{ item }">
                  <span
                    class="w-4 h-4 rounded border shrink-0"
                    :style="{ background: item.value || 'transparent' }"
                  ></span>
                  <div class="text-sm min-w-0 flex-1">
                    <div class="font-medium truncate">{{ item.label }}</div>
                    <div
                      v-if="item.value && item.value !== item.label"
                      class="text-xs text-muted-foreground truncate"
                    >
                      {{ item.value }}
                    </div>
                  </div>
                </template>
              </Autocomplete>
            </div>
            <div v-if="pantoneMessage" class="text-destructive text-xs mt-1">
              {{ pantoneMessage }}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
