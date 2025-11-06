<template>
  <div class="space-y-6">
    <!-- Tabs -->
    <Tabs v-model="profileStore.addressTabs" class="w-full">
      <TabsList class="flex w-full border-b border-border bg-[#F5F5F5] rounded-lg overflow-hidden">
        <TabsTrigger
          value="personal"
          class="w-1/2 px-4 py-2 text-center text-sm font-medium transition-colors"
          :class="tabClass('personal')"
        >
          Personal
        </TabsTrigger>
        <TabsTrigger
          value="business"
          class="w-1/2 px-4 py-2 text-center text-sm font-medium transition-colors"
          :class="tabClass('business')"
        >
          Business
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <!-- Form -->
    <form class="space-y-3" @submit.prevent="handleSubmit">
      <!-- Name fields -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <Label for="first_name">First Name *</Label>
          <Input id="first_name" v-model="profileStore.addressForm.first_name" required />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="last_name">Last Name *</Label>
          <Input id="last_name" v-model="profileStore.addressForm.last_name" required />
        </div>
      </div>

      <!-- Email -->
      <div class="flex flex-col gap-1">
        <Label for="email">Email</Label>
        <Input id="email" v-model="profileStore.addressForm.email" type="email" />
      </div>

      <!-- Phone -->
      <div class="flex flex-col gap-1">
        <Label for="phone_number">Phone Number</Label>
        <Input id="phone_number" v-model="profileStore.addressForm.phone_number" />
      </div>

      <!-- Show only for business -->
      <div v-if="profileStore.addressTabs === 'business'" class="flex flex-col gap-1">
        <Label for="company_name">Company Name</Label>
        <Input id="company_name" v-model="profileStore.addressForm.company_name" />
      </div>

      <!-- Address -->
      <div class="flex flex-col gap-1">
        <Label for="address1">Address Line 1</Label>
        <Input id="address1" v-model="profileStore.addressForm.address1" />
      </div>

      <div class="flex flex-col gap-1">
        <Label for="address2">Address Line 2</Label>
        <Input id="address2" v-model="profileStore.addressForm.address2" />
      </div>

      <!-- City and Zip -->
      <div class="flex gap-4">
        <div class="flex flex-col gap-1 w-[75%]">
          <Label for="city">City</Label>
          <Input id="city" v-model="profileStore.addressForm.city" />
        </div>
        <div class="flex flex-col gap-1 w-[35%]">
          <Label for="zip_code">Zip Code</Label>
          <Input id="zip_code" v-model="profileStore.addressForm.zip_code" />
        </div>
      </div>
      <!-- Country -->
      <div class="flex flex-col gap-1">
        <Label for="country">Country *</Label>
        <Select v-model="profileStore.addressForm.country" required>
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent class="max-h-60">
            <SelectItem
              v-for="country in profileStore.countries"
              :key="country.id"
              :value="country.id"
            >
              {{ country.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- State -->
      <div class="flex flex-col gap-1">
        <Label for="state">State</Label>
        <Input id="state" v-model="profileStore.addressForm.state" />
      </div>

      <!-- Default Checkbox -->
      <div class="flex items-center gap-2">
        <Checkbox
          id="checkbox-default"
          :model-value="!!profileStore.addressForm.default"
          @update:model-value="
            (val: boolean | 'indeterminate') => {
              profileStore.addressForm.default = val === true
            }
          "
        />
        <Label for="checkbox-default" class="cursor-pointer">Set as default address</Label>
      </div>

      <!-- Buttons -->
      <div class="flex gap-2 justify-end">
        <Button type="button" variant="outline" @click="$emit('cancel')">Cancel</Button>
        <Button type="submit" class="bg-primary text-white hover:text-white">Save</Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, watch } from 'vue'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Button } from '@/components/ui/button'
  import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@/components/ui/select'
  import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
  import { useProfileStore } from '@/stores/profile/profile.store'
  import type { Address, AddressPayload } from '@/services/addresses/types'

  const props = defineProps<{ address?: Address | null }>()
  const emit = defineEmits<{ (e: 'save', payload: AddressPayload): void; (e: 'cancel'): void }>()

  const profileStore = useProfileStore()

  onMounted(profileStore.fetchCountries)

  watch(
    () => props.address,
    address => {
      profileStore.setAddressFromEdit(address ?? null)
    },
    { immediate: true }
  )

  function tabClass(tab: string) {
    return profileStore.addressTabs === tab ? 'text-primary' : 'text-muted-foreground'
  }

  function handleSubmit() {
    const form = profileStore.addressForm
    const countryId = typeof form.country === 'string' ? Number(form.country) : form.country
    if (!countryId) {
      alert('Please select a country')
      return
    }

    const payload: AddressPayload = { ...form, country: countryId }
    emit('save', payload)
  }
</script>
