<script setup lang="ts">
  import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { InputSearchGroup } from '@/components/ui/input-search-group'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Locker } from '@/services/lockers/types'
import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
import { ArrowLeft, ArrowUpDown, Check, ChevronDown, PencilLine, Plus, X } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'

  const props = withDefaults(
    defineProps<{
      currentMode: 'list' | 'detail'
      sortOption: SortOption
      currentLocker: Locker | null
    }>(),
    {
      currentMode: 'list',
      sortOption: 'lastModified',
      currentLocker: null
    }
  )

  const tab = ref<'lockers' | 'collections'>('lockers')
  const lockerTab = ref<'products' | 'assets' | 'colours' | 'rosters'>('products')
  const search = ref('')
  const isEditingLocker = ref(false)
  const lockerRoomStore = useLockerRoomStore()
  const { lockers } = storeToRefs(lockerRoomStore)
  const room_name = ref(props.currentLocker?.room_name)
  const updateLocker = () => {
    if (props.currentLocker) {
      emit('update-locker', { ...props.currentLocker, room_name: room_name.value })
      isEditingLocker.value = false
    }
  }
  const emit = defineEmits([
    'sort',
    'search',
    'create-locker',
    'create-product',
    'update-locker',
    'back',
    'tab-change',
    'change-current-locker',
    'change-locker-tab'
  ])
</script>
<template>
  <DialogHeader>
    <div v-if="currentMode === 'detail'" class="flex gap-2">
      <Button
        size="icon"
        variant="outline"
        @click="
          () => {
            lockerTab = 'products'
            emit('change-locker-tab', 'products')
            emit('back')
          }
        "
      >
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <template v-if="currentLocker">
        <template v-if="!isEditingLocker">
          <DropdownMenu class="w-[200px]">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="flex items-center gap-2">
                {{ currentLocker?.room_name }}
                <ChevronDown class="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent class="w-48">
              <DropdownMenuItem
                v-for="(locker, index) in lockers"
                :key="index"
                @click="emit('change-current-locker', locker)"
              >
                <Check
                  :class="{ '!opacity-100': currentLocker?.id === locker.id }"
                  class="w-4 h-4 opacity-0"
                />
                {{ locker.room_name }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" @click="isEditingLocker = true">
            <PencilLine class="w-4 h-4" /> Edit
          </Button>
        </template>
        <template v-else>
          <Input v-model="room_name" class="w-[200px]" />
          <ButtonGroup>
            <Button @click="updateLocker">
              <Check class="w-4 h-4" />
              Update
            </Button>
            <Button @click="isEditingLocker = false"> <X class="w-4 h-4" /> Cancel </Button>
          </ButtonGroup>
        </template>
      </template>
    </div>
    <DialogTitle v-if="currentMode === 'list'" class="text-xl font-semibold">
      Locker Room
    </DialogTitle>
    <div class="flex items-center justify-between pb-4 border-b h-fit">
      <template v-if="currentMode === 'list'">
        <Tabs
          v-model="tab"
          default-value="lockers"
          class="space-x-2 w-[50%]"
          @update:model-value="val => emit('tab-change', val)"
        >
          <TabsList class="w-full">
            <TabsTrigger class="w-full" value="lockers">Lockers</TabsTrigger>
            <TabsTrigger class="w-full" value="collections">Collections</TabsTrigger>
          </TabsList>
        </Tabs>
      </template>
      <template v-else-if="currentMode === 'detail'">
        <Tabs
          v-model="lockerTab"
          default-value="products"
          class="space-x-2 w-[50%]"
          @update:model-value="val => emit('change-locker-tab', val)"
        >
          <TabsList class="w-full">
            <TabsTrigger class="w-full" value="products">Products</TabsTrigger>
            <TabsTrigger class="w-full" value="assets">Assets</TabsTrigger>
            <TabsTrigger class="w-full" value="colours">Colours</TabsTrigger>
            <TabsTrigger class="w-full" value="rosters">Rosters</TabsTrigger>
          </TabsList>
        </Tabs>
      </template>
      <div class="flex items-center gap-2">
        <InputSearchGroup
          v-model="search"
          placeholder="Search..."
          @update:model-value="
            (val: string | number) => {
              emit('search', val)
              search = val as string
            }
          "
        />
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="flex items-center gap-2">
              <ArrowUpDown class="w-4 h-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent class="w-48">
            <DropdownMenuItem @click="emit('sort', 'lastModified')">
              <Check
                :class="{ '!opacity-100': sortOption === 'lastModified' }"
                class="w-4 h-4 opacity-0"
              />
              Last modified
            </DropdownMenuItem>

            <DropdownMenuItem @click="emit('sort', 'alphabetical')">
              <Check
                :class="{ '!opacity-100': sortOption === 'alphabetical' }"
                class="w-4 h-4 opacity-0"
              />
              Alphabetically
            </DropdownMenuItem>

            <DropdownMenuItem @click="emit('sort', 'createdDate')">
              <Check
                :class="{ '!opacity-100': sortOption === 'createdDate' }"
                class="w-4 h-4 opacity-0"
              />
              Created date
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="primary" @click="emit('create-locker')">
          <Plus class="w-4 h-4" /> Create locker
        </Button>
      </div>
    </div>
  </DialogHeader>
</template>
