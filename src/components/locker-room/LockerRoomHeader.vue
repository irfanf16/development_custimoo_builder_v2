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
  import type { Collection, Locker } from '@/services/lockers/types'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { ArrowLeft, ArrowUpDown, Check, ChevronDown, PencilLine, Plus, X } from 'lucide-vue-next'
  import { storeToRefs } from 'pinia'
  import { computed, ref } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
    locker_collection_name_enter_placeholder,
    locker_collection_name_placeholder,
    ui_search_placeholder,
    locker_edit,
    locker_update,
    locker_cancel,
    locker_select_locker,
    locker_room_title,
    locker_lockers_tab,
    locker_collections_tab,
    locker_products_tab,
    locker_assets_tab,
    locker_colours_tab,
    locker_rosters_tab,
    locker_preview,
    locker_sort,
    locker_sort_last_modified,
    locker_sort_alphabetically,
    locker_sort_created_date,
    locker_create_collection,
    locker_create_locker
  } from '@/paraglide/messages'

  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'
  type CollectionTab = 'products' | 'preview'

  const props = withDefaults(
    defineProps<{
      currentMode: 'list' | 'detail'
      sortOption: SortOption
      currentLocker: Locker | null
      mainTab: 'lockers' | 'collections'
      lockerDetailTab: 'products' | 'assets' | 'colours' | 'rosters'
      currentCollection: Collection | null
      collectionCreationStep: number
      collectionTab: CollectionTab
    }>(),
    {
      currentMode: 'list',
      sortOption: 'lastModified',
      currentLocker: null,
      mainTab: 'lockers',
      lockerDetailTab: 'products',
      currentCollection: null,
      collectionCreationStep: 1,
      collectionTab: 'products'
    }
  )

  const tab = computed(() => props.mainTab)
  const lockerTab = computed(() => props.lockerDetailTab)
  const collectionTab = computed(() => props.collectionTab)
  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const search = ref('')
  const isEditingLocker = ref(false)
  const lockerRoomStore = useLockerRoomStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const { lockers, collections } = storeToRefs(lockerRoomStore)
  const room_name = ref(props.currentLocker?.room_name)
  const collection_name = ref(props.currentCollection?.name ?? '')
  const creatingCollection = ref(false)

  // Computed properties for translated tab labels
  const tabLabel = computed(() => {
    return tab.value === 'lockers'
      ? locker_lockers_tab({}, { locale: locale.value })
      : locker_collections_tab({}, { locale: locale.value })
  })

  const lockerTabLabel = computed(() => {
    switch (lockerTab.value) {
      case 'products':
        return locker_products_tab({}, { locale: locale.value })
      case 'assets':
        return locker_assets_tab({}, { locale: locale.value })
      case 'colours':
        return locker_colours_tab({}, { locale: locale.value })
      case 'rosters':
        return locker_rosters_tab({}, { locale: locale.value })
      default:
        return ''
    }
  })

  const collectionTabLabel = computed(() => {
    return collectionTab.value === 'products'
      ? locker_products_tab({}, { locale: locale.value })
      : locker_preview({}, { locale: locale.value })
  })

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
    'change-locker-tab',
    'change-collection-tab',
    'create-collection',
    'change-current-collection'
  ])
  defineExpose({
    creatingCollection,
    collection_name
  })
</script>
<template>
  <DialogHeader>
    <div v-if="currentMode === 'detail'" class="flex gap-2">
      <Button
        v-if="!creatingCollection"
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
      <template v-if="mainTab === 'lockers'">
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
            <Button v-if="!creatingCollection" variant="outline" @click="isEditingLocker = true">
              <PencilLine class="w-4 h-4" /> {{ locker_edit({}, { locale }) }}
            </Button>
          </template>
          <template v-else>
            <Input v-model="room_name" class="w-[200px]" />
            <ButtonGroup>
              <Button @click="updateLocker">
                <Check class="w-4 h-4" />
                {{ locker_update({}, { locale }) }}
              </Button>
              <Button @click="isEditingLocker = false">
                <X class="w-4 h-4" /> {{ locker_cancel({}, { locale }) }}
              </Button>
            </ButtonGroup>
          </template>
        </template>
      </template>

      <template v-if="currentCollection && !creatingCollection">
        <template v-if="!isEditingLocker">
          <DropdownMenu class="w-[200px]">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="flex items-center gap-2">
                {{ currentCollection?.name }}
                <ChevronDown class="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent class="w-48">
              <DropdownMenuItem
                v-for="(collection, index) in collections"
                :key="index"
                @click="emit('change-current-collection', collection)"
              >
                <Check
                  :class="{ '!opacity-100': currentCollection?.id === collection.id }"
                  class="w-4 h-4 opacity-0"
                />
                {{ collection.name }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button v-if="!creatingCollection" variant="outline" @click="isEditingLocker = true">
            <PencilLine class="w-4 h-4" /> Edit
          </Button>
        </template>
        <template v-else>
          <Input
            v-model="collection_name"
            class="w-[200px]"
            :placeholder="locker_collection_name_enter_placeholder({}, { locale })"
          />
          <ButtonGroup>
            <Button @click="updateLocker">
              <Check class="w-4 h-4" />
              Update
            </Button>
            <Button @click="isEditingLocker = false"> <X class="w-4 h-4" /> Cancel </Button>
          </ButtonGroup>
        </template>
      </template>

      <template v-if="!currentCollection && creatingCollection && collectionCreationStep === 2">
        <Input
          v-model="collection_name"
          class="w-[200px]"
          :placeholder="locker_collection_name_placeholder({}, { locale })"
        />
      </template>
    </div>
    <DialogTitle v-if="currentMode === 'list'" class="text-xl font-semibold">
      {{
        creatingCollection
          ? locker_select_locker({}, { locale })
          : locker_room_title({}, { locale })
      }}
    </DialogTitle>
    <div class="flex flex-col md:flex-row items-center justify-between pb-4 border-b h-fit gap-2">
      <div class="flex w-full items-center justify-between gap-2">
        <template v-if="!uiStore.isMobile && currentMode === 'list' && !creatingCollection">
          <Tabs
            v-model="tab"
            default-value="lockers"
            class="space-x-2 w-[50%]"
            @update:model-value="val => emit('tab-change', val)"
          >
            <TabsList class="w-full">
              <TabsTrigger class="w-full" value="lockers">{{
                locker_lockers_tab({}, { locale })
              }}</TabsTrigger>
              <TabsTrigger class="w-full" value="collections">{{
                locker_collections_tab({}, { locale })
              }}</TabsTrigger>
            </TabsList>
          </Tabs>
        </template>
        <template v-else-if="uiStore.isMobile && currentMode === 'list' && !creatingCollection">
          <DropdownMenu v-model="tab" default-value="lockers" class="space-x-2 w-[50%]">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="flex items-center gap-2">
                {{ tabLabel }}
                <ChevronDown class="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-full">
              <DropdownMenuItem
                class="w-full"
                value="lockers"
                @click="emit('tab-change', 'lockers')"
                >{{ locker_lockers_tab({}, { locale }) }}</DropdownMenuItem
              >
              <DropdownMenuItem
                class="w-full"
                value="collections"
                @click="emit('tab-change', 'collections')"
                >{{ locker_collections_tab({}, { locale }) }}</DropdownMenuItem
              >
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
        <template
          v-else-if="
            !uiStore.isMobile &&
            currentMode === 'detail' &&
            tab === 'lockers' &&
            !creatingCollection
          "
        >
          <Tabs
            v-model="lockerTab"
            default-value="products"
            class="space-x-2 w-[50%]"
            @update:model-value="val => emit('change-locker-tab', val)"
          >
            <TabsList class="w-full">
              <TabsTrigger class="w-full" value="products">{{
                locker_products_tab({}, { locale })
              }}</TabsTrigger>
              <TabsTrigger class="w-full" value="assets">{{
                locker_assets_tab({}, { locale })
              }}</TabsTrigger>
              <TabsTrigger class="w-full" value="colours">{{
                locker_colours_tab({}, { locale })
              }}</TabsTrigger>
              <TabsTrigger class="w-full" value="rosters">{{
                locker_rosters_tab({}, { locale })
              }}</TabsTrigger>
            </TabsList>
          </Tabs>
        </template>
        <template
          v-else-if="
            uiStore.isMobile && currentMode === 'detail' && tab === 'lockers' && !creatingCollection
          "
        >
          <DropdownMenu v-model="lockerTab" default-value="products" class="space-x-2 w-[50%]">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="flex items-center gap-2">
                {{ lockerTabLabel }}
                <ChevronDown class="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-full">
              <DropdownMenuItem
                class="w-full"
                value="products"
                @click="emit('change-locker-tab', 'products')"
                >{{ locker_products_tab({}, { locale }) }}</DropdownMenuItem
              >
              <DropdownMenuItem
                class="w-full"
                value="assets"
                @click="emit('change-locker-tab', 'assets')"
                >{{ locker_assets_tab({}, { locale }) }}</DropdownMenuItem
              >
              <DropdownMenuItem
                class="w-full"
                value="colours"
                @click="emit('change-locker-tab', 'colours')"
                >{{ locker_colours_tab({}, { locale }) }}</DropdownMenuItem
              >
              <DropdownMenuItem
                class="w-full"
                value="rosters"
                @click="emit('change-locker-tab', 'rosters')"
                >{{ locker_rosters_tab({}, { locale }) }}</DropdownMenuItem
              >
            </DropdownMenuContent>
          </DropdownMenu>
        </template>

        <template
          v-else-if="!uiStore.isMobile && currentMode === 'detail' && tab === 'collections'"
        >
          <Tabs
            v-model="collectionTab"
            default-value="products"
            class="space-x-2 w-[50%]"
            @update:model-value="
              val => {
                emit('change-collection-tab', val)
              }
            "
          >
            <TabsList class="w-full">
              <TabsTrigger class="w-full" value="products">{{
                locker_products_tab({}, { locale })
              }}</TabsTrigger>
              <TabsTrigger class="w-full" value="preview">{{
                locker_preview({}, { locale })
              }}</TabsTrigger>
            </TabsList>
          </Tabs>
        </template>
        <template v-else-if="uiStore.isMobile && currentMode === 'detail' && tab === 'collections'">
          <DropdownMenu v-model="collectionTab" default-value="products" class="space-x-2 w-[50%]">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="flex items-center gap-2">
                {{ collectionTabLabel }}
                <ChevronDown class="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-full">
              <DropdownMenuItem
                class="w-full"
                value="products"
                @click="emit('change-collection-tab', 'products')"
                >{{ locker_products_tab({}, { locale }) }}</DropdownMenuItem
              >
              <DropdownMenuItem
                class="w-full"
                value="preview"
                @click="emit('change-collection-tab', 'preview')"
                >{{ locker_preview({}, { locale }) }}</DropdownMenuItem
              >
            </DropdownMenuContent>
          </DropdownMenu>
        </template>
        <template v-if="collectionCreationStep !== 2">
          <InputSearchGroup
            v-model="search"
            :placeholder="ui_search_placeholder({}, { locale })"
            class="w-full md:w-[30%]"
            @update:model-value="
              (val: string | number) => {
                emit('search', val)
                search = val as string
              }
            "
          />
        </template>
      </div>
      <div v-if="!creatingCollection" class="flex items-center justify-end gap-2 w-full md:w-fit">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="flex items-center gap-2">
              <ArrowUpDown class="w-4 h-4" />
              {{ locker_sort({}, { locale }) }}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent class="w-48">
            <DropdownMenuItem @click="emit('sort', 'lastModified')">
              <Check
                :class="{ '!opacity-100': sortOption === 'lastModified' }"
                class="w-4 h-4 opacity-0"
              />
              {{ locker_sort_last_modified({}, { locale }) }}
            </DropdownMenuItem>

            <DropdownMenuItem @click="emit('sort', 'alphabetical')">
              <Check
                :class="{ '!opacity-100': sortOption === 'alphabetical' }"
                class="w-4 h-4 opacity-0"
              />
              {{ locker_sort_alphabetically({}, { locale }) }}
            </DropdownMenuItem>

            <DropdownMenuItem @click="emit('sort', 'createdDate')">
              <Check
                :class="{ '!opacity-100': sortOption === 'createdDate' }"
                class="w-4 h-4 opacity-0"
              />
              {{ locker_sort_created_date({}, { locale }) }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          v-if="currentMode === 'list'"
          variant="primary"
          class="w-full md:w-fit"
          @click="() => (tab === 'lockers' ? emit('create-locker') : emit('create-collection'))"
        >
          <Plus class="w-4 h-4" />
          {{
            tab === 'collections'
              ? locker_create_collection({}, { locale })
              : locker_create_locker({}, { locale })
          }}
        </Button>
      </div>
    </div>
  </DialogHeader>
</template>
