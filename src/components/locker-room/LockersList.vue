<script setup lang="ts">
  import { Card } from '@/components/ui/card'
  import { Checkbox } from '@/components/ui/checkbox'
  import { DotSeparator } from '@/components/ui/separator'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
  import { useLockerRoomStore } from '@/stores/locker-room/locker-room.store'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, ref } from 'vue'

  import { Button } from '@/components/ui/button'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
  } from '@/components/ui/dropdown-menu'
  import { Spinner } from '@/components/ui/spinner'
  import { onImageError, PLACEHOLDER_IMAGE } from '@/helpers/imageHelper'
  import { MoreVertical, Pencil, Calendar, SwatchBook } from 'lucide-vue-next'
  import { confirmDialog } from '@/lib/confirm-dialog'
  import { useUIStore } from '@/stores/ui/ui.store'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import type { Locker } from '@/services/lockers/types'
  import CreateLockerDialog from '@/components/locker-room/CreateLockerDialog.vue'
  import {
    locker_delete_locker_title,
    locker_delete_locker_description,
    locker_edit_locker_tooltip,
    locker_designs_count,
    locker_delete,
    time_ago_just_now,
    time_ago_seconds,
    time_ago_seconds_plural,
    time_ago_minutes,
    time_ago_minutes_plural,
    time_ago_hours,
    time_ago_hours_plural,
    time_ago_days,
    time_ago_days_plural,
    time_ago_yesterday,
    time_ago_months,
    time_ago_months_plural,
    time_ago_years,
    time_ago_years_plural,
    locker_no_items
  } from '@/paraglide/messages'
  import { timeAgo as timeAgoUtil } from '@/lib/utils'
  type SortOption = 'lastModified' | 'alphabetical' | 'createdDate'

  const props = withDefaults(
    defineProps<{
      sort?: SortOption
      search: null | string
      isCreatingCollection: boolean
      selectedLockers?: (string | number)[]
      selectedProductsByLocker?: Record<number, number[]>
    }>(),
    {
      search: null,
      sort: 'lastModified',
      isCreatingCollection: false,
      selectedLockers: () => [],
      selectedProductsByLocker: () => ({})
    }
  )

  const emit = defineEmits([
    'select-locker',
    'edit-locker',
    'copy-locker',
    'open-locker',
    'toggle-locker'
  ])

  const hoveringToolbar = ref<Array<boolean>>([])
  const dropdownOpwnIndex = ref<Array<number | undefined>>([])
  const lockerRoomStore = useLockerRoomStore()
  const createEditDialogOpen = ref<boolean>(false)
  const lockerToEdit = ref<Locker | null>(null)
  const { isLoading, lockers } = storeToRefs(lockerRoomStore)
  const uiStore = useUIStore()
  const profileStore = useProfileStore()
  const locale = computed(() => profileStore.currentLocale || 'en')

  const timeAgoMessages = computed(() => ({
    just_now: () => time_ago_just_now({}, { locale: locale.value }),
    seconds: (params: { count: number }) => time_ago_seconds(params, { locale: locale.value }),
    seconds_plural: (params: { count: number }) =>
      time_ago_seconds_plural(params, { locale: locale.value }),
    minutes: (params: { count: number }) => time_ago_minutes(params, { locale: locale.value }),
    minutes_plural: (params: { count: number }) =>
      time_ago_minutes_plural(params, { locale: locale.value }),
    hours: (params: { count: number }) => time_ago_hours(params, { locale: locale.value }),
    hours_plural: (params: { count: number }) =>
      time_ago_hours_plural(params, { locale: locale.value }),
    days: (params: { count: number }) => time_ago_days(params, { locale: locale.value }),
    days_plural: (params: { count: number }) =>
      time_ago_days_plural(params, { locale: locale.value }),
    yesterday: () => time_ago_yesterday({}, { locale: locale.value }),
    months: (params: { count: number }) => time_ago_months(params, { locale: locale.value }),
    months_plural: (params: { count: number }) =>
      time_ago_months_plural(params, { locale: locale.value }),
    years: (params: { count: number }) => time_ago_years(params, { locale: locale.value }),
    years_plural: (params: { count: number }) =>
      time_ago_years_plural(params, { locale: locale.value })
  }))

  const localizedTimeAgo = (dateTime: string) => timeAgoUtil(dateTime, timeAgoMessages.value)

  onMounted(() => {
    if (!lockers.value.length) {
      lockerRoomStore.fetchLockers()
    }
  })

  const baseStorageUrl = computed(() => import.meta.env.VITE_APP_STORAGE_URL || '')
  const computedLockers = computed(() => lockers.value || [])
  const getDateValue = (value?: string) => (value ? new Date(value).getTime() : 0)

  const lockerSorters: Record<SortOption, (a: Locker, b: Locker) => number> = {
    lastModified: (a, b) => getDateValue(b.updated_at) - getDateValue(a.updated_at),
    alphabetical: (a, b) => a.room_name.localeCompare(b.room_name),
    createdDate: (a, b) =>
      getDateValue(b.created_at ?? b.updated_at) - getDateValue(a.created_at ?? a.updated_at)
  }

  const sortedLockers = computed(() => {
    const sorter = lockerSorters[props.sort] || lockerSorters.lastModified
    return [...computedLockers.value].sort(sorter)
  })

  const filteredLockers = computed(() => {
    const searchTerm = props.search?.toLowerCase().trim()
    if (!searchTerm) {
      return sortedLockers.value
    }
    return sortedLockers.value.filter(l => l.room_name.toLowerCase().includes(searchTerm))
  })

  const lockersToShow = computed(() => {
    const list = filteredLockers.value
    if (props.isCreatingCollection) {
      return list.filter(l => (l.product_count ?? 0) > 0)
    }
    return list
  })

  type CheckboxState = boolean | 'indeterminate'
  const getCheckboxState = (locker: { id: number; product_count: number }): CheckboxState => {
    const selected = props.selectedLockers.includes(locker.id)
    const productIds = props.selectedProductsByLocker[locker.id] ?? []
    const count = productIds.length
    const total = locker.product_count ?? 0
    if (count === 0 && !selected) return false
    if (count > 0 && count < total) return 'indeterminate'
    return true
  }

  const handleToggle = (lockerId: number | string) => {
    emit('toggle-locker', lockerId)
  }

  const onDropdownToggle = (index: number) => {
    if (dropdownOpwnIndex.value.includes(index)) {
      dropdownOpwnIndex.value[index] = undefined
    } else {
      dropdownOpwnIndex.value[index] = index
    }
  }
  function createLocker() {
    lockerToEdit.value = null
    createEditDialogOpen.value = true
  }

  function openEditDialog(locker: Locker) {
    lockerToEdit.value = locker
    createEditDialogOpen.value = true
  }

  defineExpose({ createLocker })

  async function handleLockerDelete(id: number) {
    const ok = await confirmDialog({
      title: locker_delete_locker_title({}, { locale: locale.value }),
      description: locker_delete_locker_description({}, { locale: locale.value })
    })
    if (!ok) return
    await lockerRoomStore.deleteLocker(id)
  }
</script>

<template>
  <Spinner v-if="isLoading" class="size-8 text-primary m-auto mb-4" />
  <div v-else-if="!lockersToShow.length" class="py-8 text-center text-muted-foreground">
    {{ locker_no_items({}, { locale }) }}
  </div>
  <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 relative group">
    <Card
      v-for="(locker, lockerIndex) in lockersToShow"
      :key="locker.id"
      class="group rounded-lg cursor-pointer md:py-0 p-0 bg-transparent relative !gap-0 h-fit duration-150 border-0"
      @click="
        () => {
          emit('open-locker', locker)
        }
      "
      @mouseenter="hoveringToolbar[lockerIndex] = dropdownOpwnIndex.includes(lockerIndex) || true"
      @mouseleave="hoveringToolbar[lockerIndex] = false"
    >
      <!-- Hover Toolbar -->

      <Checkbox
        v-if="!isCreatingCollection"
        :id="`checkbox-addon-${locker.id}`"
        class="absolute top-2 left-2 z-10 size-5 bg-white"
        :class="{
          'top-[calc(0.5rem-1px)] left-[calc(0.5rem-1px)]':
            getCheckboxState(locker) === true || getCheckboxState(locker) === 'indeterminate'
        }"
        :model-value="getCheckboxState(locker)"
        @update:model-value="handleToggle(locker.id)"
        @click.stop
      />

      <!-- Thumbnail -->
      <div
        class="bg-secondary rounded-md md:aspect-4/3 grid overflow-hidden gap-1 place-items-start p-[20px] border relative"
        :class="[
          locker.product_thumbnails.length === 1 && 'grid-cols-1 md:place-items-center',
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
            @error="onImageError"
          />
        </template>
        <template v-else>
          <img
            :src="PLACEHOLDER_IMAGE"
            class="h-full overflow-hidden object-contain rounded-md mx-auto w-full"
          />
        </template>
        <div
          v-if="!isCreatingCollection"
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
                {{ locker_delete({}, { locale }) }}
              </DropdownMenuItem>
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
                    @click="openEditDialog(locker)"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ locker_edit_locker_tooltip({}, { locale }) }}</p>
                </TooltipContent>
              </Tooltip>
              <!-- <Tooltip>
                <TooltipTrigger as-child>
                  <Button size="icon" variant="secondary" class="h-7 w-7 rounded-full shadow">
                    <Copy class="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
              </Tooltip> -->
            </TooltipProvider>
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="metadata" @click.stop="emit('open-locker', locker)">
        <div class="mt-2 text-sm font-medium">{{ locker.room_name }}</div>
        <div class="text-xs text-muted-foreground flex gap-1 items-center">
          <span class="flex items-center gap-1">
            <SwatchBook class="size-3.5 inline-block" />
            {{ locker.product_count }} {{ locker_designs_count({}, { locale }) }}
          </span>
          <DotSeparator class="bg-muted-foreground" />
          <span class="flex items-center gap-1">
            <Calendar class="size-3.5 inline-block" />
            {{ localizedTimeAgo(locker.updated_at) }}
          </span>
        </div>
      </div>
    </Card>
  </div>
  <CreateLockerDialog
    :open="createEditDialogOpen"
    :locker="lockerToEdit"
    @update:open="
      evt => {
        createEditDialogOpen = evt
        lockerToEdit = null
      }
    "
  />
</template>
