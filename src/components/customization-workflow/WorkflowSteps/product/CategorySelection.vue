<script setup lang="ts">
  import { computed } from 'vue'
  import { useProductsStore } from '@/stores/products/products.store.ts'
  import { useWorkflowStore } from '@/stores/workflow/workflow.store'
  import { useCompanyStore } from '@/stores/company/company.store'
  import Accordion from '@/components/ui/accordion/Accordion.vue'
  import AccordionContent from '@/components/ui/accordion/AccordionContent.vue'
  import AccordionItem from '@/components/ui/accordion/AccordionItem.vue'
  import AccordionTrigger from '@/components/ui/accordion/AccordionTrigger.vue'
  import { PanelNavigationItem } from '@/components/ui/panel-navigation-item'
  import { getCategoryIcon } from './icon-utils'

  interface Props {
    onSelectCategory?: (categoryId: number) => void
  }

  const props = defineProps<Props>()
  const productsStore = useProductsStore()
  const workflowStore = useWorkflowStore()
  const companyStore = useCompanyStore()
  const categories = computed(() => productsStore.categories?.data ?? [])

  const storage_url = (import.meta.env.VITE_APP_STORAGE_URL as string) || ''

  function handleSelectCategory(categoryId: number) {
    props.onSelectCategory?.(categoryId)
  }

  function handleSelectSubcategory(parentCategoryId: number, subcategoryId: number) {
    workflowStore.setSelectedCategoryForPreview(parentCategoryId)
    workflowStore.handleSubcategorySelect(subcategoryId)
  }
</script>

<template>
  <div class="flex flex-col">
    <template v-for="item in categories" :key="item.id">
      <Accordion
        v-if="
          companyStore.settings?.ui_branding?.enable_stepper_navigation &&
          item.subcategories?.length
        "
        type="single"
        collapsible
        class="w-full"
        :default-value="
          workflowStore.selectedCategoryId === item.id ? `category-${item.id}` : undefined
        "
      >
        <AccordionItem
          :value="`category-${item.id}`"
          class="border-0 border-b-0 first:border-t-0 last:border-b-0"
        >
          <AccordionTrigger
            class="flex h-14 items-center px-4 py-0 hover:no-underline md:px-6 data-[state=open]:bg-muted/30"
          >
            <div class="flex flex-1 items-center gap-3 text-left">
              <template
                v-if="!companyStore.settings?.ui_branding?.disable_category_navigation_logos"
              >
                <img v-if="item.image_url" :src="storage_url + item.image_url" class="size-6" />
                <component
                  :is="getCategoryIcon(item.icon_name)"
                  v-else-if="item.icon_name"
                  class="size-6 text-primary icon-secondary-from-primary-50"
                />
              </template>
              <span class="text-base font-semibold text-card-foreground whitespace-nowrap">{{
                item.category_name
              }}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent class="px-4 pb-3 pt-0 md:px-6">
            <div class="flex flex-col gap-1 pl-1">
              <button
                v-for="sub in item.subcategories"
                :id="sub.id.toString()"
                :key="sub.id"
                type="button"
                class="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold text-card-foreground whitespace-nowrap transition-colors hover:bg-muted/50"
                @click="handleSelectSubcategory(item.id, sub.id)"
              >
                <template
                  v-if="!companyStore.settings?.ui_branding?.disable_category_navigation_logos"
                >
                  <img v-if="sub.image_url" :src="storage_url + sub.image_url" class="size-5" />
                  <component
                    :is="getCategoryIcon(sub.icon_name)"
                    v-else-if="sub.icon_name"
                    class="size-5 text-primary icon-secondary-from-primary-50"
                  />
                </template>
                {{ sub.category_name }}
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <button
        v-else-if="companyStore.settings?.ui_branding?.enable_stepper_navigation"
        :id="item.id.toString()"
        type="button"
        class="flex h-14 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-muted/50 md:px-6"
        @click="handleSelectCategory(item.id)"
      >
        <template v-if="!companyStore.settings?.ui_branding?.disable_category_navigation_logos">
          <img v-if="item.image_url" :src="storage_url + item.image_url" class="size-6" />
          <component
            :is="getCategoryIcon(item.icon_name)"
            v-else-if="item.icon_name"
            class="size-6 text-primary icon-secondary-from-primary-50"
          />
        </template>
        <span class="text-base font-semibold text-card-foreground whitespace-nowrap">{{
          item.category_name
        }}</span>
      </button>

      <PanelNavigationItem
        v-else
        :id="item.id.toString()"
        @click="() => handleSelectCategory(item.id)"
      >
        <template #content>
          <div class="flex items-center gap-3">
            <template v-if="!companyStore.settings?.ui_branding?.disable_category_navigation_logos">
              <img v-if="item.image_url" :src="storage_url + item.image_url" class="size-6" />
              <component
                :is="getCategoryIcon(item.icon_name)"
                v-else-if="item.icon_name"
                class="size-6 text-primary icon-secondary-from-primary-50"
              />
            </template>
            <span class="text-base font-semibold text-card-foreground whitespace-nowrap">{{
              item.category_name
            }}</span>
          </div>
        </template>
      </PanelNavigationItem>
    </template>
  </div>
</template>

<style scoped>
  /* Category panel specific styles */
</style>
