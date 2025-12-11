<script setup lang="ts">
  import { Card } from '@/components/ui/card'
  import { Checkbox } from '@/components/ui/checkbox'
  import { DotSeparator } from '@/components/ui/separator'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref } from 'vue'

  import { Button } from '@/components/ui/button'
  import { ButtonGroup } from '@/components/ui/button-group'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { Input } from '@/components/ui/input'
  import { Spinner } from '@/components/ui/spinner'
  import { PLACEHOLDER_IMAGE } from '@/helpers/imageHelper'
  import { Check, Copy, MoreVertical, Pencil, X, Calendar, SwatchBook } from 'lucide-vue-next'
  import { confirmDialog } from '@/lib/confirm-dialog'
  import { timeAgo } from '@/lib/utils'
  import { useUIStore } from '@/stores/ui/ui.store'
  const props = withDefaults(
    defineProps<{
      search: null | string
    }>(),
    {
      search: null,
      lockers: () => []
    }
  )

  const emit = defineEmits(['select-locker', 'edit-locker', 'copy-locker', 'open-locker'])

  const hoveringToolbar = ref<Array<boolean>>([])
  const dropdownOpwnIndex = ref<Array<number | undefined>>([])
  const selectedLocker = ref<(string | number)[]>([])
  const lockerRoomStore = useLockerRoomStore()
  const isCreatingLocker = ref<boolean>(false)
  const { isLoading, lockers } = storeToRefs(lockerRoomStore)
  const uiStore = useUIStore()
  const room_name = ref<string | number | undefined>()

  onMounted(() => {
    if (!lockers.value.length) {
      lockerRoomStore.fetchLockers()
    }
  })
  const editingIndex = ref<number | null>(null)
  const editName = ref<string>('')

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const computedLockers = computed(() => lockers.value)
  const filteredLockers = computed(() => {
    return computedLockers.value.filter(l =>
      l.room_name.toLowerCase().includes(props.search?.toLowerCase() || '')
    )
  })

  const handleSelect = (id: string | number) => {
    if (!selectedLocker.value.includes(id)) {
      selectedLocker.value.push(id)
    } else {
      selectedLocker.value = selectedLocker.value.filter(i => i !== id)
    }
    emit('select-locker', selectedLocker.value)
  }

  const onDropdownToggle = (index: number) => {
    if (dropdownOpwnIndex.value.includes(index)) {
      dropdownOpwnIndex.value[index] = undefined
    } else {
      dropdownOpwnIndex.value[index] = index
    }
  }
  function createLocker() {
    isCreatingLocker.value = true
  }
  const saveLocker = async () => {
    if (!room_name.value) return
    await lockerRoomStore.createLocker(room_name.value as string)
    isCreatingLocker.value = false
    room_name.value = undefined
  }

  function startEditing(index: number, locker: any) {
    editingIndex.value = index
    editName.value = locker.room_name
  }

  async function saveEdit(locker: any) {
    if (!editName.value.length) return

    const updated = { ...locker, room_name: editName.value }

    await lockerRoomStore.updateLockers(updated)

    editingIndex.value = null
    editName.value = ''
  }

  function cancelEdit() {
    editingIndex.value = null
    editName.value = ''
  }
  defineExpose({ createLocker })

  async function handleLockerDelete(id: number) {
    const ok = await confirmDialog({
      title: 'Delete this Locker',
      description: 'Are you sure you want to delete this locker?'
    })
    if (!ok) return
    await lockerRoomStore.deleteLocker(id)
  }
</script>

<template>
  <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />
  <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(locker, lockerIndex) in filteredLockers"
      :key="locker.id"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
      @click="handleSelect(locker.id)"
      @mouseenter="hoveringToolbar[lockerIndex] = dropdownOpwnIndex.includes(lockerIndex) || true"
      @mouseleave="hoveringToolbar[lockerIndex] = false"
    >
      <!-- Hover Toolbar -->

      <Checkbox
        :id="`checkbox-addon-${locker.id}`"
        class="absolute top-2 left-2 z-10 size-5 bg-white"
        :class="{
          'top-[calc(0.5rem-1px)] left-[calc(0.5rem-1px)]': selectedLocker.includes(locker.id)
        }"
        :model-value="selectedLocker.includes(locker.id)"
        @update:model-value="handleSelect(locker.id)"
        @click.stop
      />

      <!-- Thumbnail -->
      <div
        class="bg-secondary rounded-md md:aspect-4/3 grid overflow-hidden gap-1 place-items-start p-[20px] border relative"
        :class="[
          locker.product_thumbnails.length === 1 && 'grid-cols-4 md:place-items-center',
          locker.product_thumbnails.length === 2 && 'grid-cols-4 md:grid-cols-2',
          locker.product_thumbnails.length === 3 && 'grid-cols-4 md:grid-cols-2 md:grid-rows-2',
          locker.product_thumbnails.length >= 4 && 'grid-cols-4 md:grid-cols-2 md:grid-rows-2'
        ]"
      >
        <template v-if="locker.product_thumbnails.length">
          <img
            v-for="(img, i) in locker.product_thumbnails.slice(0, 4)"
            :key="i"
            :src="baseStorageUrl + img"
            class="h-full overflow-hidden object-contain rounded-md mx-auto"
            :class="{
              'md:col-span-2': locker.product_thumbnails.length === 3 && i === 2,
              'md:w-full': locker.product_thumbnails.length === 1
            }"
          />
        </template>
        <template v-else>
          <img
            :src="PLACEHOLDER_IMAGE"
            class="h-full overflow-hidden object-contain rounded-md mx-auto w-full"
          />
        </template>
        <div
          class="absolute flex flex-col gap-2 transition-opacity z-20 justify-between h-full p-2 right-0"
          :class="
            uiStore.isMobile ||
            hoveringToolbar[lockerIndex] === true ||
            dropdownOpwnIndex.includes(lockerIndex)
              ? 'opacity-100'
              : 'opacity-0'
          "
          @click.stop
        >
          <DropdownMenu @update:open="onDropdownToggle(lockerIndex)">
            <DropdownMenuTrigger as-child>
              <Button size="icon" variant="secondary" class="h-7 w-7 rounded-full shadow">
                <MoreVertical class="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>

            <!-- FIX: this must be inside group hover zone -->
            <DropdownMenuContent class="w-40 z-[9999]">
              <DropdownMenuItem class="cursor-pointer" @click="handleLockerDelete(locker.id)">
                Delete
              </DropdownMenuItem>
              <!-- <DropdownMenuItem class="cursor-pointer" @click="emit('copy-locker', locker)"> Copy </DropdownMenuItem> -->
            </DropdownMenuContent>
          </DropdownMenu>
          <div class="flex items-center gap-2 flex-col">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    class="h-7 w-7 rounded-full shadow"
                    @click="startEditing(lockerIndex, locker)"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Locker</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button size="icon" variant="secondary" class="h-7 w-7 rounded-full shadow">
                    <Copy class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Order</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <div
        v-if="editingIndex === lockerIndex"
        class="metadata flex gap-2 pt-2 items-center"
        @click.stop
      >
        <Input v-model="editName" placeholder="Locker name" class="flex-1" />

        <ButtonGroup>
          <Button variant="primary" size="default" @click.stop="saveEdit(locker)">
            <Check class="size-4" />
          </Button>

          <Button size="default" variant="secondary" @click.stop="cancelEdit">
            <X class="size-4" />
          </Button>
        </ButtonGroup>
      </div>

      <!-- Normal Metadata -->
      <div v-else class="metadata" @click.stop="emit('open-locker', locker)">
        <div class="mt-2 text-sm font-medium">{{ locker.room_name }}</div>
        <div class="text-xs text-muted-foreground flex gap-1 items-center">
          <span class="flex items-center gap-1">
            <SwatchBook class="size-3.5 inline-block" />
            {{ locker.product_count }} designs
          </span>
          <DotSeparator class="bg-muted-foreground" />
          <span class="flex items-center gap-1">
            <Calendar class="size-3.5 inline-block" />
            {{ timeAgo(locker.updated_at) }}
          </span>
        </div>
      </div>
    </Card>
    <Card
      v-if="isCreatingLocker"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
    >
      <!-- Thumbnail -->
      <div
        class="bg-secondary rounded-md aspect-[4/3] grid overflow-hidden gap-1 place-items-start p-[20px] border relative"
      >
        <img
          :src="PLACEHOLDER_IMAGE"
          class="h-full overflow-hidden object-contain rounded-md mx-auto w-full"
        />
      </div>

      <!-- Metadata -->
      <div class="metadata flex gap-1 pt-2 items-center">
        <div class="text-sm font-medium flex-1">
          <Input v-model="room_name" placeholder="Enter locker name" />
        </div>

        <ButtonGroup>
          <Button variant="primary" size="default" @click="saveLocker">
            <Check class="size-4" />
          </Button>
          <Button size="default" variant="destructive" @click="isCreatingLocker = false">
            <X class="size-4" />
          </Button>
        </ButtonGroup>
      </div>
    </Card>
  </div>
</template>
