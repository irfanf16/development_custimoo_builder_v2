<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <Label for="first_name">First Name *</Label>
        <Input id="first_name" v-model="form.first_name" required />
      </div>
      <div>
        <Label for="last_name">Last Name *</Label>
        <Input id="last_name" v-model="form.last_name" required />
      </div>
    </div>

    <div>
      <Label for="email">Email</Label>
      <Input id="email" v-model="form.email" type="email" />
    </div>

    <div>
      <Label for="phone_number">Phone Number</Label>
      <Input id="phone_number" v-model="form.phone_number" />
    </div>

    <div>
      <Label for="company_name">Company Name</Label>
      <Input id="company_name" v-model="form.company_name" />
    </div>

    <div>
      <Label for="address1">Address Line 1</Label>
      <Input id="address1" v-model="form.address1" />
    </div>

    <div>
      <Label for="address2">Address Line 2</Label>
      <Input id="address2" v-model="form.address2" />
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div>
        <Label for="city">City</Label>
        <Input id="city" v-model="form.city" />
      </div>
      <div>
        <Label for="state">State</Label>
        <Input id="state" v-model="form.state" />
      </div>
      <div>
        <Label for="zip_code">Zip Code</Label>
        <Input id="zip_code" v-model="form.zip_code" />
      </div>
    </div>

    <div>
      <Label for="country_id">Country *</Label>
      <Select v-model="form.country_id" required>
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Select a country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="country in countries" :key="country.id" :value="String(country.id)">
            {{ country.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex items-center gap-2">
      <input
        id="default"
        v-model="form.default"
        type="checkbox"
        class="h-4 w-4 rounded border-gray-300"
      />
      <Label for="default" class="cursor-pointer">Set as default address</Label>
    </div>

    <div class="flex gap-2 justify-end">
      <Button type="button" variant="outline" @click="$emit('cancel')">Cancel</Button>
      <Button type="submit">Save</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Button } from '@/components/ui/button'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
  } from '@/components/ui/select'
  import { API } from '@/services'
  import type { Address, AddressPayload } from '@/services/addresses/types'

  const props = defineProps<{ address?: Address | null }>()
  const emit = defineEmits<{ (e: 'save', payload: AddressPayload): void; (e: 'cancel'): void }>()

  const countries = ref<Array<{ id: number; name: string }>>([])
  const form = ref<AddressPayload & { country_id: number | string }>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    company_name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip_code: '',
    country_id: 0,
    default: false
  })

  watch(
    () => props.address,
    address => {
      if (address) {
        form.value = {
          first_name: address.first_name,
          last_name: address.last_name,
          email: address.email || '',
          phone_number: address.phone_number || '',
          company_name: address.company_name || '',
          address1: address.address1 || '',
          address2: address.address2 || '',
          city: address.city || '',
          state: address.state || '',
          zip_code: address.zip_code || '',
          country_id: address.country.id,
          default: isDefault(address)
        }
      } else {
        resetForm()
      }
    },
    { immediate: true }
  )

  function isDefault(address: Address): boolean {
    return address.default === true || address.default === 1
  }

  function resetForm() {
    form.value = {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      company_name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip_code: '',
      country_id: 0,
      default: false
    }
  }

  async function fetchCountries() {
    try {
      const response = await API.addresses.getCountries()
      if (response.success) {
        countries.value = response.result || []
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error)
    }
  }

  function handleSubmit() {
    const countryId =
      typeof form.value.country_id === 'string'
        ? Number(form.value.country_id)
        : form.value.country_id
    if (!countryId || countryId === 0) {
      alert('Please select a country')
      return
    }
    const payload: AddressPayload = {
      ...form.value,
      country_id: countryId
    }
    emit('save', payload)
  }

  onMounted(() => {
    fetchCountries()
  })
</script>
