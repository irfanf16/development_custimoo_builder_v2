<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { ColorGrid } from '@/components/ui/color-grid'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import type { HTMLAttributes } from 'vue'
  import { cn, cmykStringToHex } from '@/lib/utils'
  import Spinner from '@/components/ui/spinner/Spinner.vue'
  import Autocomplete from '@/components/ui/autocomplete'
  import { pantonesTcx } from '@/lib/pantonesTcx'
  import { pantonesCoated } from '@/lib/pantonesCoated'
  import { useCompanyStore } from '@/stores/company/company.store'
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

  type CustomColorType = 'pantone-tcx' | 'pantone-coated' | 'cmyk' | 'product_color'

  interface Props {
    class?: HTMLAttributes['class']
    palettes: Palette[]
    selectedColor?: string
    loading?: boolean
    allowCustomColor?: boolean
    customPalettes?: Palette[]
    hasSvgColors?: boolean
    parsedLockerRooms?: any[]
    /** Which company setting to use for the "Others" tab: color_type (default) or logo_color_type */
    colorTypeKey?: 'color_type' | 'logo_color_type'
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
    parsedLockerRooms: () => [],
    colorTypeKey: 'color_type'
  })
  const emit = defineEmits<Emits>()

  const companyStore = useCompanyStore()
  const effectiveCustomColorType = computed((): CustomColorType => {
    const setting = (companyStore.settings?.settings?.[props.colorTypeKey] as string) || ''
    if (setting === 'product_color') {
      const logo = (companyStore.settings?.settings?.logo_color_type as string) || 'pantone-tcx'
      return logo as CustomColorType
    }
    return (setting || 'pantone-tcx') as CustomColorType
  })
  const customColorTypeLabel = computed(() => {
    const t = effectiveCustomColorType.value
    if (t === 'pantone-coated') return 'Pantone (Coated)'
    if (t === 'cmyk') return 'CMYK'
    return 'Pantone (TCX)'
  })
  const customPantonePlaceholder = computed(() =>
    effectiveCustomColorType.value === 'pantone-coated' ? 'XXX C' : 'XX-XXXX'
  )

  // Initialize with the first palette's ID
  const currentPaletteId = ref<string>(
    props.palettes.length > 0 ? String(props.palettes[0]?.id || '') : ''
  )
  const activeRoomId = ref<string>('')
  const activeFolderName = ref<string>('')
  const customPantone = ref('')
  const customColor = ref<string | null>(null)
  const pantoneMessage = ref('')
  const cmykCustomInput = ref('')
  const cmykMessage = ref('')

  // Build pantone suggestion items based on company setting (TCX only, Coated only, or both)
  const pantoneItems = computed(() => {
    const t = effectiveCustomColorType.value
    const tcx = (pantonesTcx || []).map(p => ({
      label: `${p.pantone} ${p.name || ''}`.trim(),
      value: p.hex || ''
    }))
    const coated = (pantonesCoated || []).map(p => ({
      label: `${p.pantone} ${p.name || ''}`.trim(),
      value: p.hex || ''
    }))
    if (t === 'pantone-coated') return coated.filter(i => i.value)
    if (t === 'pantone-tcx') return tcx.filter(i => i.value)
    if (t === 'product_color') return coated.filter(i => i.value)
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

  function applyCmykInput() {
    cmykMessage.value = ''
    const hex = cmykStringToHex(cmykCustomInput.value)
    if (hex) {
      emit('color-select', { name: cmykCustomInput.value, value: hex, position: 0 })
    } else if (cmykCustomInput.value.trim()) {
      cmykMessage.value = 'Use format: 0, 0, 0, 0'
    }
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
          <!-- Pantone (TCX) or Pantone (Coated) based on company setting -->
          <div v-if="effectiveCustomColorType !== 'cmyk'">
            <label class="text-sm font-medium mb-2">{{ customColorTypeLabel }}</label>
            <div class="relative">
              <Autocomplete
                v-model="customPantone"
                :items="pantoneItems"
                :placeholder="customPantonePlaceholder"
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
          <!-- CMYK: 4 comma-separated values (C, M, Y, K) converted to hex -->
          <div v-else>
            <label class="text-sm font-medium mb-2">CMYK</label>
            <div class="flex gap-2 items-center">
              <input
                v-model="cmykCustomInput"
                type="text"
                class="flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="0, 0, 0, 0"
                @keydown.enter="applyCmykInput"
              />
              <span
                v-if="cmykStringToHex(cmykCustomInput)"
                class="w-8 h-8 rounded border shrink-0"
                :style="{ background: cmykStringToHex(cmykCustomInput) || 'transparent' }"
              />
              <button
                type="button"
                class="shrink-0 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                @click="applyCmykInput"
              >
                Apply
              </button>
            </div>
            <div v-if="cmykMessage" class="text-destructive text-xs mt-1">
              {{ cmykMessage }}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
