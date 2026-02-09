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
  import { computed, ref, watch } from 'vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import {
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
      creatingCollection?: boolean
      /** When true (e.g. shared collection view), hide back button and collection list dropdown. */
      readOnly?: boolean
    }>(),
    {
      currentMode: 'list',
      sortOption: 'lastModified',
      currentLocker: null,
      mainTab: 'lockers',
      lockerDetailTab: 'products',
      currentCollection: null,
      collectionCreationStep: 1,
      collectionTab: 'products',
      creatingCollection: false,
      readOnly: false
    }
  )

  const tab = computed(() => props.mainTab)
  const lockerTab = computed(() => props.lockerDetailTab)
  const collectionTab = computed(() => props.collectionTab)
  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const search = ref('')
  const isEditingLocker = ref(false)
  const isEditingCollection = ref(false)
  const lockerRoomStore = useLockerRoomStore()
  const locale = computed(() => profileStore.currentLocale || 'en')
  const { lockers, collections } = storeToRefs(lockerRoomStore)
  const room_name = ref(props.currentLocker?.room_name)
  const collection_name = ref(props.currentCollection?.name ?? '')
  const creatingCollection = ref(props.creatingCollection ?? false)

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

  const updateCollection = () => {
    if (props.currentCollection && collection_name.value) {
      // Don't allow editing name if collection has room_id
      if (props.currentCollection.room_id) {
        isEditingCollection.value = false
        return
      }
      // Emit update event - parent will handle the actual update
      emit('update-collection-name', collection_name.value)
      isEditingCollection.value = false
    }
  }

  const canEditCollection = computed(() => {
    return props.currentCollection && !props.currentCollection.room_id
  })

  const cancelEditCollection = () => {
    collection_name.value = props.currentCollection?.name ?? ''
    isEditingCollection.value = false
  }

  watch(
    () => props.currentCollection,
    newCollection => {
      collection_name.value = newCollection?.name ?? ''
      isEditingCollection.value = false
    }
  )

  watch(
    () => props.creatingCollection,
    newValue => {
      creatingCollection.value = newValue ?? false
    },
    { immediate: true }
  )

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
    'change-current-collection',
    'update-creating-collection',
    'update-collection-name'
  ])
  defineExpose({
    creatingCollection,
    collection_name
  })
</script>
<template>
  <DialogHeader>
    <!-- ========================================================= -->
    <!-- DETAIL MODE HEADER -->
    <!-- ========================================================= -->
    <template v-if="currentMode === 'detail'">
      <div class="flex gap-2 items-center">
        <!-- Read-only shared view: only show collection name, no back or dropdown -->
        <template v-if="readOnly && mainTab === 'collections' && currentCollection">
          <span class="text-lg font-medium">{{ currentCollection.name }}</span>
        </template>
        <template v-else>
          <!-- ---------- BACK BUTTON ---------- -->
          <Button
            v-if="!creatingCollection"
            size="icon"
            variant="outline"
            @click="
              () => {
                emit('change-locker-tab', 'products')
                emit('back')
              }
            "
          >
            <ArrowLeft class="w-5 h-5" />
          </Button>

          <!-- ===================================================== -->
          <!-- LOCKER DETAIL HEADER -->
          <!-- ===================================================== -->
          <template v-if="mainTab === 'lockers' && currentLocker && !creatingCollection">
            <!-- VIEW MODE -->
            <template v-if="!isEditingLocker">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline">
                    {{ currentLocker.room_name }}
                    <ChevronDown class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem
                    v-for="locker in lockers"
                    :key="locker.id"
                    @click="emit('change-current-locker', locker)"
                  >
                    <Check
                      class="w-4 h-4"
                      :class="{
                        'opacity-100': locker.id === currentLocker.id,
                        'opacity-0': locker.id !== currentLocker.id
                      }"
                    />
                    {{ locker.room_name }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" @click="isEditingLocker = true">
                <PencilLine class="w-4 h-4" /> {{ locker_edit({}, { locale }) }}
              </Button>
            </template>

            <!-- EDIT MODE -->
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

          <!-- ===================================================== -->
          <!-- COLLECTION DETAIL HEADER -->
          <!-- ===================================================== -->
          <template v-if="mainTab === 'collections' && currentCollection && !creatingCollection">
            <!-- VIEW MODE -->
            <template v-if="!isEditingCollection">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline">
                    {{ currentCollection.name }}
                    <ChevronDown class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuItem
                    v-for="collection in collections"
                    :key="collection.id"
                    @click="emit('change-current-collection', collection)"
                  >
                    <Check
                      class="w-4 h-4"
                      :class="{
                        'opacity-100': collection.id === currentCollection.id,
                        'opacity-0': collection.id !== currentCollection.id
                      }"
                    />
                    {{ collection.name }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                :disabled="!canEditCollection"
                @click="isEditingCollection = true"
              >
                <PencilLine class="w-4 h-4" /> Edit
              </Button>
            </template>

            <!-- EDIT MODE -->
            <template v-else>
              <Input
                v-model="collection_name"
                class="w-[200px]"
                :placeholder="locker_collection_name_placeholder({}, { locale })"
              />
              <ButtonGroup>
                <Button @click="updateCollection"> <Check class="w-4 h-4" /> Update </Button>
                <Button @click="cancelEditCollection"> <X class="w-4 h-4" /> Cancel </Button>
              </ButtonGroup>
            </template>
          </template>

          <!-- ===================================================== -->
          <!-- COLLECTION CREATION STEP 2 -->
          <!-- ===================================================== -->
          <template
            v-if="
              (creatingCollection || props.creatingCollection) &&
              collectionCreationStep === 2 &&
              mainTab === 'collections'
            "
          >
            <Input
              v-model="collection_name"
              class="w-[200px]"
              :placeholder="locker_collection_name_placeholder({}, { locale })"
            />
          </template>
        </template>
      </div>
    </template>

    <!-- ========================================================= -->
    <!-- LIST MODE HEADER -->
    <!-- ========================================================= -->
    <template v-if="currentMode === 'list'">
      <DialogTitle class="text-xl font-semibold">
        {{
          creatingCollection
            ? locker_select_locker({}, { locale })
            : locker_room_title({}, { locale })
        }}
      </DialogTitle>
    </template>

    <!-- ========================================================= -->
    <!-- HEADER BODY -->
    <!-- ========================================================= -->
    <div class="flex flex-col md:flex-row justify-between gap-2 pb-4 border-b">
      <!-- ================= LIST MODE TABS ================= -->
      <template v-if="currentMode === 'list' && !creatingCollection">
        <Tabs
          v-if="!uiStore.isMobile"
          v-model="tab"
          class="w-[50%]"
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

        <DropdownMenu v-else>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">
              {{ tabLabel }}
              <ChevronDown class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="emit('tab-change', 'lockers')">{{
              locker_lockers_tab({}, { locale })
            }}</DropdownMenuItem>
            <DropdownMenuItem @click="emit('tab-change', 'collections')">{{
              locker_collections_tab({}, { locale })
            }}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>

      <!-- ================= LOCKER DETAIL TABS ================= -->
      <template v-if="currentMode === 'detail' && mainTab === 'lockers' && !creatingCollection">
        <Tabs
          v-if="!uiStore.isMobile"
          v-model="lockerTab"
          class="w-[50%]"
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

        <DropdownMenu v-else>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">
              {{ lockerTabLabel }}
              <ChevronDown class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="emit('change-locker-tab', 'products')">{{
              locker_products_tab({}, { locale })
            }}</DropdownMenuItem>
            <DropdownMenuItem @click="emit('change-locker-tab', 'assets')">{{
              locker_assets_tab({}, { locale })
            }}</DropdownMenuItem>
            <DropdownMenuItem @click="emit('change-locker-tab', 'colours')">{{
              locker_colours_tab({}, { locale })
            }}</DropdownMenuItem>
            <DropdownMenuItem @click="emit('change-locker-tab', 'rosters')">{{
              locker_rosters_tab({}, { locale })
            }}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>

      <!-- ================= COLLECTION DETAIL TABS ================= -->
      <template v-if="currentMode === 'detail' && mainTab === 'collections'">
        <Tabs
          v-if="!uiStore.isMobile"
          v-model="collectionTab"
          class="w-[50%]"
          @update:model-value="val => emit('change-collection-tab', val)"
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

        <DropdownMenu v-else>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">
              {{ collectionTabLabel }}
              <ChevronDown class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="emit('change-collection-tab', 'products')">{{
              locker_products_tab({}, { locale })
            }}</DropdownMenuItem>
            <DropdownMenuItem @click="emit('change-collection-tab', 'preview')">{{
              locker_preview({}, { locale })
            }}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>

      <!-- ================= SEARCH ================= -->
      <template v-if="collectionCreationStep !== 2">
        <InputSearchGroup
          v-model="search"
          :placeholder="ui_search_placeholder({}, { locale })"
          @update:model-value="val => emit('search', val)"
        />
      </template>

      <!-- ================= SORT + CREATE ================= -->
      <template v-if="!creatingCollection">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="flex items-center gap-2">
              <ArrowUpDown class="w-4 h-4" />
              {{ locker_sort({}, { locale }) }}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
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
          @click="tab === 'lockers' ? emit('create-locker') : emit('create-collection')"
        >
          <Plus class="w-4 h-4" />
          {{
            tab === 'collections'
              ? locker_create_collection({}, { locale })
              : locker_create_locker({}, { locale })
          }}
        </Button>
      </template>
    </div>
  </DialogHeader>
</template>
